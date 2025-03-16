'use client';

import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';

interface HeaderProps {
  resetMenu: () => void;
  toggleSidebar?: () => void;
  isMobileView?: boolean;
}

export default function Header({ resetMenu, toggleSidebar, isMobileView }: HeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <header className="py-2 md:py-6 px-3 md:px-8 border-b sticky top-0 bg-white z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isMobileView && (
            <button
              onClick={toggleSidebar}
              className="mr-2 text-gray-700 hover:text-purple-600 focus:outline-none"
              aria-label="Toggle sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <button
            onClick={() => {
              router.push('/');
              resetMenu();
            }}
            className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-900 bg-clip-text text-transparent hover:opacity-80 transition-opacity truncate max-w-[150px] sm:max-w-none"
          >
            Datadog Hub
          </button>
        </div>
        
        {/* 사용자 정보와 로그인/로그아웃 버튼 */}
        <div className="flex items-center gap-2 md:gap-4">
          {session ? (
            <>
              <span className="text-gray-600 text-xs md:text-base hidden sm:inline truncate max-w-[120px] md:max-w-[200px]">
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors whitespace-nowrap"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors whitespace-nowrap"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
} 