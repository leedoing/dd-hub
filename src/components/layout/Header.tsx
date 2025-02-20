'use client';

import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';

interface HeaderProps {
  resetMenu: () => void;
}

export default function Header({ resetMenu }: HeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <header className="py-6 px-8 border-b">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            router.push('/');
            resetMenu();
          }}
          className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-900 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          Datadog Hub
        </button>
        
        {/* 사용자 정보와 로그인/로그아웃 버튼 */}
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <span className="text-gray-600">
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
} 