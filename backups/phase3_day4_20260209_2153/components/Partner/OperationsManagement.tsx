import React, { useState, useEffect } from 'react';
import {
    LayoutGrid, User, Truck, MapPin,
    Calendar, MoreVertical, Plus,
    ChevronRight, CheckCircle, Clock
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { PartnerOperation } from '../../types';

interface OperationsManagementProps {
    partnerId: string;
}

export const OperationsManagement: React.FC<OperationsManagementProps> = ({ partnerId }) => {
    const [operations, setOperations] = useState<PartnerOperation[]>([]);
    const [loading, setLoading] = useState(true);

    const STAGES: PartnerOperation['operation_stage'][] = ['pending', 'dispatched', 'in_progress', 'completed'];

    useEffect(() => {
        loadOperations();
        const sub = setupRealtime();
        return () => { sub(); };
    }, [partnerId]);

    const loadOperations = async () => {
        const { data } = await supabase
            .from('partner_operations')
            .select('*')
            .eq('partner_id', partnerId)
            .order('created_at', { ascending: false });
        if (data) setOperations(data as PartnerOperation[]);
        setLoading(false);
    };

    const setupRealtime = () => {
        const channel = supabase
            .channel(`partner-ops-${partnerId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'partner_operations',
                filter: `partner_id=eq.${partnerId}`
            }, () => {
                loadOperations(); // Simple reload for Kanban
            })
            .subscribe();
        return () => {
            channel.unsubscribe();
            supabase.removeChannel(channel);
        };
    };

    const handleMove = async (id: string, nextStage: PartnerOperation['operation_stage']) => {
        await supabase
            .from('partner_operations')
            .update({ operation_stage: nextStage })
            .eq('id', id);
    };

    const renderCard = (op: PartnerOperation) => (
        <div key={op.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group mb-3">
            <div className="flex justify-between items-start mb-3">
                <h5 className="font-bold text-slate-800 text-sm">{op.deceased_name || '성함 미상'}</h5>
                <button className="p-1 text-slate-300 hover:text-slate-500"><MoreVertical size={14} /></button>
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
                        className="w-full bg-slate-800 text-white py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-1"
                    >
                        <Truck size={12} /> 배정/출동
                    </button>
                )}
                {op.operation_stage === 'dispatched' && (
                    <button
                        onClick={() => handleMove(op.id, 'in_progress')}
                        className="w-full bg-blue-600 text-white py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-1"
                    >
                        <Clock size={12} /> 진행 중 전환
                    </button>
                )}
                {op.operation_stage === 'in_progress' && (
                    <button
                        onClick={() => handleMove(op.id, 'completed')}
                        className="w-full bg-green-600 text-white py-1.5 rounded-lg text-[10px] font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-1"
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
                <button className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-900 transition-all flex items-center gap-2">
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
        </div>
    );
};
