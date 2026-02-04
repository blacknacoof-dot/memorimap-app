import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../lib/auth'; // Clerk 연동 지원을 위한 훅 임포트
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import { ChevronRight, Edit2, Share2 } from 'lucide-react';
import EndingNoteEditModal from './EndingNoteEditModal'; // 신규 에디터 모달 임포트

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

export default function IntegratedJourneyView() {
    const { isLoaded, isSignedIn, user } = useUser();
    const [logs, setLogs] = useState<JourneyLog[]>([]);
    const [note, setNote] = useState<EndingNote | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        // Clerk 인증 정보가 로드되었고 로그인 상태일 때만 데이터 요청
        if (isLoaded && isSignedIn) {
            loadData();
        } else if (isLoaded && !isSignedIn) {
            setLoading(false); // 비로그인 시 로딩 종료 (빈 상태 표시)
        }
    }, [isLoaded, isSignedIn]);

    const loadData = async () => {
        setLoading(true);
        // 🚑 세션 동기화 시간차(Race Condition)를 고려하여 잠시 대기
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        const { data, error } = await supabase.rpc('get_my_journey_full');
        if (error) {
            console.error('여정 데이터 로드 실패:', error);
        } else if (data) {
            setLogs(data.timeline || []);
            setNote(data.ending_note || null);
        }
        setLoading(false);
    };

    // 엔딩 노트 저장 핸들러
    const handleSaveEndingNote = async (updates: Partial<EndingNote>) => {
        if (!user) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        // 🚑 세션 최종 확인 (Race Condition & 401/42501 방어)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        const { error } = await supabase
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
                toast.error('권한이 일시적으로 제한되었습니다. 잠시 후 다시 시도해 주세요.');
            } else {
                throw error;
            }
            return;
        }

        toast.success('엔딩 노트가 안전하게 저장되었습니다.');
        loadData(); // UI 즉시 갱신
    };

    // 공유하기 핸들러
    const handleShare = async () => {
        const userName = (user as any)?.fullName || (user as any)?.user_metadata?.name || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || '사용자';
        const percent = note?.percent || 0;

        const shareData = {
            title: '메모리맵: 나의 마지막 여정 기록',
            text: `${userName} 님의 추모 여정이 ${percent}% 준비되었습니다. 소중한 기록을 확인해 보세요.`,
            url: window.location.origin + '/mypage', // 마이페이지 링크
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                toast.success('공유 창이 열렸습니다.');
            } else {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                toast.success('링크가 복사되었습니다. 가족들에게 전달해 보세요!');
            }
        } catch (err) {
            console.warn('Share error:', err);
        }
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
    const percent = note?.percent || 0;

    return (
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mx-1 mb-8">
            {/* 1. Header & Progress Section */}
            <div className="p-5 bg-gradient-to-r from-pink-50/50 to-purple-50/50">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-pink-500 rounded-full" />
                    <h2 className="text-base font-bold text-gray-900">나의 여정 기록</h2>
                </div>

                <div className="bg-white rounded-xl p-4 border border-pink-100 shadow-sm">
                    <div className="flex justify-between items-baseline mb-2">
                        <p className="text-xs font-medium text-gray-700">
                            <span className="text-pink-600 font-bold">{userName}</span> 님의 추모 여정이 <span className="text-pink-600 font-bold">{percent}%</span> 준비되었습니다.
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden mb-2">
                        <div
                            className="bg-gradient-to-r from-pink-400 to-purple-400 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${percent}%` }}
                        />
                    </div>

                    <p className="text-xs text-gray-500">
                        나머지 <strong>{100 - percent}%</strong>를 위해 AI 상담사에게 장례 절차를 물어보세요.
                    </p>
                </div>
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
        </section>
    );
}
