import React from 'react';
import { X } from 'lucide-react';
import { SignUp } from '@clerk/clerk-react';

interface Props {
  onClose: () => void;
  onSignUp: () => void;
  onLoginClick: () => void;
}

export const SignUpModal: React.FC<Props> = ({ onClose, onLoginClick }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 p-1"
        >
          <X size={24} />
        </button>

        <div className="p-8 flex justify-center">
          <SignUp
            routing="hash"
            fallbackRedirectUrl="/"
            signInUrl="#"
            appearance={{
              elements: {
                footerAction: '!hidden'
              }
            }}
          />
        </div>

        <div className="p-4 bg-gray-50 text-center border-t">
          <p className="text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <button
              onClick={onLoginClick}
              className="text-primary font-bold hover:underline"
            >
              로그인하기
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};