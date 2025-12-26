import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { SangjoContract } from "../types";
import {
    AlertCircle,
    MapPin,
    Phone,
    DollarSign,
    Clock,
    CheckCircle2,
    Truck,
    User,
    Activity,
    ChevronRight,
    Camera,
    Calendar,
    X
} from "lucide-react";
import { addTimelineEvent, updateContractStatus, getTimelineEvents, SangjoTimelineEvent } from "../lib/sangjoQueries";
import { RealtimePostgresUpdatePayload } from "@supabase/supabase-js";

interface SangjoDashboardProps {
    sangjoId: string;
    onBack: () => void;
}

export const SangjoDashboard: React.FC<SangjoDashboardProps> = ({ sangjoId, onBack }) => {
    const [contracts, setContracts] = useState<SangjoContract[]>([]);
    const [selectedContract, setSelectedContract] = useState<SangjoContract | null>(null);
    const [timeline, setTimeline] = useState<SangjoTimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [urgentCount, setUrgentCount] = useState(0);

    // 대시보드 데이터 로드
    const loadDashboardData = async () => {
        const { data, error } = await supabase
            .from("sangjo_contracts")
            .select("*")
            .eq("sangjo_id", sangjoId)
            .order("created_at", { ascending: false });

        if (!error && data) {
            setContracts(data as SangjoContract[]);
            setUrgentCount(
                data.filter((c: SangjoContract) => c.status === "임종발생").length
            );
        }
        setLoading(false);
    };

    useEffect(() => {
        loadDashboardData();

        // Supabase Realtime 구독 설정
        const channel = supabase
            .channel('sangjo-contracts-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'sangjo_contracts',
                    filter: `sangjo_id=eq.${sangjoId}`
                },
                (payload) => {
                    console.log('Realtime Update Received:', payload);
                    loadDashboardData(); // 변화 감지 시 데이터 재로드
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sangjoId]);

    // 선택된 계약의 타임라인 로드
    useEffect(() => {
        if (selectedContract) {
            const loadTimeline = async () => {
                try {
                    const events = await getTimelineEvents(selectedContract.contract_number);
                    setTimeline(events);
                } catch (err) {
                    console.error("타임라인 로딩 실패:", err);
                }
            };
            loadTimeline();
        } else {
            setTimeline([]);
        }
    }, [selectedContract]);

    const handleUpdateStatus = async (contractNumber: string, nextStatus: SangjoContract['status']) => {
        try {
            await updateContractStatus(contractNumber, nextStatus);
            await addTimelineEvent(contractNumber, `상태 변경: ${nextStatus}`);
            await loadDashboardData();

            if (selectedContract?.contract_number === contractNumber) {
                const updated = contracts.find(c => c.contract_number === contractNumber);
                if (updated) setSelectedContract({ ...updated, status: nextStatus });
            }
        } catch (err) {
            alert("상태 업데이트 중 오류가 발생했습니다.");
        }
    };

    const handlePhotoUpload = async (contractNumber: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setLoading(true);
        try {
            for (const file of Array.from(files)) {
                // 1. Supabase Storage에 파일 업로드
                const fileExt = file.name.split('.').pop();
                const fileName = `${contractNumber}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `timeline/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('sangjo-photos') // 버킷 이름은 'sangjo-photos'로 가정
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // 2. 공개 URL 가져오기
                const { data: { publicUrl } } = supabase.storage
                    .from('sangjo-photos')
                    .getPublicUrl(filePath);

                // 3. 타임라인에 이벤트 추가
                await addTimelineEvent(contractNumber, "현장 사진 업로드됨", file.name, publicUrl);
            }
            alert("사진이 성공적으로 업로드되었습니다.");

            // 타임라인 새로고침을 위해 선택된 계약 정보 다시 로드
            if (selectedContract) {
                const events = await getTimelineEvents(selectedContract.contract_number);
                setTimeline(events);
            }
        } catch (err: any) {
            console.error("업로드 오류:", err);
            alert(`업로드 중 오류가 발생했습니다: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Sidebar: 계약 목록 */}
            <div className="w-1/3 min-w-[350px] bg-white border-r flex flex-col shadow-xl z-10">
                <div className="p-6 bg-gray-900 text-white shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                            <Activity className="text-amber-500" />
                            상조 실시간 관제
                        </h1>
                        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 bg-white/10 rounded-xl p-3 border border-white/10">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">전체 계약</p>
                            <p className="text-2xl font-black">{contracts.length}</p>
                        </div>
                        <div className={`flex-1 rounded-xl p-3 border ${urgentCount > 0 ? 'bg-red-500/20 border-red-500/30' : 'bg-white/10 border-white/10'}`}>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">긴급 상황</p>
                            <p className={`text-2xl font-black ${urgentCount > 0 ? 'text-red-400' : 'text-white'}`}>{urgentCount}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400">데이터 로딩 중...</div>
                    ) : contracts.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">등록된 계약이 없습니다.</div>
                    ) : (
                        contracts.map((c) => (
                            <div
                                key={c.contract_number}
                                onClick={() => setSelectedContract(c)}
                                className={`p-5 cursor-pointer transition-all border-l-4 ${selectedContract?.contract_number === c.contract_number
                                    ? "bg-amber-50 border-amber-500"
                                    : "hover:bg-gray-50 border-transparent"
                                    } ${c.status === "임종발생" ? "animate-pulse border-red-500 bg-red-50/30" : ""}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate">{c.customer_name}</h3>
                                        <p className="text-xs text-gray-500 font-mono">{c.contract_number}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${c.status === "임종발생" ? "bg-red-100 text-red-600" :
                                        c.status === "현장도착" ? "bg-amber-100 text-amber-600" :
                                            c.status === "완료" ? "bg-green-100 text-green-600" :
                                                c.status === "상담신청" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                                        }`}>
                                        {c.status}
                                    </span>
                                </div>
                                <div className="space-y-1.5 mt-3">
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <MapPin size={12} className="shrink-0" />
                                        <span className="truncate">{c.customer_address || c.region}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <Phone size={12} className="shrink-0" />
                                        <span>{c.customer_phone}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content: 상세 정보 */}
            <div className="flex-1 bg-white overflow-y-auto">
                {selectedContract ? (
                    <div className="h-full flex flex-col">
                        <div className="p-8 bg-white border-b sticky top-0 z-20">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded">
                                            {selectedContract.contract_number}
                                        </span>
                                        <span className="text-xs text-gray-400">계약일: {new Date(selectedContract.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h2 className="text-4xl font-black text-gray-900">{selectedContract.customer_name} 회원님</h2>
                                </div>
                                <div className="flex gap-2">
                                    {selectedContract.status === "예약대기" && (
                                        <button
                                            onClick={() => handleUpdateStatus(selectedContract.contract_number, "임종발생")}
                                            className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 transition-all flex items-center gap-2"
                                        >
                                            <AlertCircle size={18} /> 임종 접수 확인
                                        </button>
                                    )}
                                    {selectedContract.status === "임종발생" && (
                                        <button
                                            onClick={() => handleUpdateStatus(selectedContract.contract_number, "현장도착")}
                                            className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-amber-600 transition-all flex items-center gap-2"
                                        >
                                            <Truck size={18} /> 현장 도착 확인
                                        </button>
                                    )}
                                    {selectedContract.status === "현장도착" && (
                                        <button
                                            onClick={() => handleUpdateStatus(selectedContract.contract_number, "장례식진행")}
                                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                                        >
                                            <Activity size={18} /> 본 장례 진행 시작
                                        </button>
                                    )}
                                    {selectedContract.status === "장례식진행" && (
                                        <button
                                            onClick={() => handleUpdateStatus(selectedContract.contract_number, "완료")}
                                            className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
                                        >
                                            <CheckCircle2 size={18} /> 서비스 완료 확정
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                {/* 핵심 정보 카드 */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wider">서비스 정보</p>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border flex items-center justify-center text-gray-400">
                                                    <Calendar size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold">신청 유형</p>
                                                    <p className="font-bold text-gray-900">
                                                        {selectedContract.application_type === 'CONSULTATION' ? '전문가 전화상담' : '상품 가입 신청'}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedContract.application_type === 'CONSULTATION' && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-50 rounded-xl shadow-sm border border-blue-100 flex items-center justify-center text-blue-500">
                                                        <Phone size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-blue-400 font-bold">희망 통화 시간</p>
                                                        <p className="font-bold text-blue-700">{selectedContract.preferred_call_time || "언제든 가능"}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wider">결제 정보</p>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border flex items-center justify-center text-gray-400">
                                                    <DollarSign size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold">최종 견적액</p>
                                                    <p className="font-black text-amber-600 text-xl">{selectedContract.total_price?.toLocaleString()}원</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border flex items-center justify-center text-gray-400">
                                                    <CheckCircle2 size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold">결제 상태</p>
                                                    <p className="font-bold text-gray-900">사전 예약 (미결제)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 임종 관련 긴급 섹션 */}
                                {selectedContract.status === "임종발생" && (
                                    <div className="p-6 bg-red-50 rounded-2xl border-2 border-red-200 border-dashed">
                                        <div className="flex items-center gap-3 mb-4 text-red-600">
                                            <AlertCircle className="animate-bounce" />
                                            <h4 className="text-lg font-black">긴급 임종 통지 접수</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-4 rounded-xl border border-red-100">
                                                <p className="text-xs text-gray-400 font-bold mb-1">임종 시각</p>
                                                <p className="font-bold text-gray-900">{selectedContract.death_time ? new Date(selectedContract.death_time).toLocaleString() : "방금 전"}</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-red-100">
                                                <p className="text-xs text-gray-400 font-bold mb-1">현재 위치</p>
                                                <p className="font-bold text-gray-900">{selectedContract.current_location || "정보 확인 중"}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 액션 컨트롤 */}
                                <div className="p-6 bg-white border rounded-2xl">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Camera size={18} className="text-blue-500" />
                                        현장 데이터 업로드
                                    </h4>
                                    <div className="flex gap-4 items-center">
                                        <label className="flex-1 flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all group">
                                            <Camera className="text-gray-300 group-hover:text-blue-500" size={32} />
                                            <span className="text-sm text-gray-500 group-hover:text-blue-700">현장 사진 및 자료 업로드</span>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handlePhotoUpload(selectedContract.contract_number, e)}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* 진행 타임라인 */}
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Clock size={18} className="text-amber-500" />
                                    의전 진행 타임라인
                                </h4>
                                <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-gray-200">
                                    {timeline.length === 0 ? (
                                        <div className="relative pl-8">
                                            <div className="absolute left-1.5 top-1.5 w-3 h-3 bg-gray-300 rounded-full ring-4 ring-white" />
                                            <p className="text-sm text-gray-400">등록된 타임라인이 없습니다.</p>
                                        </div>
                                    ) : (
                                        timeline.map((event, idx) => (
                                            <div key={event.id} className="relative pl-8">
                                                <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full ring-4 ring-white ${idx === timeline.length - 1 ? 'bg-amber-500' : 'bg-gray-300'}`} />
                                                <p className="text-[10px] text-gray-400 font-bold">
                                                    {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-sm font-bold text-gray-900">{event.event}</p>
                                                {event.notes && <p className="text-xs text-gray-500 mt-1">{event.notes}</p>}
                                                {event.photo_url && (
                                                    <div className="mt-2 rounded-lg overflow-hidden border">
                                                        <img src={event.photo_url} alt="현장 사진" className="w-full h-auto" />
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                        <Activity size={64} className="opacity-10" />
                        <p className="text-xl font-bold italic">좌측 목록에서 관제할 계약을 선택하세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
