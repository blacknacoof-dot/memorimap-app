import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Props {
  onClose: () => void;
  onLogin: () => void;
  onSignUpClick: () => void;
  onAdminLogin: () => void;
}

export const LoginModal: React.FC<Props> = ({ onClose, onLogin, onSignUpClick, onAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
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

      // Check if user is admin/super_admin
      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('clerk_id', data.user.id)
          .single();

        if (profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'partner') {
          onAdminLogin();
          return;
        }
      }

      onLogin();
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'kakao' | 'google') => {
    setError(null);
    setSocialLoading(provider);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
      }
    } catch {
      setError('소셜 로그인 중 오류가 발생했습니다.');
    } finally {
      setSocialLoading(null);
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
      <div className="bg-white w-full max-w-md max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X size={24} />
        </button>

        <div className="p-6 sm:p-8">
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
            <>
              {/* Social Login Buttons */}
              <div className="space-y-3 mb-5">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('kakao')}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium text-[#191919] bg-[#FEE500] hover:bg-[#FDD835] disabled:opacity-50 transition-colors min-h-[48px]"
                >
                  {socialLoading === 'kakao' ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#191919" d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.45 4.08 3.64 5.18-.16.57-.58 2.07-.66 2.39-.11.39.14.39.3.28.12-.08 1.93-1.31 2.71-1.84.64.09 1.31.14 2.01.14 4.42 0 8-2.79 8-6.21S13.42 1 9 1"/></svg>
                  )}
                  카카오로 시작하기
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors min-h-[48px]"
                >
                  {socialLoading === 'google' ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
                  )}
                  Google로 시작하기
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">또는 이메일로 로그인</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Email Login Form */}
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
                  className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  로그인
                </button>

                <button
                  type="button"
                  onClick={() => { setResetMode(true); setError(null); }}
                  className="w-full text-gray-500 text-sm hover:underline min-h-[44px]"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </form>
            </>
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
