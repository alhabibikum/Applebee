import { useState, useEffect } from "react";
import { Authenticated, Unauthenticated, useConvexAuth, useQuery, useConvex } from "convex/react";
import { SignInPage } from "./components/SignInPage";
import { Dashboard } from "./components/Dashboard";
import { OfflineInventory } from "./components/OfflineInventory";
import { Sales } from "./components/Sales";
import { Customers } from "./components/Customers";
import { Suppliers } from "./components/Suppliers";
import { Reports } from "./components/Reports";
import { Settings } from "./components/Settings";
import { RegularPOS } from "./components/RegularPOS";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { MobileHeader } from "./components/MobileHeader";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { offlineManager } from "./lib/offlineManager";
import { SyncStatus } from "./components/SyncStatus";
import { syncManager } from "./lib/syncManager";
import { localDB } from "./lib/localDatabase";
import { api } from "../convex/_generated/api";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobile, setIsMobile] = useState(false);
  const [useLocalPOS, setUseLocalPOS] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const convex = useConvex();
  const [showSyncStatus, setShowSyncStatus] = useState(false);

  // Initialize local database and sync manager
  useEffect(() => {
    const initializeLocalDB = async () => {
      try {
        await localDB.init();
        syncManager.setConvexClient(convex);
        console.log('Local database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize local database:', error);
      }
    };

    if (isAuthenticated) {
      initializeLocalDB();
    }
  }, [isAuthenticated, convex]);

  // Cache data when online for sync
  const products = useQuery(api.products.list, {});
  const categories = useQuery(api.categories.list, {});
  const customers = useQuery(api.customers.list, {});
  const sales = useQuery(api.sales.list, {});

  useEffect(() => {
    const syncData = async () => {
      if (products && products.length > 0) {
        const productsWithSync = products.map(p => ({
          ...p,
          lastSynced: Date.now(),
          isOffline: false
        }));
        await localDB.batchPut('products', productsWithSync);
      }
    };
    syncData();
  }, [products]);

  useEffect(() => {
    const syncData = async () => {
      if (categories && categories.length > 0) {
        const categoriesWithSync = categories.map(c => ({
          ...c,
          lastSynced: Date.now(),
          isOffline: false
        }));
        await localDB.batchPut('categories', categoriesWithSync);
      }
    };
    syncData();
  }, [categories]);

  useEffect(() => {
    const syncData = async () => {
      if (customers && customers.length > 0) {
        const customersWithSync = customers.map(c => ({
          ...c,
          phone: c.phone || undefined, // Handle optional phone
          lastSynced: Date.now(),
          isOffline: false
        }));
        await localDB.batchPut('customers', customersWithSync);
      }
    };
    syncData();
  }, [customers]);

  useEffect(() => {
    const syncData = async () => {
      if (sales && sales.length > 0) {
        const salesWithSync = sales.map(s => ({
          ...s,
          lastSynced: Date.now(),
          isOffline: false
        }));
        await localDB.batchPut('sales', salesWithSync);
      }
    };
    syncData();
  }, [sales]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveTab} />;
      case "inventory":
        return <OfflineInventory />;
      case "regular-pos":
        return <RegularPOS />;
      case "sales":
        return <Sales />;
      case "customers":
        return <Customers />;
      case "suppliers":
        return <Suppliers />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <>
      <Unauthenticated>
        <SignInPage />
      </Unauthenticated>
      <Authenticated>
        <div className="min-h-screen bg-gray-50">
          <OfflineIndicator />
          
          {/* Sync Status - Show on desktop */}
          {!isMobile && (
            <div 
              className="fixed top-4 right-4 z-40"
              onMouseEnter={() => setShowSyncStatus(true)}
              onMouseLeave={() => setShowSyncStatus(false)}
            >
              <div className={showSyncStatus ? "block" : "hidden"}>
                <SyncStatus />
              </div>
            </div>
          )}
          
          {isMobile ? (
            <>
              <MobileHeader activeTab={activeTab} onNavigate={setActiveTab} />
              <div className="pb-20">
                {/* Mobile Sync Status */}
                <div 
                  className="p-4 bg-white border-b"
                  onMouseEnter={() => setShowSyncStatus(true)}
                  onMouseLeave={() => setShowSyncStatus(false)}
                >
                  <div className={showSyncStatus ? "block" : "hidden"}>
                    <SyncStatus />
                  </div>
                </div>
                {renderContent()}
              </div>
              <MobileBottomNav activeSection={activeTab} onNavigate={setActiveTab} />
            </>
          ) : (
            <div className="flex h-screen">
              {/* Desktop Sidebar */}
              <div className="w-64 bg-white shadow-lg">
                <div className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xl">📱</span>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">Mobile Shop</h1>
                      <p className="text-sm text-gray-500">Management System</p>
                    </div>
                  </div>
                </div>

                <nav className="mt-6">
                  <div className="px-3">
                    
                    {[
                      { id: "dashboard", label: "Dashboard", icon: "📊" },
                      { id: "inventory", label: "Inventory", icon: "📦" },
                      { id: "regular-pos", label: "Regular POS", icon: "🛒" },
                      { id: "sales", label: "Sales", icon: "💰" },
                      { id: "customers", label: "Customers", icon: "👥" },
                      { id: "suppliers", label: "Suppliers", icon: "🏢" },
                      { id: "reports", label: "Reports", icon: "📈" },
                      { id: "settings", label: "Settings", icon: "⚙️" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg mb-1 transition-colors ${
                          activeTab === item.id
                            ? "bg-red-50 text-red-700 border-r-2 border-red-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </nav>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-auto">
                <div className="p-6">
                  {/* POS Mode Toggle - only show when EnhancedPOS is active */}
                  {activeTab === "regular-pos" && !useLocalPOS && (
                    <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                      <label className="flex items-center space-x-2 text-xs">
                        <input
                          type="checkbox"
                          checked={useLocalPOS}
                          onChange={(e) => setUseLocalPOS(e.target.checked)}
                          className="rounded"
                        />
                        <span>Local POS Mode</span>
                      </label>
                    </div>
                  )}
                  {renderContent()}
                </div>
              </div>
            </div>
          )}
        </div>
      </Authenticated>
    </>
  );
}

export default App;
