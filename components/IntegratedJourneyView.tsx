import { useEffect, useState } from 'react';
import { supabase, createAuthenticatedClient, setSupabaseAuth } from '../lib/supabaseClient';
import { useUser, useSession } from '../lib/auth'; // Clerk 연동 지원을 위한 훅 임포트
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import { ChevronRight, Edit2, Share2, Lock, Copy, X } from 'lucide-react';
import EndingNoteEditModal from './EndingNoteEditModal'; // 신규 에디터 모달 임포트
import JourneyProgressGraph, { computeJourneySteps } from './JourneyProgressGraph';

interface JourneyLog {
    title: string;
    description: string;
    created_at: string;
}

interface EndingNote {
    preferences: string[];
    contact: string;
    memo: string;
    percent: number;
}

interface IntegratedJourneyViewProps {
    facilityFavoriteCount?: number;
    sangjoFavoriteCount?: number;
    consultationCount?: number;
    refreshTrigger?: number;
}

export default function IntegratedJourneyView({
    facilityFavoriteCount = 0,
    sangjoFavoriteCount = 0,
    consultationCount = 0,
    refreshTrigger = 0,
}: IntegratedJourneyViewProps) {
    const { isLoaded, isSignedIn, user } = useUser();
    const { session } = useSession();
    const [logs, setLogs] = useState<JourneyLog[]>([]);
    const [note, setNote] = useState<EndingNote | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // 공유 모달 상태
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharePassword, setSharePassword] = useState('');
    const [shareUrl, setShareUrl] = useState('');
    const [isCreatingShare, setIsCreatingShare] = useState(false);

    useEffect(() => {
        // Clerk 인증 정보가 로드되었고 로그인 상태일 때만 데이터 요청
        if (isLoaded && isSignedIn) {
            loadData();
        } else if (isLoaded && !isSignedIn) {
            setLoading(false); // 비로그인 시 로딩 종료 (빈 상태 표시)
        }
    }, [isLoaded, isSignedIn, refreshTrigger]);

    const loadData = async () => {
        setLoading(true);

        try {
            let authClient = supabase;
            // Clerk JWT 토큰을 명시적으로 가져와서 Supabase에 설정
            if (session) {
                const token = await session.getToken({ template: 'supabase' });
                if (token) {
                    // [Fix] createAuthenticatedClient를 사용하여 확실한 인증 보장
                    authClient = createAuthenticatedClient(token);
                    console.log('[Journey] Authenticated client created for data loading');
                }
            }

            // authClient를 사용하여 RPC 호출
            const { data, error } = await authClient.rpc('get_my_journey_full');
            if (error) {
                console.error('여정 데이터 로드 실패:', error);
            } else if (data) {
                setLogs(data.timeline || []);
                setNote(data.ending_note || null);
            }
        } catch (err) {
            console.error('데이터 로드 중 오류:', err);
        }

        setLoading(false);
    };

    // 엔딩 노트 저장 핸들러
    const handleSaveEndingNote = async (updates: Partial<EndingNote>) => {
        if (!user || !session) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        try {
            // Clerk JWT 토큰을 명시적으로 가져와서 Supabase에 설정
            console.log('[Journey] Getting Clerk token...');
            const token = await session.getToken({ template: 'supabase' });

            if (!token) {
                console.error('[Journey] Failed to get Clerk token');
                toast.error('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.');
                return;
            }

            // [Fix] createAuthenticatedClient 사용
            const authClient = createAuthenticatedClient(token);
            console.log('[Journey] Authenticated client ready, saving for user:', user.id);

            const { error } = await authClient
                .from('user_ending_notes')
                .upsert({
                    user_id: user.id,
                    preferred_types: updates.preferences,
                    emergency_contact: updates.contact,
                    final_memo: updates.memo,
                    progress_percent: updates.percent,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('저장 실패:', error);
                if (error.code === '42501') {
                    toast.error('보안 정책에 의해 저장이 거부되었습니다. 다시 로그인해주세요.');
                } else {
                    toast.error(`저장 중 오류가 발생했습니다: ${error.message}`);
                }
                return;
            }

            toast.success('엔딩 노트가 안전하게 저장되었습니다.');
            loadData(); // UI 즉시 갱신
        } catch (err: any) {
            console.error('저장 중 예외 발생:', err);
            toast.error('저장 중 문제가 발생했습니다. 다시 시도해주세요.');
        }
    };

    // 공유 모달 열기
    const openShareModal = () => {
        setSharePassword('');
        setShareUrl('');
        setIsShareModalOpen(true);
    };

    // 공유 생성 핸들러
    const createShare = async () => {
        if (!user || !note || !session) {
            toast.error('공유할 내용이 없습니다.');
            return;
        }

        if (sharePassword.length !== 4 || !/^\d{4}$/.test(sharePassword)) {
            toast.error('4자리 숫자 비밀번호를 입력해주세요.');
            return;
        }

        setIsCreatingShare(true);

        try {
            // Clerk JWT 토큰을 명시적으로 가져와서 Supabase에 설정
            const token = await session.getToken({ template: 'supabase' });
            let authClient = supabase;

            if (token) {
                authClient = createAuthenticatedClient(token);
            }

            const { data, error } = await authClient.rpc('create_journey_share', {
                p_preferences: note.preferences || [],
                p_contact: note.contact || '',
                p_memo: note.memo || '',
                p_percent: note.percent || 0,
                p_password: sharePassword
            });

            if (error) {
                console.error('공유 생성 오류:', error);
                toast.error('공유 생성 중 오류가 발생했습니다.');
                return;
            }

            if (data?.error) {
                toast.error(data.error);
                return;
            }

            if (data?.success && data?.share_token) {
                const url = `${window.location.origin}/#/share/${data.share_token}`;
                setShareUrl(url);
                toast.success('공유 링크가 생성되었습니다!');
            }
        } catch (err) {
            console.error('공유 생성 실패:', err);
            toast.error('공유 생성 중 오류가 발생했습니다.');
        } finally {
            setIsCreatingShare(false);
        }
    };

    // 클립보드 복사
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('링크가 복사되었습니다!');
        } catch (err) {
            toast.error('복사 실패. 수동으로 복사해주세요.');
        }
    };

    // 기존 공유하기 핸들러 (fallback)
    const handleShare = async () => {
        openShareModal();
    };

    // 인증 정보 로딩 중에는 스켈레톤 표시
    if (!isLoaded || loading) {
        return <div className="animate-pulse h-64 bg-gray-100 rounded-2xl mx-1" />;
    }

    // 비로그인 상태 대응
    if (!isSignedIn) {
        return (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center mx-1 mb-8">
                <p className="text-gray-500 text-sm mb-4">로그인하시면 나의 여정 기록을 관리할 수 있습니다.</p>
                <button
                    onClick={() => window.location.href = '/login'}
                    className="px-6 py-2 bg-pink-500 text-white rounded-xl text-sm font-bold shadow-sm"
                >
                    로그인 / 시작하기
                </button>
            </div>
        );
    }

    const userName = (user as any)?.fullName || (user as any)?.user_metadata?.name || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || '사용자';
    const { steps: journeySteps, percent: journeyPercent } = computeJourneySteps(
        facilityFavoriteCount,
        sangjoFavoriteCount,
        consultationCount,
        note
    );
    const percent = journeyPercent;

    return (
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mx-1 mb-8">
            {/* 1. Header & Progress Section */}
            <div className="p-5 bg-gradient-to-r from-pink-50/50 to-purple-50/50">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-pink-500 rounded-full" />
                    <h2 className="text-base font-bold text-gray-900">나의 여정 기록</h2>
                </div>

                <JourneyProgressGraph
                    steps={journeySteps}
                    percent={percent}
                    userName={userName}
                />
            </div>

            {/* 2. Timeline (Gi-Sun-Haeng-Bo) */}
            <div className="px-5 py-4 bg-white">
                <h3 className="text-xs font-bold text-pink-500 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-300" />
                    기순행보
                </h3>

                {logs.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        기록된 활동이 없습니다.
                    </div>
                ) : (
                    <div className="relative pl-3 border-l-2 border-gray-100 space-y-4 ml-1">
                        {logs.slice(0, 3).map((log, i) => (
                            <div key={i} className="relative">
                                <div className="absolute -left-[17px] top-1.5 w-2.5 h-2.5 bg-gray-200 rounded-full border-2 border-white" />
                                <div className="text-sm">
                                    <span className="text-pink-600 font-bold text-xs mr-2">
                                        {new Date(log.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="text-gray-700">{log.title}</span>
                                </div>
                                {log.description && (
                                    <p className="text-xs text-gray-400 mt-0.5 pl-2 border-l-2 border-gray-50">
                                        (메모: {log.description})
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. Ending Note Summary */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/30">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-gray-800">나의 엔딩 노트</h3>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="text-[10px] text-gray-400 font-medium px-2 py-1 bg-white border border-gray-200 rounded-md flex items-center gap-1 hover:text-pink-500 hover:border-pink-200 transition-colors"
                    >
                        <Edit2 size={10} /> 수정
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <h4 className="text-[11px] font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
                            나의 선호 방식
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                            {note?.preferences && note.preferences.length > 0 ? (
                                note.preferences.map((p, i) => (
                                    <span key={i} className="text-[10px] text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100 font-bold">#{p}</span>
                                ))
                            ) : (
                                <span className="text-[11px] text-gray-400 italic">미설정 (예: 수목장, 자연장, 가족묘 등)</span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <h4 className="text-[11px] font-bold text-gray-500 mb-1">비상 연락망</h4>
                        {note?.contact ? (
                            <span className="text-xs text-gray-800 font-medium">{note.contact}</span>
                        ) : (
                            <span className="text-[11px] text-gray-400 italic">미등록 (예: 아들 김철수 010-1234-5678)</span>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <h4 className="text-[11px] font-bold text-gray-500 mb-1">한 줄 메모</h4>
                        {note?.memo ? (
                            <div className="border-l-2 border-pink-300 pl-2.5 py-0.5">
                                <p className="text-xs text-gray-700 font-medium leading-relaxed italic">
                                    "{note.memo}"
                                </p>
                            </div>
                        ) : (
                            <p className="text-[11px] text-gray-400 italic">
                                내용 없음 (예: 장례식에는 웃는 얼굴 사진을 사용해주세요)
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 mt-5">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex-[2] py-2.5 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl text-xs font-bold shadow-sm active:scale-[0.98] transition-all"
                    >
                        엔딩 노트 {note ? '관리하기' : '작성하기'}
                    </button>
                    {note && (
                        <button
                            onClick={handleShare}
                            className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                        >
                            <Share2 size={14} className="text-pink-400" /> 공유
                        </button>
                    )}
                </div>
            </div>

            {/* 에디터 모달 */}
            <EndingNoteEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                currentNote={note}
                onSave={handleSaveEndingNote}
            />

            {/* 공유 모달 */}
            {isShareModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                    <div className="bg-white w-full max-w-sm rounded-[24px] shadow-xl overflow-hidden">
                        {/* 헤더 */}
                        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-4 bg-pink-500 rounded-full" />
                                <h2 className="text-sm font-bold text-gray-900">여정 기록 공유</h2>
                            </div>
                            <button
                                onClick={() => setIsShareModalOpen(false)}
                                className="p-1.5 hover:bg-gray-50 rounded-full transition-colors text-gray-400"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5">
                            {!shareUrl ? (
                                /* 비밀번호 입력 화면 */
                                <>
                                    <div className="text-center mb-5">
                                        <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Lock size={20} className="text-pink-500" />
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            4자리 숫자 비밀번호를 설정해주세요.<br />
                                            상대방은 비밀번호를 입력해야 내용을 볼 수 있습니다.
                                        </p>
                                    </div>

                                    <div className="mb-5">
                                        <input
                                            type="password"
                                            value={sharePassword}
                                            onChange={(e) => setSharePassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            placeholder="0000"
                                            className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                                            maxLength={4}
                                        />
                                    </div>

                                    <button
                                        onClick={createShare}
                                        disabled={isCreatingShare || sharePassword.length !== 4}
                                        className="w-full py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl text-xs font-bold shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        {isCreatingShare ? '생성 중...' : '공유 링크 생성하기'}
                                    </button>
                                </>
                            ) : (
                                /* 링크 복사 화면 */
                                <>
                                    <div className="text-center mb-5">
                                        <div className="text-4xl mb-3">🔗</div>
                                        <p className="text-sm font-bold text-gray-900 mb-1">공유 링크가 생성되었습니다!</p>
                                        <p className="text-xs text-gray-500">
                                            비밀번호: <span className="font-bold text-pink-600">{sharePassword}</span>
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                                        <p className="text-xs text-gray-600 break-all">{shareUrl}</p>
                                    </div>

                                    <button
                                        onClick={copyToClipboard}
                                        className="w-full py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl text-xs font-bold shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Copy size={14} />
                                        링크 복사하기
                                    </button>

                                    <p className="text-[10px] text-gray-400 text-center mt-4">
                                        비밀번호를 꼭 기억하거나 함께 전달해주세요.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
