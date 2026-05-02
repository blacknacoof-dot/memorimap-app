import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getOAuthRedirectTo, rememberOAuthReturnPath } from '../lib/oauthRedirect';

interface Props {
  onClose: () => void;
  onSignUp: () => void;
  onLoginClick: () => void;
}

const TERMS_OF_SERVICE = `제1조 (목적)
본 약관은 메모리맵(이하 "회사")이 제공하는 추모 시설 정보 서비스의 이용 조건과 절차를 규정합니다.

제2조 (서비스 내용)
1. 회사는 납골당, 봉안시설, 자연장, 공원묘지 등 추모 시설 정보를 제공합니다.
2. 시설 검색, 비교, 상담 연결, 추천 기능이 포함될 수 있습니다.
3. 서비스 내용은 운영상 필요에 따라 변경될 수 있습니다.

제3조 (회원의 의무)
1. 회원은 정확하고 최신의 정보를 제공해야 합니다.
2. 타인의 정보를 도용하거나 허위 정보를 입력해서는 안 됩니다.
3. 서비스 운영을 방해하거나 법령에 위반되는 행위를 해서는 안 됩니다.

제4조 (면책)
1. 회사는 시설 정보의 정확성을 높이기 위해 노력하지만, 실제 운영 상태와 차이가 있을 수 있습니다.
2. 시설 이용에 관한 최종 판단과 계약은 이용자의 책임으로 진행됩니다.`;

const PRIVACY_POLICY = `1. 수집 항목
- 필수: 이메일 주소, 비밀번호
- 선택: 이름, 프로필 이미지, 연락처

2. 이용 목적
- 회원 식별 및 로그인 처리
- 상담 요청, 예약 문의, 고객 지원
- 서비스 품질 개선과 운영 통계

3. 보관 기간
- 회원 탈퇴 시 즉시 삭제를 원칙으로 합니다.
- 관련 법령에 따라 보관이 필요한 경우에는 해당 기간 동안 보관합니다.

4. 제3자 제공
- 이용자 동의 또는 법령상 근거가 있는 경우를 제외하고 외부에 제공하지 않습니다.

5. 이용자 권리
- 개인정보 열람, 수정, 삭제를 요청할 수 있습니다.
- 회원 탈퇴를 통해 계정 삭제를 요청할 수 있습니다.`;

export const SignUpModal: React.FC<Props> = ({ onClose, onLoginClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [signUpComplete, setSignUpComplete] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const allAgreed = agreeTerms && agreePrivacy;

  const handleAgreeAll = () => {
    const nextValue = !allAgreed;
    setAgreeTerms(nextValue);
    setAgreePrivacy(nextValue);
  };

  const handleSocialSignUp = async (provider: 'kakao' | 'google') => {
    if (!allAgreed) {
      setError('이용약관과 개인정보 처리방침에 동의해 주세요.');
      return;
    }

    setError(null);
    setSocialLoading(provider);

    try {
      rememberOAuthReturnPath();
      const redirectTo = getOAuthRedirectTo();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
      }
    } catch {
      setError('소셜 회원가입 중 오류가 발생했습니다.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!allAgreed) {
      setError('이용약관과 개인정보 처리방침에 동의해 주세요.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim() || undefined,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('이미 가입된 이메일입니다. 로그인으로 진행해 주세요.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      setSignUpComplete(true);
    } catch {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="sticky top-0 float-right text-gray-400 hover:text-gray-600 z-10 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center mr-1 mt-1"
          aria-label="닫기"
        >
          <X size={24} />
        </button>

        <div className="p-6 sm:p-8 pt-2 sm:pt-4">
          <h2 className="text-2xl font-bold text-center mb-6">회원가입</h2>

          {signUpComplete ? (
            <div className="text-center py-4">
              <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4">
                <p className="font-medium">가입이 완료되었습니다.</p>
                <p className="text-sm mt-1">이메일 인증 링크를 확인한 뒤 로그인해 주세요.</p>
              </div>
              <button
                onClick={onLoginClick}
                className="text-primary font-medium hover:underline"
              >
                로그인하기
              </button>
            </div>
          ) : (
            <>
              <div className="mb-5 border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                <label className="flex items-center gap-3 cursor-pointer pb-3 border-b border-gray-200 mb-3">
                  <input
                    type="checkbox"
                    checked={allAgreed}
                    onChange={handleAgreeAll}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                  />
                  <span className="font-bold text-sm text-gray-800">전체 동의</span>
                </label>

                <div className="mb-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={() => setAgreeTerms(!agreeTerms)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700">
                        <span className="text-red-500 mr-1">(필수)</span>이용약관 동의
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTerms(!showTerms)}
                      className="text-gray-400 hover:text-gray-600 p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                      aria-label={showTerms ? '약관 접기' : '약관 펼치기'}
                    >
                      {showTerms ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                  {showTerms && (
                    <div className="mt-2 ml-7 p-3 bg-white border border-gray-200 rounded-lg max-h-[150px] overflow-y-auto">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                        {TERMS_OF_SERVICE}
                      </pre>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={agreePrivacy}
                        onChange={() => setAgreePrivacy(!agreePrivacy)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700">
                        <span className="text-red-500 mr-1">(필수)</span>개인정보 처리방침 동의
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPrivacy(!showPrivacy)}
                      className="text-gray-400 hover:text-gray-600 p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                      aria-label={showPrivacy ? '개인정보 처리방침 접기' : '개인정보 처리방침 펼치기'}
                    >
                      {showPrivacy ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                  {showPrivacy && (
                    <div className="mt-2 ml-7 p-3 bg-white border border-gray-200 rounded-lg max-h-[150px] overflow-y-auto">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                        {PRIVACY_POLICY}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <button
                  type="button"
                  onClick={() => handleSocialSignUp('kakao')}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium text-[#191919] bg-[#FEE500] hover:bg-[#FDD835] disabled:opacity-50 transition-colors min-h-[48px]"
                >
                  {socialLoading === 'kakao' ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path
                        fill="#191919"
                        d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.45 4.08 3.64 5.18-.16.57-.58 2.07-.66 2.39-.11.39.14.39.3.28.12-.08 1.93-1.31 2.71-1.84.64.09 1.31.14 2.01.14 4.42 0 8-2.79 8-6.21S13.42 1 9 1"
                      />
                    </svg>
                  )}
                  카카오로 가입하기
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialSignUp('google')}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors min-h-[48px]"
                >
                  {socialLoading === 'google' ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" />
                      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                    </svg>
                  )}
                  Google로 가입하기
                </button>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">또는 이메일로 가입</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름 (선택)</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="이름"
                    autoComplete="name"
                  />
                </div>

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
                      placeholder="6자 이상"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="비밀번호를 다시 입력해 주세요"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || !allAgreed}
                  className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  가입하기
                </button>
              </form>
            </>
          )}
        </div>

        {!signUpComplete && (
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
        )}
      </div>
    </div>
  );
};
