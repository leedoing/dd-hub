/* eslint-disable @next/next/no-img-element */
'use client';

import { useRouter, usePathname } from 'next/navigation';

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  resetMenu: () => void;
}

export default function Sidebar({ activeMenu, onMenuChange, resetMenu }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const sidebarMenus = [
    {
      id: 'recommendation-dashboards',
      label: 'Dashboard\nRecommendations',
      mobileLabel: 'Dashboard Recommendations',
      path: '/recommendation/dashboards'
    },
    {
      id: 'recommendation-monitors',
      label: 'Monitor\nRecommendations',
      mobileLabel: 'Monitor Recommendations',
      path: '/recommendation/monitors'
    },
    {
      id: 'sync-dashboards',
      label: 'Dashboard\nSynchronization',
      mobileLabel: 'Dashboard Sync',
      path: '/sync/dashboards'
    },
    {
      id: 'sync-monitors',
      label: 'Monitor\nSynchronization',
      mobileLabel: 'Monitor Sync',
      path: '/sync/monitors'
    },
    {
      id: 'bytes-ai',
      label: 'Bytes AI',
      mobileLabel: 'Bytes AI',
      path: '/bytes-ai'
    },
  ];

  const handleMenuClick = (menuItem: typeof sidebarMenus[0]) => {
    onMenuChange(menuItem.id);
    router.push(menuItem.path);
  };

  const handleLogoClick = () => {
    resetMenu();
    router.push('/');
  };

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <div className="w-64 bg-[#633C95] text-white h-full md:min-h-[calc(100vh-4rem)] shadow-lg overflow-y-auto">
      <div className="px-3 py-3 md:px-5 md:py-6">
        <button 
          onClick={handleLogoClick}
          className="w-full flex justify-center items-center hover:opacity-90 transition-opacity"
        >
          <img 
            src="/main.png"
            alt="Datadog Sync Tool Logo" 
            className="h-16 md:h-36 w-auto"
          />
        </button>
      </div>
      <nav className="pt-1 md:pt-3">
        {sidebarMenus.map((item) => (
          <button
            key={item.id}
            onClick={() => handleMenuClick(item)}
            className={`w-full text-left px-3 md:px-6 py-2 md:py-3.5 transition-all text-sm md:text-xl font-medium
              ${isActive(item.path)
                ? 'bg-[#4F3076] text-white shadow-lg' 
                : 'text-purple-100 hover:bg-[#573585] hover:text-white'
              }
            `}
          >
            <span className="md:hidden">{item.mobileLabel}</span>
            <span className="hidden md:inline whitespace-pre-line">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}