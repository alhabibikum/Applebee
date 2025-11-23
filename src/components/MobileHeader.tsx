import { useState } from "react";
import { SignOutButton } from "../SignOutButton";

interface MobileHeaderProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export function MobileHeader({ activeTab, onNavigate }: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "inventory", label: "Inventory", icon: "📦" },
    { id: "regular-pos", label: "Regular POS", icon: "🛒" },
    { id: "sales", label: "Sales", icon: "💰" },
    { id: "customers", label: "Customers", icon: "👥" },
    { id: "suppliers", label: "Suppliers", icon: "🏢" },
    { id: "reports", label: "Reports", icon: "📈" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  const currentPage = menuItems.find(item => item.id === activeTab);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-r from-teal-900 to-teal-800 shadow-lg border-b-4 border-amber-400 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <svg className="w-6 h-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Page Title */}
          <div className="flex items-center space-x-2">
            <span className="text-xl">{currentPage?.icon}</span>
            <h1 className="text-lg font-semibold text-white">{currentPage?.label}</h1>
          </div>

          {/* Logo */}
          <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-teal-900 font-bold text-sm">📱</span>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-gradient-to-b from-teal-900 to-teal-800 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-teal-700 sticky top-0 bg-gradient-to-b from-teal-900 to-teal-800">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <svg className="w-6 h-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow-lg mb-3">
                  <img src="/apple-point-logo.svg" alt="Apple Point" className="w-10 h-10" />
                </div>
                <h1 className="text-xl font-bold text-white">Apple Point</h1>
                <p className="text-xs text-amber-100 mt-1">Shop Management</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-4 flex-1">
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                      activeTab === item.id
                        ? "bg-gradient-to-r from-amber-400 to-amber-500 text-teal-900 font-semibold shadow-lg"
                        : "text-amber-100 hover:bg-teal-700/50"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-teal-700">
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
