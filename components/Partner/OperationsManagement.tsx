import React, { useState, useEffect } from 'react';
import {
    LayoutGrid, User, Truck, MapPin,
    Calendar, MoreVertical, Plus,
    ChevronRight, CheckCircle, Clock, X
} from 'lucide-react';
import { getAuthClient } from '../../lib/supabaseClient';
import { useSession } from '../../lib/auth';
import { PartnerOperation } from '../../types';
import { toast } from 'sonner';
import { confirmAsync } from '../../src/components/common/ConfirmModal';

interface OperationsManagementProps {
    partnerId: string; // sangjo_hq_admins.sangjo_id
}

interface NewOperationForm {
    deceased_name: string;
    funeral_director: string;
    funeral_location: string;
    notes: string;
}

const EMPTY_FORM: NewOperationForm = {
    deceased_name: '',
    funeral_director: '',
    funeral_location: '',
    notes: '',
};

export const OperationsManagement: React.FC<OperationsManagementProps> = ({ partnerId }) => {
    const [operations, setOperations] = useState<PartnerOperation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [form, setForm] = useState<NewOperationForm>(EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const { session } = useSession();

    const STAGES: PartnerOperation['operation_stage'][] = ['pending', 'dispatched', 'in_progress', 'completed'];

    const loadOperations = async () => {
        const client = await getAuthClient(session, { strict: true });
        const { data } = await client
            .from('partner_operations')
            .select('*')
            .eq('partner_id', partnerId)
            .order('created_at', { ascending: false });
        if (data) setOperations(data as PartnerOperation[]);
        setLoading(false);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadOperations();

        // [Realtime Sync] — auth client
        let mounted = true;
        let cleanup: (() => void) | undefined;

        getAuthClient(session).then(client => {
            if (!mounted) return;
            const channel = client
                .channel(`partner-ops-${partnerId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'partner_operations',
                    filter: `partner_id=eq.${partnerId}`
                }, () => { loadOperations(); })
                .subscribe();

            cleanup = () => {
                channel.unsubscribe();

            };
        });

        return () => { mounted = false; cleanup?.(); };
    }, [partnerId, session]);

    const handleMove = async (id: string, nextStage: PartnerOperation['operation_stage']) => {
        const confirmed = await confirmAsync(`운영 단계를 '${nextStage}'(으)로 변경하시겠습니까?`, '단계 변경');
        if (!confirmed) return;
        try {
            const client = await getAuthClient(session, { strict: true });
            const { error } = await client
                .from('partner_operations')
                .update({ operation_stage: nextStage })
                .eq('id', id);
            if (error) throw error;
            toast.success('단계가 변경되었습니다.');
        } catch {
            toast.error('단계 변경에 실패했습니다.');
        }
    };

    const handleNewOperation = async () => {
        if (!form.deceased_name.trim()) {
            toast.error('고인명을 입력해주세요.');
            return;
        }
        setIsSaving(true);
        try {
            const client = await getAuthClient(session, { strict: true });
            const { error } = await client.from('partner_operations').insert({
                partner_id: partnerId,
                operation_stage: 'pending',
                deceased_name: form.deceased_name.trim(),
                funeral_director: form.funeral_director.trim() || null,
                funeral_location: form.funeral_location.trim() || null,
                notes: form.notes.trim() || null,
            });
            if (error) throw error;
            toast.success('신규 작업이 접수되었습니다.');
            setForm(EMPTY_FORM);
            setShowNewModal(false);
        } catch (err) {
            toast.error('작업 접수에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const renderCard = (op: PartnerOperation) => (
        <div key={op.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group mb-3">
            <div className="flex justify-between items-start mb-3">
                <h5 className="font-bold text-slate-800 text-sm">{op.deceased_name || '성함 미상'}</h5>
                <button onClick={() => toast.info('추가 기능은 준비 중입니다.')} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-slate-500 -mr-2 -mt-2"><MoreVertical size={16} /></button>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <User size={12} className="text-slate-400" />
                    지도사: <span className="text-slate-700">{op.funeral_director || '배정 대기'}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <MapPin size={12} className="text-slate-400" />
                    장소: <span className="text-slate-700 truncate">{op.funeral_location || '위치 정보 없음'}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Clock size={12} className="text-slate-400" />
                    접수: {new Date(op.created_at).toLocaleDateString()}
                </div>
            </div>

            <div className="flex gap-1.5 pt-3 border-t border-slate-50">
                {op.operation_stage === 'pending' && (
                    <button
                        onClick={() => handleMove(op.id, 'dispatched')}
                        className="w-full bg-slate-800 text-white py-2.5 rounded-lg text-xs font-bold min-h-[44px] hover:bg-slate-900 transition-all flex items-center justify-center gap-1"
                    >
                        <Truck size={12} /> 배정/출동
                    </button>
                )}
                {op.operation_stage === 'dispatched' && (
                    <button
                        onClick={() => handleMove(op.id, 'in_progress')}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-xs font-bold min-h-[44px] hover:bg-blue-700 transition-all flex items-center justify-center gap-1"
                    >
                        <Clock size={12} /> 진행 중 전환
                    </button>
                )}
                {op.operation_stage === 'in_progress' && (
                    <button
                        onClick={() => handleMove(op.id, 'completed')}
                        className="w-full bg-green-600 text-white py-2.5 rounded-lg text-xs font-bold min-h-[44px] hover:bg-green-700 transition-all flex items-center justify-center gap-1"
                    >
                        <CheckCircle size={12} /> 장례 완료
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <LayoutGrid className="text-blue-600" />
                    운영 현황 (Kanban)
                </h2>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-900 transition-all flex items-center gap-2"
                >
                    <Plus size={16} /> 신규 작업 접수
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide min-h-[600px]">
                {STAGES.map((stage) => {
                    const stageOps = operations.filter(op => op.operation_stage === stage);
                    const label = stage === 'pending' ? '대기 중' :
                        stage === 'dispatched' ? '출동/배정' :
                            stage === 'in_progress' ? '진행 중' : '완료';
                    const color = stage === 'pending' ? 'bg-slate-400' :
                        stage === 'dispatched' ? 'bg-blue-500' :
                            stage === 'in_progress' ? 'bg-amber-500' : 'bg-green-500';

                    return (
                        <div key={stage} className="w-72 shrink-0 flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${color}`}></div>
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{label}</span>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">{stageOps.length}</span>
                                </div>
                            </div>

                            <div className="flex-1 bg-slate-100/50 rounded-3xl p-3 border border-slate-200/50">
                                {stageOps.map(renderCard)}
                                {stageOps.length === 0 && (
                                    <div className="py-20 text-center text-[10px] text-slate-400 font-medium">항목 없음</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 신규 작업 접수 모달 */}
            {showNewModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-sm">신규 작업 접수</h3>
                            <button onClick={() => setShowNewModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">고인명 *</label>
                                <input
                                    type="text"
                                    value={form.deceased_name}
                                    onChange={(e) => setForm(f => ({ ...f, deceased_name: e.target.value }))}
                                    placeholder="홍길동"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">담당 장례지도사</label>
                                <input
                                    type="text"
                                    value={form.funeral_director}
                                    onChange={(e) => setForm(f => ({ ...f, funeral_director: e.target.value }))}
                                    placeholder="김지도사"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">장례 장소</label>
                                <input
                                    type="text"
                                    value={form.funeral_location}
                                    onChange={(e) => setForm(f => ({ ...f, funeral_location: e.target.value }))}
                                    placeholder="서울 OO장례식장"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">메모</label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="특이사항 메모"
                                    rows={2}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                                />
                            </div>
                        </div>
                        <div className="px-6 pb-6 flex gap-2">
                            <button
                                onClick={() => setShowNewModal(false)}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleNewOperation}
                                disabled={isSaving}
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {isSaving ? '접수 중...' : '접수하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
