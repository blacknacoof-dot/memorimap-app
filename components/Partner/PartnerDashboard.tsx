import React, { useState, useEffect } from 'react';
import {
    MessageSquare, Truck,
    Settings, LogOut, User,
    Menu, X, Sparkles, TrendingUp,
    Calendar, ClipboardList, Wallet
} from 'lucide-react';
import { LiveConsultation } from './LiveConsultation';
import { OperationsManagement } from './OperationsManagement';
import { AIConfiguration } from './AIConfiguration';
import { FacilityInfoEditor } from './FacilityInfoEditor';
import { PartnerReservationsTab } from './PartnerReservationsTab';
import { PartnerRevenueTab } from './PartnerRevenueTab';
import { NotificationCenter } from '../NotificationCenter';
import { ConsultationList } from '../ConsultationList';
import { supabase, getAuthClient } from '../../lib/supabaseClient';
import { useSession } from '../../lib/auth';
import { Consultation, getFacilitySubscription } from '../../lib/queries';
import { Reservation } from '../../types';
import type { Subscription, Payment } from '../../types/db';
import { toast } from 'sonner';

interface PartnerDashboardProps {
    partnerId: string;
    onLogout: () => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ partnerId, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'ops' | 'ai_config' | 'consultations' | 'reservations' | 'revenue' | 'settings'>('consultations');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [partnerName, setPartnerName] = useState('상조 파트너');
    const [facilityId, setFacilityId] = useState<string | null>(null);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [showPlanSelector, setShowPlanSelector] = useState(false);
    const { session } = useSession();

    useEffect(() => {
        const fetchPartner = async () => {
            const client = await getAuthClient(session, { strict: true });

            // partnerId는 실제로 facility UUID (sangjo_hq_admins.sangjo_id에서 가져온 값)
            // 바로 facilityId로 설정
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partnerId);

            if (isUUID) {
                setFacilityId(partnerId);
                // 시설 이름으로 파트너명 설정
                const { data: facility } = await client
                    .from('facilities')
                    .select('name')
                    .eq('id', partnerId)
                    .maybeSingle();
                if (facility?.name) {
                    setPartnerName(facility.name);
                    return;
                }
            }

            // fallback: partners 테이블 조회 (TEXT ID인 경우)
            const { data } = await client.from('partners').select('name').eq('id', partnerId).maybeSingle();
            let name = data?.name;

            if (!name) {
                const { data: hqData } = await client
                    .from('sangjo_hq_admins')
                    .select('company_name, sangjo_id')
                    .eq('sangjo_id', partnerId)
                    .limit(1)
                    .maybeSingle();
                if (hqData) name = hqData.company_name;
            }

            if (name) setPartnerName(name);

            // facility_id가 아직 없으면 sangjo_hq_admins의 sangjo_id로 시설 조회
            if (!isUUID) {
                const { data: hqLink } = await client
                    .from('sangjo_hq_admins')
                    .select('sangjo_id')
                    .eq('sangjo_id', partnerId)
                    .limit(1)
                    .maybeSingle();
                if (hqLink?.sangjo_id) {
                    setFacilityId(hqLink.sangjo_id);
                }
            }
        };
        if (!session) return;
        fetchPartner();
    }, [partnerId, session]);

    // facility_id가 확보되면 상담/예약 데이터 로드
    useEffect(() => {
        if (!facilityId) return;

        const loadFacilityData = async () => {
            try {
                const client = await getAuthClient(session, { strict: true });
                const [consResult, resResult, subData] = await Promise.all([
                    client.from('consultations').select('*').eq('facility_id', facilityId).order('created_at', { ascending: false }),
                    client.from('reservations').select('*').eq('facility_id', facilityId).order('created_at', { ascending: false }),
                    getFacilitySubscription(facilityId, client),
                ]);
                if (consResult.data) setConsultations(consResult.data as Consultation[]);
                if (resResult.data) setReservations(resResult.data as Reservation[]);
                if (subData) {
                    setSubscription(subData);
                    // subscription_payments는 subscription_id로 조회 (facility_id 컬럼 없음)
                    const { data: payData } = await client
                        .from('subscription_payments')
                        .select('*')
                        .eq('subscription_id', subData.id)
                        .order('paid_at', { ascending: false });
                    if (payData) setPayments(payData);
                }
            } catch (err) {
                // data load failed
                toast.error('데이터를 불러오지 못했습니다.');
            }
        };
        loadFacilityData();

        // Realtime 구독
        const consChannel = supabase
            .channel(`partner-cons-${facilityId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'consultations', filter: `facility_id=eq.${facilityId}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setConsultations(prev => [payload.new as Consultation, ...prev]);
                    toast.info('새 상담 문의가 접수되었습니다.');
                } else if (payload.eventType === 'UPDATE') {
                    setConsultations(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
                }
            })
            .subscribe();

        const resChannel = supabase
            .channel(`partner-res-${facilityId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `facility_id=eq.${facilityId}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setReservations(prev => [payload.new as Reservation, ...prev]);
                    toast.info('새 예약이 접수되었습니다.');
                } else if (payload.eventType === 'UPDATE') {
                    setReservations(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(consChannel);
            supabase.removeChannel(resChannel);
        };
    }, [facilityId]);

    const unreadConsultations = consultations.filter(c => !c.is_read).length;
    const pendingReservations = reservations.filter(r => r.status === 'pending' || r.status === 'urgent').length;

    const menuItems = [
        { id: 'consultations', label: '상담 관리', icon: ClipboardList, badge: unreadConsultations > 0 ? `${unreadConsultations}` : undefined },
        { id: 'reservations', label: '예약 관리', icon: Calendar, badge: pendingReservations > 0 ? `${pendingReservations}` : undefined },
        { id: 'revenue', label: '구독/매출', icon: Wallet },
        { id: 'chat', label: '실시간 채팅', icon: MessageSquare, badge: 'LIVE' },
        { id: 'ops', label: '운영 현황', icon: Truck },
        { id: 'ai_config', label: 'AI 시나리오', icon: Sparkles },
        { id: 'settings', label: '회사 정보', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 transition-all duration-300 flex-col z-50 hidden md:flex`}>
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                        <TrendingUp className="text-white w-5 h-5" />
                    </div>
                    {isSidebarOpen && <span className="font-black text-white text-lg tracking-tighter">Memorimap</span>}
                </div>

                <nav className="flex-1 px-3 space-y-1 mt-4">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as typeof activeTab)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all group ${activeTab === item.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                            {isSidebarOpen && (
                                <div className="flex-1 flex justify-between items-center text-sm font-bold">
                                    {item.label}
                                    {item.badge && (
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-blue-500 text-white animate-pulse'
                                            }`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    {isSidebarOpen ? (
                        <div className="bg-slate-800/50 p-4 rounded-3xl flex items-center gap-3 border border-slate-700/50">
                            <div className="w-10 h-10 bg-slate-700 rounded-2xl flex items-center justify-center">
                                <User className="text-slate-400" size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-white truncate">{partnerName}</p>
                                <p className="text-[10px] text-slate-500 font-bold">Premium Partner</p>
                            </div>
                        </div>
                    ) : (
                        <button className="w-full flex justify-center py-2 text-slate-500 hover:text-white"><User size={20} /></button>
                    )}
                    <button
                        onClick={() => { supabase.auth.signOut().then(() => onLogout()); }}
                        className="w-full mt-4 flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 transition-colors text-sm font-bold"
                    >
                        <LogOut size={18} />
                        {isSidebarOpen && <span>로그아웃</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-[100dvh] md:h-screen overflow-hidden">
                {/* Mobile Tab Nav */}
                <div className="md:hidden flex overflow-x-auto scrollbar-hide bg-slate-900 px-2 py-2 gap-1">
                    <button
                        onClick={onLogout}
                        className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap text-slate-400 hover:text-white"
                    >
                        ← 메인
                    </button>
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as typeof activeTab)}
                            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                                activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                    <button
                        onClick={() => { supabase.auth.signOut().then(() => onLogout()); }}
                        className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap text-red-400 hover:text-red-300"
                    >
                        로그아웃
                    </button>
                </div>

                {/* Header */}
                <header className="h-14 md:h-16 bg-white border-b border-slate-100 px-4 md:px-8 flex items-center justify-between z-40">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h1 className="font-black text-slate-800 tracking-tight">
                            {menuItems.find(i => i.id === activeTab)?.label || '파트너 센터'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-tighter border border-blue-100 shadow-sm shadow-blue-500/5">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                            System Online
                        </div>
                        <NotificationCenter />
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-50">
                    <div className="max-w-[1400px] mx-auto">
                        {activeTab === 'consultations' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                        <ClipboardList className="text-blue-600" size={20} />
                                        상담 문의 관리
                                    </h2>
                                    <div className="flex gap-2 text-xs">
                                        <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl font-bold border border-amber-100">
                                            대기 {consultations.filter(c => c.status === 'pending' || c.status === 'waiting').length}
                                        </span>
                                        <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-xl font-bold border border-green-100">
                                            완료 {consultations.filter(c => c.status === 'accepted' || c.status === 'completed').length}
                                        </span>
                                    </div>
                                </div>
                                <ConsultationList
                                    consultations={consultations}
                                    onAnswer={async (id, text) => {
                                        const client = await getAuthClient(session, { strict: true });
                                        const { error } = await client
                                            .from('consultations')
                                            .update({ answer: text, answered_at: new Date().toISOString(), status: 'accepted', is_read: true })
                                            .eq('id', id);
                                        if (!error) {
                                            setConsultations(prev => prev.map(c =>
                                                c.id === id ? { ...c, answer: text, answered_at: new Date().toISOString(), status: 'accepted', is_read: true } : c
                                            ));
                                            toast.success('답변이 전송되었습니다.');
                                        } else {
                                            toast.error('답변 전송 실패');
                                        }
                                    }}
                                    onRead={async (id) => {
                                        const client = await getAuthClient(session, { strict: true });
                                        await client.from('consultations').update({ is_read: true }).eq('id', id);
                                        setConsultations(prev => prev.map(c => c.id === id ? { ...c, is_read: true } : c));
                                    }}
                                />
                            </div>
                        )}
                        {activeTab === 'reservations' && (
                            <PartnerReservationsTab
                                reservations={reservations}
                                setReservations={setReservations}
                                session={session}
                            />
                        )}
                        {activeTab === 'revenue' && (
                            <PartnerRevenueTab
                                consultations={consultations}
                                reservations={reservations}
                                subscription={subscription}
                                payments={payments}
                                facilityId={facilityId}
                                partnerId={partnerId}
                                showPlanSelector={showPlanSelector}
                                setShowPlanSelector={setShowPlanSelector}
                            />
                        )}
                        {activeTab === 'chat' && <LiveConsultation partnerId={partnerId} />}
                        {activeTab === 'ops' && <OperationsManagement partnerId={partnerId} />}
                        {activeTab === 'ai_config' && <AIConfiguration partnerId={partnerId} />}
                        {activeTab === 'settings' && (
                            facilityId ? (
                                <FacilityInfoEditor facilityId={facilityId} />
                            ) : (
                                <div className="p-20 text-center text-slate-400">
                                    <Settings className="mx-auto mb-3 opacity-50" size={48} />
                                    <p className="text-sm font-medium">연결된 시설이 없습니다.</p>
                                    <p className="text-xs mt-1">관리자에게 시설 연결을 요청해주세요.</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
