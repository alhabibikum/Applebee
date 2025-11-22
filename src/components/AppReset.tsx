import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AppReset() {
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const clearAllData = useMutation(api.reset.clearAllData);

  const handleReset = async () => {
    if (confirmationText !== "RESET ALL DATA") {
      alert("Please type 'RESET ALL DATA' to confirm");
      return;
    }

    setIsResetting(true);
    try {
      const result = await clearAllData({});
      alert(`Reset completed! ${result.message}`);
      setShowResetModal(false);
      setConfirmationText("");
    } catch (error) {
      alert(`Reset failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">App Reset & Data Management</h3>
        <p className="text-gray-600 mb-6">
          Manage your application data and reset the app to its initial state when needed.
        </p>
      </div>

      {/* Current Data Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Data Overview</h4>
        <p className="text-sm text-gray-600">Use the backup system in Settings to view detailed data statistics</p>
      </div>

      {/* Reset Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Complete App Reset */}
        <div className="bg-white border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-red-600 text-2xl">🔄</span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Complete App Reset</h4>
              <p className="text-sm text-gray-600">Remove all data and reset to initial state</p>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <span className="text-red-600 text-xl mr-3">⚠️</span>
              <div>
                <h5 className="font-medium text-red-800">Danger Zone</h5>
                <p className="text-sm text-red-700">This will permanently delete ALL data including products, sales, customers, and users (except your admin account).</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Reset All Data
          </button>
        </div>

        {/* Data Export */}
        <div className="bg-white border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-blue-600 text-2xl">📊</span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Data Management</h4>
              <p className="text-sm text-gray-600">Backup and restore your data safely</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <span className="text-blue-600 text-xl mr-3">💡</span>
              <div>
                <h5 className="font-medium text-blue-800">Recommendation</h5>
                <p className="text-sm text-blue-700">Use the Backup & Restore system in Settings for safe data management.</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => alert("Please use the Backup & Restore tab in Settings for comprehensive data management.")}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Backup System
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <span className="text-red-600 text-3xl mr-3">⚠️</span>
              <h3 className="text-lg font-bold text-gray-900">Confirm Complete Reset</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                This action will permanently delete ALL application data including:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-4">
                <li>All products and inventory</li>
                <li>All sales records</li>
                <li>All customer information</li>
                <li>All supplier data</li>
                <li>All purchase records</li>
                <li>All user profiles (except admin)</li>
              </ul>
              <p className="text-red-600 font-medium text-sm">
                This action cannot be undone!
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "RESET ALL DATA" to confirm:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="RESET ALL DATA"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setConfirmationText("");
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting || confirmationText !== "RESET ALL DATA"}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? "Resetting..." : "Reset All Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
