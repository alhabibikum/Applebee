import { localDB } from './localDatabase';
import { api } from '../../convex/_generated/api';

interface SyncOptions {
  onProgress?: (progress: { current: number; total: number; table: string }) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

class SyncManager {
  private isOnline = navigator.onLine;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private convexClient: any = null;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.startAutoSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.stopAutoSync();
    });
  }

  setConvexClient(client: any) {
    this.convexClient = client;
    if (this.isOnline) {
      this.startAutoSync();
    }
  }

  private startAutoSync() {
    if (this.syncInterval) return;
    
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncToServer().catch(console.error);
      }
    }, 30000);

    // Initial sync
    setTimeout(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncFromServer().catch(console.error);
      }
    }, 1000);
  }

  private stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Sync data from server to local database
  async syncFromServer(options?: SyncOptions): Promise<void> {
    if (!this.convexClient || !this.isOnline || this.isSyncing) return;

    this.isSyncing = true;
    
    try {
      const tables = ['products', 'sales', 'customers', 'categories', 'suppliers'];
      let current = 0;
      const total = tables.length;

      for (const table of tables) {
        try {
          options?.onProgress?.({ current: current++, total, table });

          let serverData: any[] = [];
          
          // Fetch data from server based on table
          switch (table) {
            case 'products':
              serverData = await this.convexClient.query(api.products.list, {});
              break;
            case 'sales':
              serverData = await this.convexClient.query(api.sales.list, {});
              break;
            case 'customers':
              serverData = await this.convexClient.query(api.customers.list, {});
              break;
            case 'categories':
              serverData = await this.convexClient.query(api.categories.list, {});
              break;
            case 'suppliers':
              // Assuming suppliers API exists
              try {
                serverData = await this.convexClient.query(api.suppliers?.list, {});
              } catch {
                serverData = [];
              }
              break;
          }

          // Get last sync timestamp for this table
          const lastSync = await localDB.getMetadata(`lastSync_${table}`) || 0;
          
          // Filter only new/updated items
          const newItems = serverData.filter((item: any) => 
            item._creationTime > lastSync
          );

          if (newItems.length > 0) {
            // Add sync metadata to items
            const itemsWithSync = newItems.map((item: any) => ({
              ...item,
              lastSynced: Date.now(),
              isOffline: false
            }));

            // Batch insert/update local data
            await localDB.batchPut(table as any, itemsWithSync);
            
            // Update last sync timestamp
            await localDB.setMetadata(`lastSync_${table}`, Date.now());
          }

        } catch (error) {
          console.error(`Failed to sync ${table}:`, error);
          options?.onError?.(error as Error);
        }
      }

      options?.onComplete?.();
      
    } catch (error) {
      console.error('Sync from server failed:', error);
      options?.onError?.(error as Error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync local changes to server
  async syncToServer(options?: SyncOptions): Promise<void> {
    if (!this.convexClient || !this.isOnline || this.isSyncing) return;

    this.isSyncing = true;

    try {
      const syncQueue = await localDB.getSyncQueue();
      
      if (syncQueue.length === 0) {
        this.isSyncing = false;
        return;
      }

      let current = 0;
      const total = syncQueue.length;

      for (const queueItem of syncQueue) {
        try {
          options?.onProgress?.({ current: current++, total, table: queueItem.table });

          let success = false;

          // Execute the operation on server
          switch (queueItem.operation) {
            case 'create':
              success = await this.createOnServer(queueItem.table, queueItem.data);
              break;
            case 'update':
              success = await this.updateOnServer(queueItem.table, queueItem.data);
              break;
            case 'delete':
              success = await this.deleteOnServer(queueItem.table, queueItem.data.id);
              break;
          }

          if (success) {
            // Remove from sync queue
            await localDB.removeSyncQueueItem(queueItem.id);
            
            // Update local item to mark as synced
            if (queueItem.operation !== 'delete') {
              const localItem = await localDB.get(queueItem.table as any, queueItem.data._id);
              if (localItem) {
                await localDB.put(queueItem.table as any, {
                  ...localItem,
                  lastSynced: Date.now(),
                  isOffline: false
                });
              }
            }
          } else {
            // Increment retry count
            await localDB.incrementRetryCount(queueItem.id);
          }

        } catch (error) {
          console.error(`Failed to sync queue item ${queueItem.id}:`, error);
          await localDB.incrementRetryCount(queueItem.id);
          options?.onError?.(error as Error);
        }
      }

      options?.onComplete?.();

    } catch (error) {
      console.error('Sync to server failed:', error);
      options?.onError?.(error as Error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async createOnServer(table: string, data: any): Promise<boolean> {
    try {
      switch (table) {
        case 'products':
          await this.convexClient.mutation(api.products.create, data);
          break;
        case 'sales':
          await this.convexClient.mutation(api.sales.create, data);
          break;
        case 'customers':
          await this.convexClient.mutation(api.customers.create, data);
          break;
        case 'categories':
          await this.convexClient.mutation(api.categories.create, data);
          break;
        case 'suppliers':
          // Assuming suppliers API exists
          try {
            await this.convexClient.mutation(api.suppliers?.create, data);
          } catch {
            return false;
          }
          break;
        default:
          return false;
      }
      return true;
    } catch (error) {
      console.error(`Failed to create ${table} on server:`, error);
      return false;
    }
  }

  private async updateOnServer(table: string, data: any): Promise<boolean> {
    try {
      switch (table) {
        case 'products':
          await this.convexClient.mutation(api.products.update, data);
          break;
        case 'customers':
          await this.convexClient.mutation(api.customers.update, data);
          break;
        case 'categories':
          await this.convexClient.mutation(api.categories.update, data);
          break;
        case 'suppliers':
          // Assuming suppliers API exists
          try {
            await this.convexClient.mutation(api.suppliers?.update, data);
          } catch {
            return false;
          }
          break;
        default:
          return false;
      }
      return true;
    } catch (error) {
      console.error(`Failed to update ${table} on server:`, error);
      return false;
    }
  }

  private async deleteOnServer(table: string, id: string): Promise<boolean> {
    try {
      switch (table) {
        case 'products':
          await this.convexClient.mutation(api.products.remove, { id });
          break;
        case 'customers':
          await this.convexClient.mutation(api.customers.remove, { id });
          break;
        case 'categories':
          await this.convexClient.mutation(api.categories.remove, { id });
          break;
        case 'suppliers':
          // Assuming suppliers API exists
          try {
            await this.convexClient.mutation(api.suppliers?.remove, { id });
          } catch {
            return false;
          }
          break;
        default:
          return false;
      }
      return true;
    } catch (error) {
      console.error(`Failed to delete ${table} on server:`, error);
      return false;
    }
  }

  // Manual sync methods
  async forceSyncFromServer(options?: SyncOptions): Promise<void> {
    await this.syncFromServer(options);
  }

  async forceSyncToServer(options?: SyncOptions): Promise<void> {
    await this.syncToServer(options);
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    pendingUploads: number;
    lastSync: Record<string, number>;
  }> {
    const syncQueue = await localDB.getSyncQueue();
    const tables = ['products', 'sales', 'customers', 'categories', 'suppliers'];
    const lastSync: Record<string, number> = {};

    for (const table of tables) {
      lastSync[table] = await localDB.getMetadata(`lastSync_${table}`) || 0;
    }

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingUploads: syncQueue.length,
      lastSync
    };
  }

  // Clear all local data and resync
  async resetAndResync(options?: SyncOptions): Promise<void> {
    const tables = ['products', 'sales', 'customers', 'categories', 'suppliers'];
    
    // Clear all tables
    for (const table of tables) {
      await localDB.clearTable(table as any);
      await localDB.setMetadata(`lastSync_${table}`, 0);
    }

    // Clear sync queue
    await localDB.clearTable('syncQueue');

    // Resync from server
    await this.syncFromServer(options);
  }
}

// Create singleton instance
export const syncManager = new SyncManager();
