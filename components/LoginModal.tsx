import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Props {
  onClose: () => void;
  onLogin: () => void;
  onSignUpClick: () => void;
  onAdminLogin: () => void;
}

export const LoginModal: React.FC<Props> = ({ onClose, onSignUpClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('이메일 인증이 필요합니다. 가입 시 발송된 이메일을 확인해주세요.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      // onAuthStateChange will handle the rest
      onClose();
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/#/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setResetSent(true);
    } catch {
      setError('비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-center mb-6">
            {resetMode ? '비밀번호 재설정' : '로그인'}
          </h2>

          {resetSent ? (
            <div className="text-center py-4">
              <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4">
                <p className="font-medium">이메일이 발송되었습니다.</p>
                <p className="text-sm mt-1">받은편지함을 확인하고 링크를 클릭하여 비밀번호를 재설정해주세요.</p>
              </div>
              <button
                onClick={() => { setResetMode(false); setResetSent(false); }}
                className="text-primary font-medium hover:underline"
              >
                로그인으로 돌아가기
              </button>
            </div>
          ) : resetMode ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                가입 시 사용한 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="example@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                재설정 이메일 발송
              </button>

              <button
                type="button"
                onClick={() => { setResetMode(false); setError(null); }}
                className="w-full text-gray-500 text-sm hover:underline"
              >
                로그인으로 돌아가기
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="example@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none pr-12"
                    placeholder="비밀번호를 입력하세요"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                로그인
              </button>

              <button
                type="button"
                onClick={() => { setResetMode(true); setError(null); }}
                className="w-full text-gray-500 text-sm hover:underline"
              >
                비밀번호를 잊으셨나요?
              </button>
            </form>
          )}
        </div>

        {!resetMode && !resetSent && (
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
        )}
      </div>
    </div>
  );
};
