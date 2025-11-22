import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserManagement } from "./UserManagement";
import { AppReset } from "./AppReset";
import { MigrationSettings } from "./MigrationSettings";

export function Settings() {
  const [activeTab, setActiveTab] = useState("users");

  const tabs = [
    { id: "users", name: "User Management", icon: "👥", description: "Manage users, roles, and permissions" },
    { id: "general", name: "General Settings", icon: "⚙️", description: "Company info and business settings" },
    { id: "security", name: "Security", icon: "🔒", description: "Password policies and session management" },
    { id: "notifications", name: "Notifications", icon: "🔔", description: "Email and system notifications" },
    { id: "backup", name: "Backup & Restore", icon: "💾", description: "Complete database backup and restore system" },
    { id: "migration", name: "Data Migration", icon: "🔄", description: "Migrate existing data to new format" },
    { id: "reset", name: "App Reset", icon: "🗑️", description: "Reset application data" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "users":
        return <UserManagement />;
      case "general":
        return <GeneralSettings />;
      case "security":
        return <SecuritySettings />;
      case "notifications":
        return <NotificationSettings />;
      case "backup":
        return <EnhancedBackupSettings />;
      case "migration":
        return <MigrationSettings />;
      case "reset":
        return <AppReset />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your application settings and preferences</p>
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                activeTab === tab.id
                  ? "border-red-500 bg-red-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{tab.icon}</span>
                <span className={`font-semibold ${
                  activeTab === tab.id ? "text-red-700" : "text-gray-900"
                }`}>
                  {tab.name}
                </span>
              </div>
              <p className={`text-sm ${
                activeTab === tab.id ? "text-red-600" : "text-gray-500"
              }`}>
                {tab.description}
              </p>
            </button>
          ))}
        </div>

        {/* Mobile Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Desktop Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Desktop Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  const [settings, setSettings] = useState({
    companyName: "CELLO CITY",
    companyAddress: "123 Mobile Street, Tech City",
    companyPhone: "+1 (555) 123-4567",
    companyEmail: "info@cellocity.com",
    currency: "USD",
    taxRate: "0",
    lowStockThreshold: "0",
    autoBackup: true,
    emailNotifications: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Saving settings:", settings);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Company Information Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-blue-600 text-2xl">🏢</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
            <p className="text-sm text-gray-600">Basic company details and contact information</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={settings.companyPhone}
              onChange={(e) => setSettings(prev => ({ ...prev, companyPhone: e.target.value }))}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={settings.companyEmail}
              onChange={(e) => setSettings(prev => ({ ...prev, companyEmail: e.target.value }))}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
              className="form-input"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="BDT">BDT (৳)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={settings.companyAddress}
              onChange={(e) => setSettings(prev => ({ ...prev, companyAddress: e.target.value }))}
              className="form-input"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Business Settings Card */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-green-600 text-2xl">💼</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Business Settings</h3>
            <p className="text-sm text-gray-600">Configure tax rates and inventory thresholds</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Tax Rate (%)
            </label>
            <input
              type="number"
              value={settings.taxRate}
              onChange={(e) => setSettings(prev => ({ ...prev, taxRate: e.target.value }))}
              className="form-input"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Threshold
            </label>
            <input
              type="number"
              value={settings.lowStockThreshold}
              onChange={(e) => setSettings(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">⏳</span>
              Saving...
            </span>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const [settings, setSettings] = useState({
    minPasswordLength: true,
    requireMixedCase: true,
    requireSpecialChars: false,
    sessionTimeout: "30",
    maxLoginAttempts: "5",
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Saving security settings:", settings);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Password Policy Card */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-red-600 text-2xl">🔐</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Password Policy</h3>
            <p className="text-sm text-gray-600">Configure password requirements for user accounts</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Minimum 8 characters</span>
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.minPasswordLength}
              onChange={(e) => setSettings(prev => ({ ...prev, minPasswordLength: e.target.checked }))}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Require uppercase and lowercase letters</span>
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.requireMixedCase}
              onChange={(e) => setSettings(prev => ({ ...prev, requireMixedCase: e.target.checked }))}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Require special characters</span>
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.requireSpecialChars}
              onChange={(e) => setSettings(prev => ({ ...prev, requireSpecialChars: e.target.checked }))}
            />
          </label>
        </div>
      </div>

      {/* Session Management Card */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-purple-600 text-2xl">⏱️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Session Management</h3>
            <p className="text-sm text-gray-600">Control user session timeouts and login attempts</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (minutes)
            </label>
            <input 
              type="number" 
              value={settings.sessionTimeout}
              onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
              className="form-input" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Login Attempts
            </label>
            <input 
              type="number" 
              value={settings.maxLoginAttempts}
              onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: e.target.value }))}
              className="form-input" 
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">⏳</span>
              Saving...
            </span>
          ) : (
            "Save Security Settings"
          )}
        </button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    lowStockAlerts: true,
    dailySalesReports: false,
    newUserRegistrations: true,
    systemMaintenance: true,
    backupCompletion: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Saving notification settings:", settings);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications Card */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-yellow-600 text-2xl">📧</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
            <p className="text-sm text-gray-600">Configure which events trigger email notifications</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Low stock alerts</span>
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.lowStockAlerts}
              onChange={(e) => setSettings(prev => ({ ...prev, lowStockAlerts: e.target.checked }))}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Daily sales reports</span>
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.dailySalesReports}
              onChange={(e) => setSettings(prev => ({ ...prev, dailySalesReports: e.target.checked }))}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">New user registrations</span>
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.newUserRegistrations}
              onChange={(e) => setSettings(prev => ({ ...prev, newUserRegistrations: e.target.checked }))}
            />
          </label>
        </div>
      </div>

      {/* System Notifications Card */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-cyan-600 text-2xl">🔔</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">System Notifications</h3>
            <p className="text-sm text-gray-600">System-level notification preferences</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">System maintenance alerts</span>
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.systemMaintenance}
              onChange={(e) => setSettings(prev => ({ ...prev, systemMaintenance: e.target.checked }))}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Backup completion notifications</span>
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.backupCompletion}
              onChange={(e) => setSettings(prev => ({ ...prev, backupCompletion: e.target.checked }))}
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">⏳</span>
              Saving...
            </span>
          ) : (
            "Save Notification Settings"
          )}
        </button>
      </div>
    </div>
  );
}

function EnhancedBackupSettings() {
  const [settings, setSettings] = useState({
    autoBackup: true,
    backupFrequency: "daily",
    backupTime: "02:00",
    includeProducts: true,
    includeCategories: true,
    includeCustomers: true,
    includeSales: true,
    includePurchases: true,
    includeSuppliers: true,
    includeUsers: true,
    includeStockMovements: true,
  });

  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [backupStats, setBackupStats] = useState<any>(null);
  const [restorePreview, setRestorePreview] = useState<any>(null);

  // Get data for backup
  const products = useQuery(api.products.list, {});
  const categories = useQuery(api.categories.list);
  const customers = useQuery(api.customers.list, {});
  const sales = useQuery(api.sales.list, {});
  const purchases = useQuery(api.purchases.list, {});
  const suppliers = useQuery(api.suppliers.list, {});
  const users = useQuery(api.users.getAllUsers);

  // Mutations
  const restoreFromBackup = useMutation(api.reset.restoreFromBackup);
  const getRestoreStats = useMutation(api.reset.getRestoreStats);
  const createFullBackup = useMutation(api.reset.createFullBackup);
  const verifyBackupIntegrity = useMutation(api.reset.verifyBackupIntegrity);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);
    
    try {
      // Simulate progress
      const progressSteps = [10, 25, 40, 55, 70, 85, 100];
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setBackupProgress(progressSteps[i]);
      }
      
      // Create comprehensive backup data
      const backupData = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: "2.1",
          appName: "CELLO CITY POS",
          backupType: "full",
          totalRecords: 0,
          createdBy: "System Administrator",
        },
        data: {
          ...(settings.includeProducts && { products: products || [] }),
          ...(settings.includeCategories && { categories: categories || [] }),
          ...(settings.includeCustomers && { customers: customers || [] }),
          ...(settings.includeSales && { sales: sales || [] }),
          ...(settings.includePurchases && { purchases: purchases || [] }),
          ...(settings.includeSuppliers && { suppliers: suppliers || [] }),
          ...(settings.includeUsers && { users: users || [] }),
        },
        statistics: {
          productsCount: products?.length || 0,
          categoriesCount: categories?.length || 0,
          customersCount: customers?.length || 0,
          salesCount: sales?.length || 0,
          purchasesCount: purchases?.length || 0,
          suppliersCount: suppliers?.length || 0,
          usersCount: users?.length || 0,
        }
      };

      // Calculate total records
      backupData.metadata.totalRecords = Object.values(backupData.statistics).reduce((sum, count) => sum + count, 0);
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cello-city-full-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setBackupStats(backupData.statistics);
      console.log("Full backup created successfully with", backupData.metadata.totalRecords, "records");
    } catch (error) {
      console.error("Backup creation failed:", error);
      alert("Backup creation failed: " + (error as Error).message);
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      try {
        const fileContent = await file.text();
        const stats = await getRestoreStats({ backupData: fileContent });
        setRestorePreview(stats);
        
        // Verify backup integrity
        const integrity = await verifyBackupIntegrity({ backupData: fileContent });
        if (!integrity.isValid) {
          alert("Backup file has integrity issues: " + integrity.errors.join(", "));
        } else if (integrity.warnings.length > 0) {
          alert("Backup file has warnings: " + integrity.warnings.join(", "));
        } else {
          alert("Backup file verified successfully!");
        }
      } catch (error) {
        console.error("Error analyzing backup file:", error);
        setRestorePreview(null);
      }
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) return;
    
    setIsRestoring(true);
    setRestoreProgress(0);
    
    try {
      // Simulate progress
      const progressSteps = [15, 30, 45, 60, 75, 90, 100];
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setRestoreProgress(progressSteps[i]);
      }
      
      const fileContent = await selectedFile.text();
      const result = await restoreFromBackup({ backupData: fileContent });
      
      console.log("Restore completed:", result);
      alert(`Data restored successfully! ${result.totalRestored} records restored.`);
      
      // Reset file selection
      setSelectedFile(null);
      setRestorePreview(null);
      const fileInput = document.getElementById('restore-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Show success message with option to refresh
      setTimeout(() => {
        if (confirm("Data restored successfully! Would you like to refresh the page to see the changes?")) {
          window.location.reload();
        }
      }, 1000);
    } catch (error) {
      console.error("Restore failed:", error);
      alert(`Restore failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRestoring(false);
      setRestoreProgress(0);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Saving backup settings:", settings);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Backup Configuration Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-indigo-600 text-2xl">⚙️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Backup Configuration</h3>
            <p className="text-sm text-gray-600">Configure what data to include in backups</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.includeProducts}
              onChange={(e) => setSettings(prev => ({ ...prev, includeProducts: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Products ({products?.length || 0})</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.includeCategories}
              onChange={(e) => setSettings(prev => ({ ...prev, includeCategories: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Categories ({categories?.length || 0})</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.includeCustomers}
              onChange={(e) => setSettings(prev => ({ ...prev, includeCustomers: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Customers ({customers?.length || 0})</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.includeSales}
              onChange={(e) => setSettings(prev => ({ ...prev, includeSales: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Sales ({sales?.length || 0})</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.includePurchases}
              onChange={(e) => setSettings(prev => ({ ...prev, includePurchases: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Purchases ({purchases?.length || 0})</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.includeSuppliers}
              onChange={(e) => setSettings(prev => ({ ...prev, includeSuppliers: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Suppliers ({suppliers?.length || 0})</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.includeUsers}
              onChange={(e) => setSettings(prev => ({ ...prev, includeUsers: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Users ({users?.length || 0})</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.includeStockMovements}
              onChange={(e) => setSettings(prev => ({ ...prev, includeStockMovements: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Stock History (0)</span>
          </label>
        </div>

        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={settings.autoBackup}
              onChange={(e) => setSettings(prev => ({ ...prev, autoBackup: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Enable automatic backups</span>
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Frequency
              </label>
              <select 
                className="form-input"
                value={settings.backupFrequency}
                onChange={(e) => setSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Time
              </label>
              <input 
                type="time" 
                value={settings.backupTime}
                onChange={(e) => setSettings(prev => ({ ...prev, backupTime: e.target.value }))}
                className="form-input" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Manual Backup Card */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-green-600 text-2xl">💾</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Manual Backup</h3>
            <p className="text-sm text-gray-600">Create and download comprehensive backups on demand</p>
          </div>
        </div>
        
        {isCreatingBackup && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Creating backup...</span>
              <span>{backupProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${backupProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {backupStats && (
          <div className="mb-4 p-4 bg-green-100 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Last Backup Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-green-700">
              <div>Products: {backupStats.productsCount}</div>
              <div>Categories: {backupStats.categoriesCount}</div>
              <div>Customers: {backupStats.customersCount}</div>
              <div>Sales: {backupStats.salesCount}</div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex-1"
          >
            {isCreatingBackup ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span>
                Creating Full Backup... {backupProgress}%
              </span>
            ) : (
              "Create Full Backup Now"
            )}
          </button>
        </div>
      </div>

      {/* Enhanced Restore Data Card */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-orange-600 text-2xl">📁</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Enhanced Restore System</h3>
            <p className="text-sm text-gray-600">Restore your complete database from a backup file with preview</p>
          </div>
        </div>
        
        {isRestoring && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Restoring data...</span>
              <span>{restoreProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${restoreProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <span className="text-4xl mb-4 block">📁</span>
            <p className="text-gray-600 mb-4">
              {selectedFile ? `Selected: ${selectedFile.name}` : "Select a backup file to restore complete database"}
            </p>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              id="restore-file"
              onChange={handleFileSelect}
            />
            <label htmlFor="restore-file" className="btn-secondary cursor-pointer">
              Choose Backup File
            </label>
          </div>

          {/* Backup Preview */}
          {restorePreview && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-3">Backup File Preview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700"><strong>Created:</strong> {new Date(restorePreview.metadata.timestamp).toLocaleString()}</p>
                  <p className="text-blue-700"><strong>Version:</strong> {restorePreview.metadata.version}</p>
                  <p className="text-blue-700"><strong>Type:</strong> {restorePreview.metadata.backupType}</p>
                </div>
                <div>
                  <p className="text-blue-700"><strong>Total Records:</strong> {restorePreview.metadata.totalRecords}</p>
                  <p className="text-blue-700"><strong>App:</strong> {restorePreview.metadata.appName}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <h5 className="font-medium text-blue-800 mb-2">Data Tables:</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-700">
                  {Object.entries(restorePreview.tables).map(([table, count]) => (
                    <div key={table} className="bg-blue-100 px-2 py-1 rounded">
                      {table}: {count as number}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {selectedFile && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-yellow-600 text-xl mr-3">⚠️</span>
                <div>
                  <h4 className="font-medium text-yellow-800">Warning: Complete Database Restore</h4>
                  <p className="text-sm text-yellow-700">This will replace ALL existing data with the backup data. This action cannot be undone.</p>
                </div>
              </div>
            </div>
          )}
          
          {selectedFile && (
            <div className="flex justify-center">
              <button 
                onClick={handleRestore}
                disabled={isRestoring}
                className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRestoring ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">⏳</span>
                    Restoring Database... {restoreProgress}%
                  </span>
                ) : (
                  "Restore Complete Database"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">⏳</span>
              Saving...
            </span>
          ) : (
            "Save Backup Settings"
          )}
        </button>
      </div>
    </div>
  );
}
