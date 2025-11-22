import { useState, useEffect, useCallback } from 'react';
import { localDB } from '../lib/localDatabase';
import { syncManager } from '../lib/syncManager';

type TableName = 'products' | 'sales' | 'customers' | 'categories' | 'suppliers';

interface UseLocalDatabaseOptions {
  autoSync?: boolean;
  syncOnMount?: boolean;
}

export function useLocalDatabase<T extends Record<string, any> = any>(
  table: TableName,
  options: UseLocalDatabaseOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncing, setSyncing] = useState(false);

  const { autoSync = true, syncOnMount = true } = options;

  // Load data from local database
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const localData = await localDB.getAll(table);
      setData(localData as T[]);
    } catch (err) {
      setError(err as Error);
      console.error(`Failed to load ${table} from local database:`, err);
    } finally {
      setLoading(false);
    }
  }, [table]);

  // Create item
  const create = useCallback(async (item: Omit<T, '_id' | '_creationTime'>) => {
    try {
      const newItem = {
        ...item,
        _id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        _creationTime: Date.now(),
        lastSynced: 0,
        isOffline: true
      } as any;

      await localDB.put(table, newItem);
      
      // Add to sync queue
      await localDB.addToSyncQueue({
        table,
        operation: 'create',
        data: newItem
      });

      // Reload data
      await loadData();

      // Auto sync if enabled and online
      if (autoSync && navigator.onLine) {
        setSyncing(true);
        await syncManager.syncToServer();
        setSyncing(false);
        await loadData(); // Reload after sync
      }

      return newItem;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [table, loadData, autoSync]);

  // Update item
  const update = useCallback(async (id: string, updates: Partial<T>) => {
    try {
      const existingItem = await localDB.get(table, id);
      if (!existingItem) {
        throw new Error(`Item with id ${id} not found`);
      }

      const updatedItem = {
        ...existingItem,
        ...updates,
        lastSynced: 0,
        isOffline: true
      } as any;

      await localDB.put(table, updatedItem);
      
      // Add to sync queue
      await localDB.addToSyncQueue({
        table,
        operation: 'update',
        data: updatedItem
      });

      // Reload data
      await loadData();

      // Auto sync if enabled and online
      if (autoSync && navigator.onLine) {
        setSyncing(true);
        await syncManager.syncToServer();
        setSyncing(false);
        await loadData(); // Reload after sync
      }

      return updatedItem;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [table, loadData, autoSync]);

  // Delete item
  const remove = useCallback(async (id: string) => {
    try {
      await localDB.delete(table, id);
      
      // Add to sync queue
      await localDB.addToSyncQueue({
        table,
        operation: 'delete',
        data: { id }
      });

      // Reload data
      await loadData();

      // Auto sync if enabled and online
      if (autoSync && navigator.onLine) {
        setSyncing(true);
        await syncManager.syncToServer();
        setSyncing(false);
        await loadData(); // Reload after sync
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [table, loadData, autoSync]);

  // Get single item
  const getById = useCallback(async (id: string) => {
    try {
      return await localDB.get(table, id) as T | undefined;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [table]);

  // Manual sync
  const sync = useCallback(async () => {
    try {
      setSyncing(true);
      await syncManager.forceSyncFromServer();
      await syncManager.forceSyncToServer();
      await loadData();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [loadData]);

  // Initialize data loading
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync on mount if enabled
  useEffect(() => {
    if (syncOnMount && navigator.onLine) {
      sync();
    }
  }, [syncOnMount, sync]);

  return {
    data,
    loading,
    error,
    syncing,
    create,
    update,
    remove,
    getById,
    sync,
    reload: loadData
  };
}

// Specialized hooks for each table
export function useProducts(options?: UseLocalDatabaseOptions) {
  return useLocalDatabase('products', options);
}

export function useSales(options?: UseLocalDatabaseOptions) {
  return useLocalDatabase('sales', options);
}

export function useCustomers(options?: UseLocalDatabaseOptions) {
  return useLocalDatabase('customers', options);
}

export function useCategories(options?: UseLocalDatabaseOptions) {
  return useLocalDatabase('categories', options);
}

export function useSuppliers(options?: UseLocalDatabaseOptions) {
  return useLocalDatabase('suppliers', options);
}
