import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
interface LocalDBSchema extends DBSchema {
  products: {
    key: string;
    value: {
      _id: string;
      _creationTime: number;
      name: string;
      brand?: string;
      model?: string;
      sku?: string;
      imei?: string;
      categoryId?: string;
      condition?: "new" | "used";
      costPrice: number;
      sellingPrice?: number;
      currentStock?: number;
      minStockLevel?: number;
      unit?: string;
      isActive?: boolean;
      supplierName?: string;
      supplierMobile?: string;
      supplierNid?: string;
      specifications?: any;
      usedPhoneDetails?: any;
      lastSynced?: number;
      isOffline?: boolean;
    };
  };
  sales: {
    key: string;
    value: {
      _id: string;
      _creationTime: number;
      saleNumber?: string;
      customerId?: string;
      customerName?: string;
      customerPhone?: string;
      items: Array<{
        productId: string;
        productName: string;
        condition?: string;
        imei?: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }>;
      subtotal: number;
      tax?: number;
      discount: number;
      total: number;
      paymentMethod: string;
      paymentDetails?: any;
      status?: string;
      cashierId?: string;
      cashierName?: string;
      deliveryInfo?: any;
      lastSynced?: number;
      isOffline?: boolean;
    };
  };
  customers: {
    key: string;
    value: {
      _id: string;
      _creationTime: number;
      name: string;
      phone?: string;
      email?: string;
      address?: string;
      totalPurchases: number;
      lastPurchaseDate?: number;
      lastSynced?: number;
      isOffline?: boolean;
    };
  };
  categories: {
    key: string;
    value: {
      _id: string;
      _creationTime: number;
      name: string;
      description?: string;
      color?: string;
      lastSynced?: number;
      isOffline?: boolean;
    };
  };
  suppliers: {
    key: string;
    value: {
      _id: string;
      _creationTime: number;
      name: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      address?: string;
      lastSynced?: number;
      isOffline?: boolean;
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      table: string;
      operation: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
      retryCount: number;
    };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
      lastUpdated: number;
    };
  };
}

class LocalDatabase {
  private db: IDBPDatabase<LocalDBSchema> | null = null;
  private dbName = 'CelloCityDB';
  private version = 1;

  async init(): Promise<void> {
    try {
      this.db = await openDB<LocalDBSchema>(this.dbName, this.version, {
        upgrade(db) {
          // Create object stores
          if (!db.objectStoreNames.contains('products')) {
            const productStore = db.createObjectStore('products', { keyPath: '_id' });
            productStore.createIndex('by_brand', 'brand');
            productStore.createIndex('by_category', 'categoryId');
            productStore.createIndex('by_imei', 'imei');
            productStore.createIndex('by_condition', 'condition');
          }

          if (!db.objectStoreNames.contains('sales')) {
            const salesStore = db.createObjectStore('sales', { keyPath: '_id' });
            salesStore.createIndex('by_customer', 'customerId');
            salesStore.createIndex('by_date', '_creationTime');
            salesStore.createIndex('by_payment_method', 'paymentMethod');
          }

          if (!db.objectStoreNames.contains('customers')) {
            const customerStore = db.createObjectStore('customers', { keyPath: '_id' });
            customerStore.createIndex('by_phone', 'phone');
            customerStore.createIndex('by_name', 'name');
          }

          if (!db.objectStoreNames.contains('categories')) {
            db.createObjectStore('categories', { keyPath: '_id' });
          }

          if (!db.objectStoreNames.contains('suppliers')) {
            const supplierStore = db.createObjectStore('suppliers', { keyPath: '_id' });
            supplierStore.createIndex('by_name', 'name');
          }

          if (!db.objectStoreNames.contains('syncQueue')) {
            const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
            syncStore.createIndex('by_timestamp', 'timestamp');
          }

          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'key' });
          }
        },
      });

      console.log('Local database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize local database:', error);
      throw error;
    }
  }

  // Generic CRUD operations
  async get<T extends keyof LocalDBSchema>(
    table: T,
    id: string
  ): Promise<LocalDBSchema[T]['value'] | undefined> {
    if (!this.db) await this.init();
    return await this.db!.get(table, id);
  }

  async getAll<T extends keyof LocalDBSchema>(
    table: T
  ): Promise<LocalDBSchema[T]['value'][]> {
    if (!this.db) await this.init();
    return await this.db!.getAll(table);
  }

  async put<T extends keyof LocalDBSchema>(
    table: T,
    data: LocalDBSchema[T]['value']
  ): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put(table, data);
  }

  async delete<T extends keyof LocalDBSchema>(
    table: T,
    id: string
  ): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete(table, id);
  }

  // Batch operations for sync
  async batchPut<T extends keyof LocalDBSchema>(
    table: T,
    items: LocalDBSchema[T]['value'][]
  ): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    
    await Promise.all([
      ...items.map(item => store.put(item)),
      tx.done
    ]);
  }

  // Search operations
  async searchProducts(filters: {
    searchTerm?: string;
    brand?: string;
    categoryId?: string;
    condition?: string;
    includeOutOfStock?: boolean;
  }): Promise<LocalDBSchema['products']['value'][]> {
    if (!this.db) await this.init();
    
    let products = await this.db!.getAll('products');
    
    // Apply filters
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      products = products.filter(p => 
        p.name?.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term) ||
        p.model?.toLowerCase().includes(term) ||
        p.imei?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term)
      );
    }

    if (filters.brand) {
      products = products.filter(p => p.brand === filters.brand);
    }

    if (filters.categoryId) {
      products = products.filter(p => p.categoryId === filters.categoryId);
    }

    if (filters.condition) {
      products = products.filter(p => (p.condition || 'new') === filters.condition);
    }

    if (!filters.includeOutOfStock) {
      products = products.filter(p => (p.currentStock || 0) > 0);
    }

    return products;
  }

  async searchCustomers(searchTerm?: string): Promise<LocalDBSchema['customers']['value'][]> {
    if (!this.db) await this.init();
    
    let customers = await this.db!.getAll('customers');
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      customers = customers.filter(c => 
        c.name?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    }

    return customers;
  }

  async getSalesByDateRange(startDate?: number, endDate?: number): Promise<LocalDBSchema['sales']['value'][]> {
    if (!this.db) await this.init();
    
    let sales = await this.db!.getAll('sales');
    
    if (startDate && endDate) {
      sales = sales.filter(s => 
        s._creationTime >= startDate && s._creationTime <= endDate
      );
    }

    return sales.sort((a, b) => b._creationTime - a._creationTime);
  }

  // Sync queue operations
  async addToSyncQueue(operation: {
    table: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
  }): Promise<void> {
    if (!this.db) await this.init();
    
    const queueItem = {
      id: `${operation.table}_${operation.operation}_${Date.now()}_${Math.random()}`,
      ...operation,
      timestamp: Date.now(),
      retryCount: 0
    };

    await this.db!.put('syncQueue', queueItem);
  }

  async getSyncQueue(): Promise<LocalDBSchema['syncQueue']['value'][]> {
    if (!this.db) await this.init();
    return await this.db!.getAll('syncQueue');
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('syncQueue', id);
  }

  async incrementRetryCount(id: string): Promise<void> {
    if (!this.db) await this.init();
    const item = await this.db!.get('syncQueue', id);
    if (item) {
      item.retryCount += 1;
      await this.db!.put('syncQueue', item);
    }
  }

  // Metadata operations
  async setMetadata(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('metadata', {
      key,
      value,
      lastUpdated: Date.now()
    });
  }

  async getMetadata(key: string): Promise<any> {
    if (!this.db) await this.init();
    const result = await this.db!.get('metadata', key);
    return result?.value;
  }

  // Utility methods
  async clearTable<T extends keyof LocalDBSchema>(table: T): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.clear(table);
  }

  async getTableCount<T extends keyof LocalDBSchema>(table: T): Promise<number> {
    if (!this.db) await this.init();
    return await this.db!.count(table);
  }

  // Get unique brands from products
  async getBrands(): Promise<string[]> {
    if (!this.db) await this.init();
    const products = await this.db!.getAll('products');
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))] as string[];
    return brands.sort();
  }

  // Get products by IMEI
  async getProductByIMEI(imei: string): Promise<LocalDBSchema['products']['value'] | undefined> {
    if (!this.db) await this.init();
    const products = await this.db!.getAll('products');
    return products.find(p => p.imei === imei);
  }

  // Close database connection
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Create singleton instance
export const localDB = new LocalDatabase();

// Initialize on module load
localDB.init().catch(console.error);
