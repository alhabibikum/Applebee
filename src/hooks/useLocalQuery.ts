import { useState, useEffect, useCallback } from 'react';
import { localDB } from '../lib/localDatabase';

interface SearchFilters {
  searchTerm?: string;
  brand?: string;
  categoryId?: string;
  condition?: string;
  includeOutOfStock?: boolean;
  startDate?: number;
  endDate?: number;
  paymentMethod?: string;
}

export function useLocalProductQuery(filters: SearchFilters = {}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const products = await localDB.searchProducts(filters);
      setData(products);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to search products:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.searchTerm, filters.brand, filters.categoryId, filters.condition, filters.includeOutOfStock]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, reload: loadData };
}

export function useLocalCustomerQuery(searchTerm?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const customers = await localDB.searchCustomers(searchTerm);
      setData(customers);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to search customers:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, reload: loadData };
}

export function useLocalSalesQuery(filters: SearchFilters = {}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let sales = await localDB.getSalesByDateRange(filters.startDate, filters.endDate);
      
      // Apply additional filters
      if (filters.paymentMethod) {
        sales = sales.filter(s => s.paymentMethod === filters.paymentMethod);
      }

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        sales = sales.filter(s => 
          s.customerName?.toLowerCase().includes(term) ||
          s._id.toLowerCase().includes(term) ||
          s.items?.some((item: any) => 
            item.productName?.toLowerCase().includes(term) ||
            item.imei?.toLowerCase().includes(term)
          )
        );
      }

      setData(sales);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to search sales:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate, filters.paymentMethod, filters.searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, reload: loadData };
}

export function useLocalBrands() {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const brands = await localDB.getBrands();
      setData(brands);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load brands:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, reload: loadData };
}

export function useLocalProductByIMEI(imei: string) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    if (!imei) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const product = await localDB.getProductByIMEI(imei);
      setData(product || null);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to find product by IMEI:', err);
    } finally {
      setLoading(false);
    }
  }, [imei]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, reload: loadData };
}
