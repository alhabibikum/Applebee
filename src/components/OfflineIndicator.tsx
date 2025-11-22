import { useState, useEffect } from 'react';
import { offlineManager } from '../lib/offlineManager';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    const updatePendingCount = async () => {
      const count = await offlineManager.getPendingActionsCount();
      setPendingCount(count);
    };

    // Update status on network change
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Update pending count periodically
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    // Listen for sync events
    const handleSync = () => {
      setSyncing(true);
      setTimeout(() => {
        setSyncing(false);
        updatePendingCount();
      }, 2000);
    };

    window.addEventListener('online', handleSync);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      window.removeEventListener('online', handleSync);
      clearInterval(interval);
    };
  }, []);

  if (!isOffline && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium flex items-center space-x-2 ${
        isOffline ? 'bg-red-500' : syncing ? 'bg-blue-500' : 'bg-orange-500'
      }`}>
        {isOffline ? (
          <>
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            <span>অফলাইন মোড</span>
            {pendingCount > 0 && (
              <span className="bg-red-700 px-2 py-1 rounded-full text-xs">
                {pendingCount} অপেক্ষমাণ
              </span>
            )}
          </>
        ) : syncing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>সিঙ্ক হচ্ছে...</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 bg-white rounded-full"></span>
            <span>সিঙ্ক অপেক্ষমাণ: {pendingCount}</span>
          </>
        )}
      </div>
    </div>
  );
}
