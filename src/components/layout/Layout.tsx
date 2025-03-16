'use client';

import { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import DashboardSync from '../sync/dashboard/DashboardSync';
import MonitorSync from '../sync/monitor/MonitorSync';
import RecommendationDashboards from '../recommendations/dashboard/RecommendationDashboards';
import RecommendationMonitors from '../recommendations/monitor/RecommendationMonitors';
import Home from '../home/Home';
import { usePathname } from 'next/navigation';
import BytesAI from '../ai/BytesAI';

type LayoutProps = {
  children?: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check if we're in mobile view on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Check on mount
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const resetMenu = () => {
    setActiveMenu('');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (pathname) {
      case '/sync/dashboards':
        return <DashboardSync />;
      case '/sync/monitors':
        return <MonitorSync />;
      case '/recommendation/dashboards':
        return <RecommendationDashboards />;
      case '/recommendation/monitors':
        return <RecommendationMonitors />;
      case '/bytes-ai':
        return <BytesAI />;
      case '/':
        return <Home />;
      default:
        return children;
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[1400px] mx-auto px-2 sm:px-4 md:px-8">
      <Header resetMenu={resetMenu} toggleSidebar={toggleSidebar} isMobileView={isMobileView} />
      <div className="flex flex-1 relative">
        {/* Mobile sidebar - absolute positioned when open */}
        {isMobileView ? (
          <div 
            className={`fixed top-[60px] left-0 z-20 h-[calc(100vh-60px)] transition-transform duration-300 ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <Sidebar 
              activeMenu={activeMenu} 
              onMenuChange={(menu) => {
                setActiveMenu(menu);
                if (isMobileView) setIsSidebarOpen(false);
              }} 
              resetMenu={resetMenu}
            />
          </div>
        ) : (
          // Desktop sidebar - always visible
          <Sidebar 
            activeMenu={activeMenu} 
            onMenuChange={setActiveMenu} 
            resetMenu={resetMenu}
          />
        )}
        
        {/* Overlay for mobile when sidebar is open */}
        {isMobileView && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        <main className="flex-1 p-2 sm:p-4 md:p-8 flex flex-col">
          <div className="flex-1">
            {renderContent()}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default Layout; 