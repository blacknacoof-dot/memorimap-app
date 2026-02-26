import React from 'react';
import {
    Users, CheckCircle2, AlertCircle,
    Building2, Mail, Phone, Calendar, X
} from 'lucide-react';
import { Partner } from '../../types';

interface Props {
    partner: Partner;
    onClose: () => void;
    onStatusChange: (id: string, status: Partner['status']) => Promise<void>;
}

export const PartnerDetailModal: React.FC<Props> = ({ partner, onClose, onStatusChange }) => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80dvh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-2xl">
                    <h3 className="font-bold text-lg text-slate-800">파트너 상세 정보</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-5 space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border">
                            {partner.company_logo_url ? (
                                <img src={partner.company_logo_url} alt={partner.company_name} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="text-slate-400" size={28} />
                            )}
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-slate-800">{partner.company_name}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${partner.status === 'approved' ? 'bg-green-100 text-green-600' :
                                    partner.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                                        partner.status === 'suspended' ? 'bg-orange-100 text-orange-600' :
                                            'bg-red-100 text-red-600'
                                }`}>
                                {partner.status === 'approved' ? '승인됨' :
                                    partner.status === 'pending' ? '대기중' :
                                        partner.status === 'suspended' ? '정지' : '반려'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 bg-slate-50 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold">이메일</p>
                                <p className="text-sm text-slate-700">{partner.contact_email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold">연락처</p>
                                <p className="text-sm text-slate-700">{partner.contact_phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-slate-400" />
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold">담당자</p>
                                <p className="text-sm text-slate-700">{partner.contact_person || '미정'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold">가입일</p>
                                <p className="text-sm text-slate-700">{new Date(partner.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-blue-500" />
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold">구독 플랜</p>
                                <p className="text-sm text-blue-600 font-bold capitalize">{partner.subscription_plan}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        {partner.status === 'pending' && (
                            <div className="flex-1 text-center py-2.5 text-sm text-amber-600 bg-amber-50 rounded-xl border border-amber-100 font-medium">
                                "신규 입점 신청"에서 승인/거절 처리
                            </div>
                        )}
                        {partner.status === 'approved' && (
                            <button
                                onClick={async () => { await onStatusChange(partner.id, 'suspended'); onClose(); }}
                                className="flex-1 bg-white text-slate-600 border border-slate-200 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                            >
                                서비스 일시정지
                            </button>
                        )}
                        {partner.status === 'suspended' && (
                            <button
                                onClick={async () => { await onStatusChange(partner.id, 'approved'); onClose(); }}
                                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5"
                            >
                                <CheckCircle2 size={16} /> 서비스 재개
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
