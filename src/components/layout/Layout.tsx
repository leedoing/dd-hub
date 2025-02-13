'use client';

import { ReactNode } from 'react';
import { useState } from 'react';
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

  const resetMenu = () => {
    setActiveMenu('');
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
    <div className="min-h-screen flex flex-col max-w-[1296px] mx-auto">
      <Header resetMenu={resetMenu} />
      <div className="flex flex-1">
        <Sidebar 
          activeMenu={activeMenu} 
          onMenuChange={setActiveMenu} 
          resetMenu={resetMenu}
        />
        <main className="flex-1 p-6 flex flex-col">
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