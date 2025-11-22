import { useState, useEffect } from 'react';
import { syncManager } from '../lib/syncManager';
import { localDB } from '../lib/localDatabase';

export function SyncStatus() {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingUploads: 0,
    lastSync: {} as Record<string, number>
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateStatus = async () => {
      const status = await syncManager.getSyncStatus();
      setSyncStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds

    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    try {
      await syncManager.forceSyncFromServer();
      await syncManager.forceSyncToServer();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString('en-BD');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            syncStatus.isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {syncStatus.isOnline ? 'Online' : 'Offline'}
            </p>
            <p className="text-xs text-gray-500">
              {syncStatus.isSyncing ? 'Syncing...' : 
               syncStatus.pendingUploads > 0 ? `${syncStatus.pendingUploads} pending uploads` : 
               'All synced'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
          
          {syncStatus.isOnline && (
            <button
              onClick={handleManualSync}
              disabled={syncStatus.isSyncing}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Last Sync Times</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(syncStatus.lastSync).map(([table, timestamp]) => (
              <div key={table} className="flex justify-between">
                <span className="text-gray-600 capitalize">{table}:</span>
                <span className="text-gray-900">{formatLastSync(timestamp)}</span>
              </div>
            ))}
          </div>
          
          {syncStatus.pendingUploads > 0 && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800">
                {syncStatus.pendingUploads} changes waiting to sync when online
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
