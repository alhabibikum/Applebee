import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { offlineManager } from '../lib/offlineManager';

export function useOfflineQuery(query: any, args: any = {}, table: string) {
  const [offlineData, setOfflineData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Online query
  const onlineData = useQuery(query, args);

  useEffect(() => {
    // Load offline data immediately
    const cachedData = offlineManager.getOfflineData(table);
    setOfflineData(cachedData);
    setIsLoading(false);

    // If online data is available, cache it and use it
    if (onlineData) {
      offlineManager.cacheData(table, onlineData);
      setOfflineData(onlineData);
    }
  }, [onlineData, table]);

  // Return offline data if offline, otherwise online data
  return offlineManager.isOffline() ? offlineData : (onlineData || offlineData);
}
