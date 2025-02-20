'use client';

import { signIn } from "next-auth/react";
import Modal from "@/components/common/Modal";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Welcome to Datadog Hub">
      <div className="p-6 space-y-6">
        <p className="text-center text-gray-600">
        Login is mandatory to access Datadog Hub.
        </p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full h-[38px] flex items-center bg-[#DB4437] hover:bg-[#c53929] text-white rounded transition-colors overflow-hidden border border-black"
          title="Sign in with Google"
        >
          {/* Google 로고 */}
          <span className="h-[38px] w-[38px] flex items-center justify-center bg-white">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M20.64 12.205c0-.639-.057-1.252-.164-1.841H12v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M12 21c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H3.957v2.332A8.997 8.997 0 0012 21z" fill="#34A853"/>
              <path d="M6.964 13.71A5.41 5.41 0 016.682 12c0-.593.102-1.17.282-1.71V7.958H3.957A8.996 8.996 0 003 12c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M12 6.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C16.463 3.891 14.426 3 12 3a8.997 8.997 0 00-8.043 4.958l3.007 2.332C7.672 8.163 9.656 6.58 12 6.58z" fill="#EA4335"/>
            </svg>
          </span>
          {/* 텍스트 */}
          <span className="flex-1 text-center text-[15px] font-medium">
            Sign in with Google
          </span>
        </button>
      </div>
    </Modal>
  );
} 