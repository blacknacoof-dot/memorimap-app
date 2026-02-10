import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SignIn } from '@clerk/clerk-react';
import { useSignIn } from '../lib/auth';

interface Props {
  onClose: () => void;
  onLogin: () => void; // Called by App when user is detected as signed in via useUser hook
  onSignUpClick: () => void;
  onAdminLogin: () => void;
}

export const LoginModal: React.FC<Props> = ({ onClose, onSignUpClick }) => {
  const { signIn, setActive } = useSignIn();


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 p-1"
        >
          <X size={24} />
        </button>

        <div className="p-8 flex justify-center w-full">
          <SignIn
            routing="hash"
            fallbackRedirectUrl="/"
            signUpUrl="#"
            appearance={{
              elements: {
                footerAction: '!hidden'
              }
            }}
          />
        </div>

        <div className="p-4 bg-gray-50 text-center border-t">
          <p className="text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <button
              onClick={onSignUpClick}
              className="text-primary font-bold hover:underline"
            >
              회원가입
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};