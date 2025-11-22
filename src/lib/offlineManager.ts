import { offlineStore } from './offlineStore';
import { api } from '../../convex/_generated/api';

interface ConvexClient {
  query: (query: any, args?: any) => Promise<any>;
  mutation: (mutation: any, args?: any) => Promise<any>;
}

class OfflineManager {
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private convexClient: ConvexClient | null = null;
  private offlineData: any = {};

  constructor() {
    this.setupEventListeners();
    this.initOfflineStore();
  }

  setConvexClient(client: ConvexClient) {
    this.convexClient = client;
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async initOfflineStore() {
    await offlineStore.init();
    
    // Load cached data
    this.offlineData = {
      products: await offlineStore.getData('products') || [],
      categories: await offlineStore.getData('categories') || [],
      customers: await offlineStore.getData('customers') || [],
      sales: await offlineStore.getData('sales') || [],
      suppliers: await offlineStore.getData('suppliers') || [],
      purchases: await offlineStore.getData('purchases') || [],
    };
  }

  async cacheData(table: string, data: any[]) {
    this.offlineData[table] = data;
    await offlineStore.saveData(table, data);
  }

  getOfflineData(table: string): any[] {
    return this.offlineData[table] || [];
  }

  async addOfflineEntry(table: string, entry: any): Promise<string> {
    // Generate temporary ID for offline entry
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const entryWithId = { ...entry, _id: tempId, _creationTime: Date.now(), isOffline: true };

    // Add to local cache
    if (!this.offlineData[table]) {
      this.offlineData[table] = [];
    }
    this.offlineData[table].unshift(entryWithId);
    
    // Save to IndexedDB
    await offlineStore.saveData(table, this.offlineData[table]);

    // Add to pending actions
    await offlineStore.addPendingAction({
      type: 'create',
      table,
      data: entry,
      timestamp: Date.now()
    });

    return tempId;
  }

  async updateOfflineEntry(table: string, id: string, updates: any): Promise<void> {
    const index = this.offlineData[table]?.findIndex((item: any) => item._id === id);
    if (index !== -1) {
      this.offlineData[table][index] = { ...this.offlineData[table][index], ...updates };
      await offlineStore.saveData(table, this.offlineData[table]);

      // Add to pending actions if not already offline entry
      if (!id.startsWith('temp_')) {
        await offlineStore.addPendingAction({
          type: 'update',
          table,
          data: { id, ...updates },
          timestamp: Date.now()
        });
      }
    }
  }

  async deleteOfflineEntry(table: string, id: string): Promise<void> {
    const index = this.offlineData[table]?.findIndex((item: any) => item._id === id);
    if (index !== -1) {
      this.offlineData[table].splice(index, 1);
      await offlineStore.saveData(table, this.offlineData[table]);

      // Add to pending actions if not already offline entry
      if (!id.startsWith('temp_')) {
        await offlineStore.addPendingAction({
          type: 'delete',
          table,
          data: { id },
          timestamp: Date.now()
        });
      }
    }
  }

  async syncPendingActions(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || !this.convexClient) {
      return;
    }

    this.syncInProgress = true;

    try {
      const pendingActions = await offlineStore.getPendingActions();
      
      for (const action of pendingActions.sort((a, b) => a.timestamp - b.timestamp)) {
        try {
          await this.executePendingAction(action);
          await offlineStore.removePendingAction(action.id);
        } catch (error) {
          console.error('Failed to sync action:', action, error);
          // Continue with other actions
        }
      }

      // Refresh data from server after sync
      await this.refreshDataFromServer();
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async executePendingAction(action: any): Promise<void> {
    if (!this.convexClient) return;

    const { type, table, data } = action;

    switch (type) {
      case 'create':
        if (table === 'products') {
          await this.convexClient.mutation(api.products.create, data);
        } else if (table === 'categories') {
          await this.convexClient.mutation(api.categories.create, data);
        } else if (table === 'customers') {
          await this.convexClient.mutation(api.customers.create, data);
        } else if (table === 'sales') {
          await this.convexClient.mutation(api.sales.create, data);
        } else if (table === 'suppliers') {
          await this.convexClient.mutation(api.suppliers.create, data);
        }
        break;

      case 'update':
        if (table === 'products') {
          await this.convexClient.mutation(api.products.update, data);
        } else if (table === 'categories') {
          await this.convexClient.mutation(api.categories.update, data);
        } else if (table === 'customers') {
          await this.convexClient.mutation(api.customers.update, data);
        } else if (table === 'suppliers') {
          await this.convexClient.mutation(api.suppliers.update, data);
        }
        break;

      case 'delete':
        if (table === 'products') {
          await this.convexClient.mutation(api.products.remove, { id: data.id });
        } else if (table === 'categories') {
          await this.convexClient.mutation(api.categories.remove, { id: data.id });
        } else if (table === 'customers') {
          await this.convexClient.mutation(api.customers.remove, { id: data.id });
        } else if (table === 'suppliers') {
          await this.convexClient.mutation(api.suppliers.remove, { id: data.id });
        }
        break;
    }
  }

  private async refreshDataFromServer(): Promise<void> {
    if (!this.convexClient) return;

    try {
      // Fetch fresh data from server
      const [products, categories, customers, sales, suppliers] = await Promise.all([
        this.convexClient.query(api.products.list, {}),
        this.convexClient.query(api.categories.list, {}),
        this.convexClient.query(api.customers.list, {}),
        this.convexClient.query(api.sales.list, {}),
        this.convexClient.query(api.suppliers.list, {}),
      ]);

      // Update cache
      await this.cacheData('products', products);
      await this.cacheData('categories', categories);
      await this.cacheData('customers', customers);
      await this.cacheData('sales', sales);
      await this.cacheData('suppliers', suppliers);

    } catch (error) {
      console.error('Failed to refresh data from server:', error);
    }
  }

  isOffline(): boolean {
    return !this.isOnline;
  }

  getPendingActionsCount(): Promise<number> {
    return offlineStore.getPendingActions().then(actions => actions.length);
  }
}

export const offlineManager = new OfflineManager();
