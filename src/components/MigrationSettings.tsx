import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function MigrationSettings() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  
  const migrateProducts = useMutation(api.migrations.migrateExistingProducts);

  const handleMigrateProducts = async () => {
    if (!confirm("This will update all existing products without a condition to be marked as 'used'. Continue?")) {
      return;
    }

    setIsMigrating(true);
    try {
      const result = await migrateProducts({});
      setMigrationResult(result);
      alert(result.message);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Migration failed");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Migration Tools</h3>
        <p className="text-gray-600 mb-6">
          Use these tools to migrate your existing data to the new format with separate new and used mobile phone categories.
        </p>

        {/* Product Migration */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-blue-600 text-2xl">📱</span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Migrate Existing Products</h4>
              <p className="text-sm text-gray-600">
                Update all existing products to be categorized as "used" mobile phones
              </p>
            </div>
          </div>

          {migrationResult && (
            <div className="mb-4 p-4 bg-green-100 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-600 text-xl mr-3">✅</span>
                <div>
                  <h5 className="font-medium text-green-800">Migration Completed</h5>
                  <p className="text-sm text-green-700">{migrationResult.message}</p>
                  <p className="text-xs text-green-600 mt-1">
                    Updated {migrationResult.updatedCount} products
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <span className="text-yellow-600 text-xl mr-3">⚠️</span>
              <div>
                <h5 className="font-medium text-yellow-800">Important Information</h5>
                <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside space-y-1">
                  <li>All existing products will be marked as "used" mobile phones</li>
                  <li>This helps maintain historical data while enabling the new/used categorization</li>
                  <li>New products added after migration will need to be explicitly marked as "new" or "used"</li>
                  <li>This migration is safe and can be run multiple times</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleMigrateProducts}
            disabled={isMigrating}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {isMigrating ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span>
                Migrating Products...
              </span>
            ) : (
              "Migrate Existing Products to Used Category"
            )}
          </button>
        </div>

        {/* Migration Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Migration Benefits</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h5 className="font-medium text-gray-800">📱 New Mobile Features</h5>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Separate inventory tracking</li>
                <li>Different pricing strategies</li>
                <li>Warranty management</li>
                <li>Supplier information</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-800">📱 Used Mobile Features</h5>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Previous owner tracking</li>
                <li>Condition assessment</li>
                <li>Battery health monitoring</li>
                <li>Functional issue tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
