import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
    LayoutDashboard, MessageSquare, Truck,
    Settings, LogOut, Bell, User,
    Menu, X, Sparkles, TrendingUp, ChevronRight,
    Calendar, ClipboardList, Clock, CheckCircle, XCircle,
    Wallet, CreditCard, BarChart3, Crown
} from 'lucide-react';
import { LiveConsultation } from './LiveConsultation';
import { OperationsManagement } from './OperationsManagement';
import { AIConfiguration } from './AIConfiguration';
import { FacilityInfoEditor } from './FacilityInfoEditor';
import { NotificationCenter } from '../NotificationCenter';
import { ConsultationList } from '../ConsultationList';
import { supabase, getAuthClient } from '../../lib/supabaseClient';
import { useSession } from '../../lib/auth';
import { Consultation, getFacilitySubscription, approveReservation, rejectReservation } from '../../lib/queries';
import { Reservation } from '../../types';
import { toast } from 'sonner';

const SubscriptionPlans = lazy(() => import('../SubscriptionPlans'));

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
    const [subscription, setSubscription] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [showPlanSelector, setShowPlanSelector] = useState(false);
    const { session } = useSession();

    useEffect(() => {
        const fetchPartner = async () => {
            const client = await getAuthClient(session);

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

            // facility_id가 아직 없으면 이름으로 조회
            if (!isUUID && name) {
                const { data: facility } = await client
                    .from('facilities')
                    .select('id')
                    .eq('name', name)
                    .limit(1)
                    .maybeSingle();
                if (facility) setFacilityId(facility.id);
            }
        };
        fetchPartner();
    }, [partnerId]);

    // facility_id가 확보되면 상담/예약 데이터 로드
    useEffect(() => {
        if (!facilityId) return;

        const loadFacilityData = async () => {
            try {
                const client = await getAuthClient(session);
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
                            onClick={() => setActiveTab(item.id as any)}
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
                            onClick={() => setActiveTab(item.id as any)}
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
                                        const client = await getAuthClient(session);
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
                                        const client = await getAuthClient(session);
                                        await client.from('consultations').update({ is_read: true }).eq('id', id);
                                        setConsultations(prev => prev.map(c => c.id === id ? { ...c, is_read: true } : c));
                                    }}
                                />
                            </div>
                        )}
                        {activeTab === 'reservations' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                        <Calendar className="text-blue-600" size={20} />
                                        예약 관리
                                    </h2>
                                    <div className="flex gap-2 text-xs">
                                        <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl font-bold border border-amber-100">
                                            대기 {reservations.filter(r => r.status === 'pending' || r.status === 'urgent').length}
                                        </span>
                                        <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-xl font-bold border border-green-100">
                                            확정 {reservations.filter(r => r.status === 'confirmed').length}
                                        </span>
                                    </div>
                                </div>
                                {reservations.length === 0 ? (
                                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
                                        <Calendar size={48} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-slate-400 text-sm font-medium">접수된 예약이 없습니다.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {reservations.map(res => (
                                            <div key={res.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm">{res.visitor_name || '예약자'}</h4>
                                                        <p className="text-xs text-slate-500 mt-0.5">{res.contact_number || '연락처 없음'}</p>
                                                    </div>
                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                                                        res.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                        res.status === 'urgent' ? 'bg-red-100 text-red-700 animate-pulse' :
                                                        res.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                        'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {res.status === 'pending' ? '대기' : res.status === 'urgent' ? '긴급' : res.status === 'confirmed' ? '확정' : '취소'}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3 text-xs">
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <Calendar size={13} className="text-slate-400" />
                                                        {res.visit_date ? new Date(res.visit_date).toLocaleDateString() : '-'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <Clock size={13} className="text-slate-400" />
                                                        {res.time_slot || '-'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <User size={13} className="text-slate-400" />
                                                        {res.visitor_count || 1}명
                                                    </div>
                                                </div>
                                                {res.purpose && (
                                                    <p className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">{res.purpose}</p>
                                                )}
                                                {(res.status === 'pending' || res.status === 'urgent') && (
                                                    <div className="flex gap-2 mt-4">
                                                        <button
                                                            onClick={async () => {
                                                                if (!res.id) return;
                                                                if (!confirm('이 예약을 승인하시겠습니까?')) return;
                                                                try {
                                                                    const client = await getAuthClient(session);
                                                                    await approveReservation(res.id, client);
                                                                    setReservations(prev => prev.map(r => r.id === res.id ? { ...r, status: 'confirmed' as const } : r));
                                                                    toast.success('예약이 승인되었습니다.');
                                                                } catch {
                                                                    toast.error('예약 승인 중 오류가 발생했습니다.');
                                                                }
                                                            }}
                                                            className="flex-1 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-1"
                                                        >
                                                            <CheckCircle size={14} /> 승인
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!res.id) return;
                                                                if (!confirm('이 예약을 거절하시겠습니까?')) return;
                                                                try {
                                                                    const client = await getAuthClient(session);
                                                                    await rejectReservation(res.id, undefined, client);
                                                                    setReservations(prev => prev.map(r => r.id === res.id ? { ...r, status: 'cancelled' as const } : r));
                                                                    toast.success('예약이 거절되었습니다.');
                                                                } catch {
                                                                    toast.error('예약 거절 중 오류가 발생했습니다.');
                                                                }
                                                            }}
                                                            className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-1"
                                                        >
                                                            <XCircle size={14} /> 거절
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'revenue' && (
                            <div className="space-y-6">
                                {/* 요금제 선택 패널 */}
                                {showPlanSelector && (
                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                                <Crown size={18} className="text-purple-600" />
                                                상조 요금제 선택
                                            </h3>
                                            <button onClick={() => setShowPlanSelector(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <Suspense fallback={<div className="text-center py-8 text-slate-400 text-sm">로딩중...</div>}>
                                            <SubscriptionPlans
                                                type="sangjo"
                                                currentPlan={subscription?.plan_id}
                                                facilityId={facilityId || partnerId}
                                                onSelectPlan={(planId) => {
                                                    toast.success(`${planId} 플랜 신청이 접수되었습니다.`);
                                                    setShowPlanSelector(false);
                                                }}
                                            />
                                        </Suspense>
                                    </div>
                                )}

                                {/* KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                                <Crown className="w-6 h-6" />
                                            </div>
                                            <button
                                                onClick={() => setShowPlanSelector(!showPlanSelector)}
                                                className="text-[11px] font-bold bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                {subscription ? '요금제 변경' : '요금제 선택'}
                                            </button>
                                        </div>
                                        <p className="text-[11px] font-bold text-blue-100 uppercase tracking-widest opacity-80 mb-1">현재 구독</p>
                                        <h2 className="text-2xl font-black tracking-tight">
                                            {subscription?.plan_name || '미구독'}
                                        </h2>
                                        {subscription?.next_billing_date && (
                                            <p className="text-[10px] text-blue-200 mt-2">
                                                다음 결제: {new Date(subscription.next_billing_date).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                                <BarChart3 className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">총 상담 건수</p>
                                        <h2 className="text-2xl font-black text-slate-800">{consultations.length}건</h2>
                                        <p className="text-[10px] text-slate-400 mt-2">
                                            답변 완료 <span className="text-emerald-600 font-bold">
                                                {consultations.filter(c => c.status === 'accepted' || c.status === 'completed').length}건
                                            </span>
                                        </p>
                                    </div>

                                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                                                <CreditCard className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">총 예약 건수</p>
                                        <h2 className="text-2xl font-black text-slate-800">{reservations.length}건</h2>
                                        <p className="text-[10px] text-slate-400 mt-2">
                                            확정 <span className="text-green-600 font-bold">
                                                {reservations.filter(r => r.status === 'confirmed').length}건
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* 월별 상담 추이 (최근 6개월) */}
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                                    <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                                        <TrendingUp size={18} className="text-blue-600" />
                                        월별 상담/예약 추이
                                    </h3>
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                        {(() => {
                                            const months: { label: string; cons: number; res: number }[] = [];
                                            for (let i = 5; i >= 0; i--) {
                                                const d = new Date();
                                                d.setMonth(d.getMonth() - i);
                                                const y = d.getFullYear();
                                                const m = d.getMonth();
                                                const label = `${m + 1}월`;
                                                const cons = consultations.filter(c => {
                                                    const cd = new Date(c.created_at);
                                                    return cd.getFullYear() === y && cd.getMonth() === m;
                                                }).length;
                                                const res = reservations.filter(r => {
                                                    const rd = new Date(r.visit_date);
                                                    return rd.getFullYear() === y && rd.getMonth() === m;
                                                }).length;
                                                months.push({ label, cons, res });
                                            }
                                            const maxVal = Math.max(1, ...months.map(m => m.cons + m.res));
                                            return months.map((m, i) => (
                                                <div key={i} className="text-center">
                                                    <div className="h-32 flex flex-col items-center justify-end gap-0.5 mb-2">
                                                        <div
                                                            className="w-8 bg-blue-500 rounded-t-lg transition-all"
                                                            style={{ height: `${(m.cons / maxVal) * 100}%`, minHeight: m.cons > 0 ? 4 : 0 }}
                                                            title={`상담 ${m.cons}건`}
                                                        />
                                                        <div
                                                            className="w-8 bg-amber-400 rounded-b-lg transition-all"
                                                            style={{ height: `${(m.res / maxVal) * 100}%`, minHeight: m.res > 0 ? 4 : 0 }}
                                                            title={`예약 ${m.res}건`}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500">{m.label}</span>
                                                    <div className="text-[9px] text-slate-400 mt-0.5">{m.cons + m.res}건</div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                    <div className="flex gap-4 mt-4 justify-center">
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                            <div className="w-3 h-3 bg-blue-500 rounded" /> 상담
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                            <div className="w-3 h-3 bg-amber-400 rounded" /> 예약
                                        </div>
                                    </div>
                                </div>

                                {/* 결제 내역 */}
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-100">
                                        <h3 className="font-black text-slate-800 flex items-center gap-2">
                                            <Wallet size={18} className="text-blue-600" />
                                            결제 내역
                                        </h3>
                                    </div>
                                    {payments.length > 0 ? (
                                        <div className="overflow-x-auto">
                                        <table className="w-full text-sm min-w-[400px]">
                                            <thead className="bg-slate-50 text-slate-500 text-xs">
                                                <tr>
                                                    <th className="text-left px-3 md:px-6 py-3 font-bold">결제일</th>
                                                    <th className="text-left px-3 md:px-6 py-3 font-bold">내용</th>
                                                    <th className="text-right px-3 md:px-6 py-3 font-bold">금액</th>
                                                    <th className="text-right px-3 md:px-6 py-3 font-bold">상태</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {payments.map((p: any) => (
                                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-3 md:px-6 py-3.5 text-slate-600 text-xs">
                                                            {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '-'}
                                                        </td>
                                                        <td className="px-3 md:px-6 py-3.5 text-slate-800 font-medium text-xs">
                                                            {p.billing_period_start && p.billing_period_end
                                                                ? `${new Date(p.billing_period_start).toLocaleDateString()} ~ ${new Date(p.billing_period_end).toLocaleDateString()}`
                                                                : '구독 결제'}
                                                        </td>
                                                        <td className="px-3 md:px-6 py-3.5 text-right font-black text-slate-800 text-xs">
                                                            {(p.final_amount || p.amount || 0).toLocaleString()}원
                                                        </td>
                                                        <td className="px-3 md:px-6 py-3.5 text-right">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                p.status === 'paid' || p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                                {p.status === 'paid' || p.status === 'completed' ? '완료' : '대기'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center text-slate-400 text-sm">
                                            결제 내역이 없습니다.
                                        </div>
                                    )}
                                </div>

                                {/* 구독 플랜 상세 */}
                                {subscription && (
                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                                        <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                                            <Crown size={18} className="text-purple-600" />
                                            구독 플랜 상세
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-slate-50 rounded-2xl p-4">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">플랜</p>
                                                <p className="font-black text-slate-800">{subscription.plan_name || '-'}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-4">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">월 요금</p>
                                                <p className="font-black text-slate-800">
                                                    {subscription.plan_price ? `${Number(subscription.plan_price).toLocaleString()}원` : '-'}
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-4">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">시작일</p>
                                                <p className="font-black text-slate-800">
                                                    {(subscription.started_at || subscription.start_date) ? new Date(subscription.started_at || subscription.start_date).toLocaleDateString() : '-'}
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-4">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">다음 결제일</p>
                                                <p className="font-black text-slate-800">
                                                    {subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
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
