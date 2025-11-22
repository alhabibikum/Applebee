import { useMutation } from 'convex/react';
import { offlineManager } from '../lib/offlineManager';

export function useOfflineMutation(mutation: any, table: string) {
  const onlineMutation = useMutation(mutation);

  return async (args: any) => {
    if (offlineManager.isOffline()) {
      // Handle offline mutation
      if (args.id) {
        // Update operation
        await offlineManager.updateOfflineEntry(table, args.id, args);
      } else {
        // Create operation
        await offlineManager.addOfflineEntry(table, args);
      }
      return Promise.resolve();
    } else {
      // Handle online mutation
      try {
        const result = await onlineMutation(args);
        // Refresh cache after successful mutation
        return result;
      } catch (error) {
        // If online mutation fails, fall back to offline
        if (args.id) {
          await offlineManager.updateOfflineEntry(table, args.id, args);
        } else {
          await offlineManager.addOfflineEntry(table, args);
        }
        throw error;
      }
    }
  };
}
