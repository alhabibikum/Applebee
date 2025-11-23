import { useState, useEffect } from "react";
import { Authenticated, Unauthenticated, useConvexAuth, useQuery, useConvex } from "convex/react";
import { SignInPage } from "./components/SignInPage";
import { SignOutButton } from "./SignOutButton";
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
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50">
          <OfflineIndicator />
          
          {/* Sync Status - Show on desktop */}
          {!isMobile && showSyncStatus && (
            <div className="fixed top-4 right-4 z-40">
              <SyncStatus />
            </div>
          )}
          
          {isMobile ? (
            <>
              <MobileHeader activeSection={activeTab} onNavigate={setActiveTab} />
              <div className="pb-20">
                {renderContent()}
              </div>
              <MobileBottomNav activeSection={activeTab} onNavigate={setActiveTab} />
            </>
          ) : (
            <div className="flex h-screen">
              {/* Desktop Sidebar */}
              <div className="w-64 bg-gradient-to-b from-teal-900 to-teal-800 shadow-2xl flex flex-col">
                {/* Logo Section */}
                <div className="p-6 flex flex-col items-center text-center border-b border-teal-700">
                  <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow-lg mb-4 hover:shadow-xl transition-shadow">
                    <img src="/apple-point-logo.svg" alt="Apple Point" className="w-14 h-14" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">Apple Point</h1>
                  <p className="text-xs text-amber-100 mt-1">Shop Management</p>
                </div>

                <nav className="mt-4 flex-1 overflow-y-auto">
                  <div className="px-2">
                    
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
                        className={`w-full flex items-center space-x-2 px-3 py-2 text-left rounded-md mb-0.5 transition-all duration-200 text-sm ${
                          activeTab === item.id
                            ? "bg-gradient-to-r from-amber-400 to-amber-500 text-teal-900 font-semibold shadow-lg"
                            : "text-amber-100 hover:bg-teal-700/50"
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </nav>

                {/* Logout Button at Bottom */}
                <div className="p-3 border-t border-teal-700">
                  <SignOutButton />
                </div>
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
