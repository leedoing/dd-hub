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
      path: '/recommendation/dashboards'
    },
    {
      id: 'recommendation-monitors',
      label: 'Monitor\nRecommendations',
      path: '/recommendation/monitors'
    },
    {
      id: 'sync-dashboards',
      label: 'Dashboard\nSynchronization',
      path: '/sync/dashboards'
    },
    {
      id: 'sync-monitors',
      label: 'Monitor\nSynchronization',
      path: '/sync/monitors'
    }
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
    <div className="w-64 bg-[#633C95] text-white min-h-[calc(100vh-4rem)]">
      <div className="px-5 py-6">
        <button 
          onClick={handleLogoClick}
          className="w-full flex justify-center items-center hover:opacity-90 transition-opacity"
        >
          <img 
            src="/main.png"
            alt="Datadog Sync Tool Logo" 
            className="h-36 w-auto"
          />
        </button>
      </div>
      <nav className="pt-3">
        {sidebarMenus.map((item) => (
          <button
            key={item.id}
            onClick={() => handleMenuClick(item)}
            className={`w-full text-left px-6 py-3.5 transition-all text-xl font-medium whitespace-pre-line
              ${isActive(item.path)
                ? 'bg-[#4F3076] text-white shadow-lg' 
                : 'text-purple-100 hover:bg-[#573585] hover:text-white'
              }
            `}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}