import { useEffect, useState } from 'react';
import { supabase, createAuthenticatedClient } from '../lib/supabaseClient';
import { useUser, useSession } from '../lib/auth';
import { toast } from 'sonner';
import EndingNoteEditModal from './EndingNoteEditModal';

interface EndingNote {
    preferences: string[];
    contact: string;
    memo: string;
    percent: number;
}

export default function EndingNoteCard() {
    const [note, setNote] = useState<EndingNote | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { user } = useUser();
    const { session } = useSession();

    useEffect(() => {
        if (user) loadNote();
    }, [user]);

    const getAuthClient = async () => {
        try {
            const token = await session?.getToken({ template: 'supabase' });
            if (token) return createAuthenticatedClient(token);
        } catch { /* fallback */ }
        return supabase;
    };

    const loadNote = async () => {
        const client = await getAuthClient();
        const { data, error } = await client.rpc('get_my_journey_full');
        if (!error) {
            setNote(data?.ending_note || null);
        }
    };

    const updateNote = async (updates: Partial<EndingNote>) => {
        if (!user) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        const client = await getAuthClient();
        const { error } = await client
            .from('user_ending_notes')
            .upsert({
                user_id: user.id,
                preferred_types: updates.preferences || note?.preferences,
                emergency_contact: updates.contact || note?.contact,
                final_memo: updates.memo || note?.memo,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('업데이트 실패:', error);
            toast.error('정보 업데이트 중 오류가 발생했습니다.');
        } else {
            toast.success('엔딩 노트가 저장되었습니다.');
            loadNote();
            setIsEditModalOpen(false);
        }
    };

    return (
        <section className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 shadow-sm border border-pink-100/50">
            {/* 진행률 섹션 */}
            <div className="mb-6">
                <div className="flex justify-between items-end mb-3">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">나의 여정 기록</h2>
                        <p className="text-xs text-gray-500 mt-1">마음 편한 마무리를 위한 준비</p>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                            {note?.percent || 0}%
                        </span>
                    </div>
                </div>

                {/* 프로그레스 바 */}
                <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                        className="bg-gradient-to-r from-pink-400 to-purple-400 h-full transition-all duration-1000 ease-out"
                        style={{ width: `${note?.percent || 0}%` }}
                    />
                </div>

                <div className="mt-4 space-y-1">
                    <p className="text-sm text-gray-700">
                        {user?.fullName || user?.firstName || '사용자'} 님의 추모 여정이 <strong>{note?.percent || 0}%</strong> 준비되었습니다.
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        나머지 <strong>{100 - (note?.percent || 0)}%</strong>를 위해 AI 상담사에게 장례 절차를 물어보세요.
                    </p>
                </div>
            </div>

            {/* 엔딩 노트 상세 카드 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 space-y-5 border border-white">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">나의 엔딩 노트</h3>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-pink-400 rounded-full" /> 나의 선호 방식
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {note?.preferences && note.preferences.length > 0 ? (
                                note.preferences.map((pref, i) => (
                                    <span key={i} className="px-3 py-1 bg-pink-50 text-pink-600 rounded-lg text-xs font-bold border border-pink-100">
                                        #{pref}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-400 text-xs italic">설정된 선호 방식이 없습니다.</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-pink-400 rounded-full" /> 비상 연락망
                        </h4>
                        <p className="text-sm text-gray-700 font-medium">
                            {note?.contact || '미등록'}
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-pink-400 rounded-full" /> 한 줄 메모
                        </h4>
                        <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-600 italic">
                                "{note?.memo || '아직 남긴 메모가 없습니다.'}"
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:opacity-95 transition-all active:scale-95"
                >
                    엔딩 노트 편집하기
                </button>
            </div>

            <EndingNoteEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                currentNote={note}
                onSave={async (updates) => {
                    await updateNote(updates);
                }}
            />
        </section>
    );
}
