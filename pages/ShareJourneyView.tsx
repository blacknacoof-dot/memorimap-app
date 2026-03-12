import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Heart, Phone, FileText, Lock, Eye, Calendar, Sparkles, MapPin, Bot, Star } from 'lucide-react';

interface SharedData {
    preferences: string[];
    contact: string;
    memo: string;
    percent: number;
    view_count: number;
    created_at: string;
}

export default function ShareJourneyView() {
    const { token } = useParams<{ token: string }>();
    const [password, setPassword] = useState('');
    const [data, setData] = useState<SharedData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verified, setVerified] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length !== 4 || !/^\d{4}$/.test(password)) {
            setError('4자리 숫자를 입력해주세요.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { data: result, error: rpcError } = await supabase.rpc('get_shared_journey', {
                p_token: token,
                p_password: password
            });

            if (rpcError) {
                setError('조회 중 오류가 발생했습니다.');
                return;
            }

            if (result?.error) {
                setError(result.error);
                return;
            }

            if (result?.success && result?.data) {
                setData(result.data);
                setVerified(true);
            }
        } catch (_err) {
            setError('오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    // 페이지 메타 설정
    useEffect(() => {
        document.title = '추모 여정 기록 | 추모맵';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', '소중한 분의 추모 여정 기록을 공유합니다.');
        }
    }, []);

    // 텍스트 기반 공유 내용 렌더링
    const renderTextView = () => {
        if (!data) return null;

        const shareDate = new Date(data.created_at).toLocaleDateString('ko-KR');

        return (
            <div className="bg-white min-h-screen p-6">
                {/* 헤더 */}
                <div className="text-center mb-8 pb-6 border-b-2 border-gray-100">
                    <div className="text-4xl mb-4">📝</div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">
                        추모 여정 기록
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            공유일: {shareDate}
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye size={12} />
                            조회: {data.view_count}회
                        </span>
                    </div>
                </div>

                {/* 진행률 */}
                <div className="mb-8 text-center">
                    <div className="text-5xl font-black text-pink-500 mb-2">
                        {data.percent}%
                    </div>
                    <p className="text-sm text-gray-600">
                        추모 여정 준비 완료
                    </p>
                    <div className="w-full bg-gray-100 rounded-full h-3 mt-4 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-pink-400 to-purple-400 h-full rounded-full"
                            style={{ width: `${data.percent}%` }}
                        />
                    </div>
                </div>

                {/* 선호 방식 */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3 text-gray-700">
                        <Heart size={16} className="text-pink-500" />
                        <span className="font-bold text-sm">선호 방식</span>
                    </div>
                    <div className="pl-6">
                        {data.preferences && data.preferences.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {data.preferences.map((pref, i) => (
                                    <span 
                                        key={i} 
                                        className="text-sm bg-pink-50 text-pink-700 px-3 py-1.5 rounded-lg border border-pink-100"
                                    >
                                        #{pref}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">선택된 선호 방식이 없습니다.</p>
                        )}
                    </div>
                </div>

                {/* 비상 연락망 */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3 text-gray-700">
                        <Phone size={16} className="text-blue-500" />
                        <span className="font-bold text-sm">비상 연락망</span>
                    </div>
                    <div className="pl-6">
                        {data.contact ? (
                            <p className="text-base font-medium text-gray-800">{data.contact}</p>
                        ) : (
                            <p className="text-sm text-gray-400 italic">등록된 연락망이 없습니다.</p>
                        )}
                    </div>
                </div>

                {/* 한 줄 메모 */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3 text-gray-700">
                        <FileText size={16} className="text-amber-500" />
                        <span className="font-bold text-sm">남기고 싶은 말</span>
                    </div>
                    <div className="pl-6">
                        {data.memo ? (
                            <div className="bg-gray-50 border-l-4 border-pink-300 pl-4 py-3 pr-4 rounded-r-lg">
                                <p className="text-base text-gray-700 leading-relaxed italic">
                                    "{data.memo}"
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">작성된 메모가 없습니다.</p>
                        )}
                    </div>
                </div>

                {/* 회원가입 CTA */}
                <div className="mt-8 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100">
                    <div className="text-center mb-4">
                        <Sparkles className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                        <h3 className="text-base font-bold text-gray-900">
                            메모리맵으로 나의 여정도 기록해보세요
                        </h3>
                    </div>
                    <ul className="space-y-2 mb-5">
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                            <FileText size={14} className="text-pink-500 flex-shrink-0" />
                            나의 추모 여정 기록 및 공유
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                            <MapPin size={14} className="text-blue-500 flex-shrink-0" />
                            전국 추모시설 비교 및 즐겨찾기
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Bot size={14} className="text-purple-500 flex-shrink-0" />
                            AI 맞춤 상조 상담
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                            <Star size={14} className="text-amber-500 flex-shrink-0" />
                            상조 서비스 비교 분석
                        </li>
                    </ul>
                    <a
                        href="/#/auth?from=share"
                        className="block w-full py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl font-bold text-center shadow-md hover:shadow-lg active:scale-95 transition-all"
                    >
                        무료로 시작하기
                    </a>
                </div>

                {/* 푸터 */}
                <div className="text-center pt-6 mt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        메모리맵에서 공유된 추모 여정 기록입니다.
                    </p>
                </div>
            </div>
        );
    };

    // 비밀번호 입력 화면
    if (!verified) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-lg p-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-pink-500" />
                        </div>
                        <h1 className="text-lg font-bold text-gray-900 mb-1">
                            비밀번호 입력
                        </h1>
                        <p className="text-sm text-gray-500">
                            공유된 추모 여정 기록을 볼 수 있습니다.
                        </p>
                    </div>

                    <form onSubmit={handleVerify}>
                        <div className="mb-4">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="4자리 숫자"
                                className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
                                maxLength={4}
                            />
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                                <p className="text-sm text-red-600 text-center">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || password.length !== 4}
                            className="w-full py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '확인 중...' : '확인하기'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <a 
                            href="/" 
                            className="text-xs text-gray-400 hover:text-gray-600"
                        >
                            메모리맵 홈으로 돌아가기
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // 공유 내용 표시
    return renderTextView();
}
