import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SignIn } from '@clerk/clerk-react';
import { isClerkConfigured, useSignIn } from '../lib/auth';

interface Props {
  onClose: () => void;
  onLogin: () => void; // Called by App when user is detected as signed in via useUser hook
  onSignUpClick: () => void;
  onAdminLogin: () => void;
}

export const LoginModal: React.FC<Props> = ({ onClose, onSignUpClick }) => {
  const { signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('guest@example.com');
  const [password, setPassword] = useState('password');

  const handleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        // onLogin is handled by App.tsx observing useUser
      }
    } catch (err) {
      console.error("Mock Login Failed", err);
    }
  };

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
          {/* Safety check: SignIn component requires ClerkProvider. If missing (Mock mode), show simple login button */}
          {isClerkConfigured() ? (
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
          ) : (
            <div className="w-full">
              <h2 className="text-xl font-bold mb-4 text-center">개발 모드 로그인</h2>
              <p className="text-sm text-gray-500 mb-6 text-center">Clerk API 키가 없어 모의 로그인 모드로 동작합니다.</p>
              <form onSubmit={handleMockLogin} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="이메일"
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="비밀번호 (아무거나)"
                />
                <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90">
                  모의 로그인
                </button>
              </form>
            </div>
          )}
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