import { useState, useEffect } from "react";

interface MobileBottomNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

export function MobileBottomNav({ activeSection, onNavigate }: MobileBottomNavProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const navItems = [
    { id: "dashboard", name: "Home", icon: "🏠" },
    { id: "pos", name: "POS", icon: "🛒" },
    { id: "inventory", name: "Stock", icon: "📦" },
    { id: "settings", name: "Settings", icon: "⚙️" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className={`
      fixed bottom-0 left-0 right-0 z-50 lg:hidden
      transform transition-transform duration-300 ease-in-out
      ${isVisible ? 'translate-y-0' : 'translate-y-full'}
    `}>
      {/* Background with blur effect */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
        {/* Navigation Items */}
        <div className="grid grid-cols-4 gap-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                relative flex flex-col items-center justify-center py-2 px-1
                min-h-[64px] touch-target transition-all duration-200 ease-in-out
                ${activeSection === item.id 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {/* Active indicator */}
              {activeSection === item.id && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-red-600 rounded-full"></div>
              )}
              
              {/* Icon */}
              <div className={`
                text-xl mb-1 transition-transform duration-200
                ${activeSection === item.id ? 'scale-110' : 'scale-100'}
              `}>
                {item.icon}
              </div>
              
              {/* Label */}
              <span className={`
                text-xs font-medium leading-tight
                ${activeSection === item.id ? 'text-red-600' : 'text-gray-600'}
              `}>
                {item.name}
              </span>
              
              {/* Ripple effect on tap */}
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-current opacity-0 transition-opacity duration-150 hover:opacity-5 active:opacity-10"></div>
              </div>
            </button>
          ))}
        </div>
        
        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-white/95"></div>
      </div>
    </div>
  );
}
