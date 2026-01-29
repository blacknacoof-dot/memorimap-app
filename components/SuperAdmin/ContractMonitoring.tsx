import React, { useState, useEffect } from 'react';
import {
    Activity, AlertCircle, Clock, CheckCircle2,
    Search, MapPin, Phone, MessageSquare,
    ChevronRight, BellRing, User
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { SangjoContract } from '../../types';

export const ContractMonitoring: React.FC = () => {
    const [contracts, setContracts] = useState<SangjoContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'urgent' | 'normal'>('all');

    useEffect(() => {
        loadContracts();
        setupRealtime();
    }, []);

    const loadContracts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('sangjo_contracts')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) setContracts(data as SangjoContract[]);
        setLoading(false);
    };

    const setupRealtime = () => {
        const channel = supabase
            .channel('super-admin-monitoring')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'sangjo_contracts'
            }, (payload) => {
                const updated = payload.new as SangjoContract;
                setContracts(prev => {
                    const exists = prev.find(c => c.contract_number === updated.contract_number);
                    if (exists) {
                        return prev.map(c => c.contract_number === updated.contract_number ? updated : c);
                    }
                    return [updated, ...prev];
                });

                if (updated.emergency_level === 'critical') {
                    playEmergencySound();
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    };

    const playEmergencySound = () => {
        // 실제 구현 시 오디오 파일 경로 추가
        console.log('🚨 긴급 상황 발생 알림음 재생');
    };

    const filteredContracts = contracts.filter(c =>
        activeFilter === 'all' || c.emergency_level === activeFilter
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Realtime Alert Feed (Header) */}
            <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl text-white shadow-xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-all"></div>
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center animate-pulse relative z-10">
                    <Activity className="w-6 h-6" />
                </div>
                <div className="relative z-10">
                    <h2 className="font-bold text-sm">실시간 관제 시스템 가동 중</h2>
                    <p className="text-[10px] text-slate-400 font-medium tracking-wider">현재 전국 모든 파트너사의 상담 및 계약을 실시간으로 모니터링하고 있습니다.</p>
                </div>
                <div className="ml-auto flex items-center gap-6 relative z-10 pr-4">
                    <div className="text-center">
                        <p className="text-xl font-black text-red-500">{contracts.filter(c => c.emergency_level === 'critical').length}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-black">Critical</p>
                    </div>
                    <div className="text-center border-l border-slate-700 pl-6">
                        <p className="text-xl font-black text-amber-500">{contracts.filter(c => c.emergency_level === 'urgent').length}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-black">Urgent</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                {[
                    { id: 'all', label: '전체', color: 'bg-slate-800' },
                    { id: 'critical', label: '🔴 긴급 (임종)', color: 'bg-red-600' },
                    { id: 'urgent', label: '🟡 중요 (상담)', color: 'bg-amber-600' },
                    { id: 'normal', label: '🟢 일반', color: 'bg-green-600' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveFilter(tab.id as any)}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeFilter === tab.id
                                ? `${tab.color} text-white shadow-md`
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Contract List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="py-20 text-center text-slate-400">관제 데이터를 연결 중...</div>
                ) : filteredContracts.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">현재 해당 등급의 계약이 없습니다.</div>
                ) : filteredContracts.map((contract) => (
                    <div
                        key={contract.contract_number}
                        className={`bg-white border-2 rounded-2xl p-5 flex items-center justify-between transition-all hover:shadow-lg group ${contract.emergency_level === 'critical' ? 'border-red-500/50 bg-red-50/20' :
                                contract.emergency_level === 'urgent' ? 'border-amber-500/30' : 'border-slate-100'
                            }`}
                    >
                        <div className="flex items-center gap-6">
                            {/* Status Icon */}
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${contract.emergency_level === 'critical' ? 'bg-red-100 text-red-600 animate-pulse' :
                                    contract.emergency_level === 'urgent' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                                }`}>
                                {contract.emergency_level === 'critical' ? <BellRing size={28} /> :
                                    contract.emergency_level === 'urgent' ? <AlertCircle size={28} /> : <Clock size={28} />}
                            </div>

                            {/* Client Info */}
                            <div>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <h3 className="text-lg font-black text-slate-800">{contract.customer_name}</h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-tighter">
                                        {contract.contract_number}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <MapPin size={12} />
                                        <span>{contract.region || '전국'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Activity size={12} />
                                        <span className="font-bold text-blue-600">{contract.status}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <Clock size={12} />
                                        <span>{new Date(contract.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="flex items-center gap-4">
                            <div className="text-right mr-4">
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">배정 파트너</p>
                                <p className="text-sm font-bold text-slate-700">{contract.sangjo_id || '자동 배정 중'}</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-100">
                                    <MessageSquare size={18} />
                                </button>
                                <button className="p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all shadow-md flex items-center gap-2 font-bold text-xs px-4">
                                    상세 관제 <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
