import React, { useState, useEffect } from 'react';
import {
    Building2, Phone, Clock, MapPin,
    Tag, Save, Plus, X, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { getAuthClient } from '../../lib/supabaseClient';
import { useSession } from '../../lib/auth';
import { getFacilitySubscription } from '../../lib/queries/index';
import { getFacilityPlanId, getFacilityPhotoLimitLabel, getFacilityPlanMeta } from '../../lib/facilityPlan';
import { confirmAsync } from '../../src/components/common/ConfirmModal';
import { ImageManager } from './sections/ImageManager';
import { PackageManager } from './sections/PackageManager';
import { AISettingsSection } from './sections/AISettingsSection';
import type { PackageItem } from './sections/PackageManager';

interface FacilityInfoEditorProps {
    facilityId: string;
    isSangjo?: boolean;
}

interface FacilityData {
    id: string;
    type?: string;
    name: string;
    address: string;
    phone: string;
    description: string;
    operating_hours: string;
    images: string[];
    features: string[];
}

export const FacilityInfoEditor: React.FC<FacilityInfoEditorProps> = ({ facilityId, isSangjo: isSangjoProp }) => {
    const [facility, setFacility] = useState<FacilityData | null>(null);
    const [packages, setPackages] = useState<PackageItem[]>([]);
    const [planId, setPlanId] = useState<string>('FREE');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newFeature, setNewFeature] = useState('');
    const { session } = useSession();

    const loadData = async () => {
        setLoading(true);
        const client = await getAuthClient(session, { strict: true });

        const [facilityResult, packagesResult, subscriptionResult] = await Promise.all([
            client.from('facilities')
                .select('id, type, name, address, phone, description, operating_hours, images, features')
                .eq('id', facilityId)
                .single(),
            client.from('facility_packages')
                .select('*')
                .eq('facility_id', facilityId)
                .order('sort_order'),
            getFacilitySubscription(facilityId, client),
        ]);

        if (facilityResult.data) {
            const d = facilityResult.data;
            setFacility({
                id: d.id,
                type: d.type || '',
                name: d.name || '',
                address: d.address || '',
                phone: d.phone || '',
                description: d.description || '',
                operating_hours: d.operating_hours || '',
                images: d.images || [],
                features: Array.isArray(d.features) ? d.features : [],
            });
        }

        if (packagesResult.data) {
            setPackages(packagesResult.data.map((p: Record<string, unknown>) => ({
                id: p.id as string | undefined,
                name: (p.name as string) || '',
                category: (p.category as string) || '',
                price: (p.price as number | null) ?? null,
                price_label: (p.price_label as string) || '',
                description: (p.description as string) || '',
                included_items: (p.included_items as string[]) || [],
                sort_order: (p.sort_order as number) || 0,
                is_active: (p.is_active as boolean) ?? true,
            })));
        }

        setPlanId(getFacilityPlanId(subscriptionResult?.plan_id ?? subscriptionResult?.plan?.name_en ?? subscriptionResult?.plan_name));

        setLoading(false);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadData();
    }, [facilityId]);

    const handleSaveFacility = async () => {
        if (!facility) return;
        setSaving(true);
        const client = await getAuthClient(session, { strict: true });
        const effectiveIsSangjo = isSangjoProp ?? facility.type === 'sangjo';

        const { error } = await client.from('facilities').update({
            name: facility.name,
            address: facility.address,
            phone: facility.phone,
            description: facility.description,
            operating_hours: facility.operating_hours,
            features: facility.features,
        }).eq('id', facilityId);

        if (!error && effectiveIsSangjo) {
            const { error: companyError } = await client.from('funeral_companies').update({
                name: facility.name,
                phone: facility.phone,
                description: facility.description,
                features: facility.features,
            }).eq('id', facilityId);

            if (companyError) {
                toast.error('????ㅽ뙣: ' + companyError.message);
                setSaving(false);
                return;
            }
        }

        if (error) {
            toast.error('저장 실패: ' + error.message);
        } else {
            toast.success('기본 정보가 저장되었습니다.');
        }
        setSaving(false);
    };

    const addFeature = () => {
        if (!newFeature.trim() || !facility) return;
        setFacility({ ...facility, features: [...facility.features, newFeature.trim()] });
        setNewFeature('');
    };

    const removeFeature = (index: number) => {
        if (!facility) return;
        setFacility({ ...facility, features: facility.features.filter((_, i) => i !== index) });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!facility) {
        return (
            <div className="text-center py-20 text-slate-400">
                <Building2 size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">연결된 시설을 찾을 수 없습니다.</p>
                <p className="text-xs mt-1">관리자에게 시설 연결을 요청해주세요.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* 섹션 1: 기본 정보 */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <Building2 size={18} className="text-blue-600" />
                        기본 정보
                    </h3>
                    <button
                        onClick={handleSaveFacility}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                        <Save size={14} />
                        {saving ? '저장 중...' : '저장'}
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">시설명</label>
                            <input
                                type="text"
                                value={facility.name}
                                onChange={e => setFacility({ ...facility, name: e.target.value })}
                                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">연락처</label>
                            <div className="relative">
                                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={facility.phone}
                                    onChange={e => setFacility({ ...facility, phone: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="02-0000-0000"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">주소</label>
                        <div className="relative">
                            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={facility.address}
                                onChange={e => setFacility({ ...facility, address: e.target.value })}
                                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">운영시간</label>
                        <div className="relative">
                            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={facility.operating_hours}
                                onChange={e => setFacility({ ...facility, operating_hours: e.target.value })}
                                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="09:00 - 18:00 (연중무휴)"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">시설 소개</label>
                        <textarea
                            value={facility.description}
                            onChange={e => setFacility({ ...facility, description: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                            placeholder="시설에 대한 소개를 입력하세요..."
                        />
                    </div>
                </div>
            </div>

            {/* 섹션 2: 이미지 관리 */}
            <ImageManager
                facilityId={facilityId}
                images={facility.images}
                planId={planId}
                isSangjo={isSangjoProp ?? facility.type === 'sangjo'}
                onImagesChange={images => setFacility({ ...facility, images })}
            />
            <p className="-mt-5 px-1 text-[11px] text-slate-500">
                현재 플랜: <span className="font-semibold text-slate-700">{getFacilityPlanMeta(planId).displayName}</span>
                {' · '}사진 업로드 한도 {getFacilityPhotoLimitLabel(planId)}
            </p>

            {/* 섹션 3: 서비스 특징 */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <Tag size={18} className="text-emerald-600" />
                        서비스 특징
                    </h3>
                </div>
                <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {facility.features.map((f, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100">
                                {f}
                                <button onClick={async () => { if (await confirmAsync('이 특징을 삭제하시겠습니까?')) removeFeature(idx); }} className="hover:text-red-500 transition-colors">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newFeature}
                            onChange={e => setNewFeature(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                            placeholder="특징 입력 후 엔터 (예: 주차 가능, 24시간 운영)"
                        />
                        <button
                            onClick={addFeature}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="mt-3 flex justify-end">
                        <button
                            onClick={handleSaveFacility}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all disabled:opacity-50"
                        >
                            <Save size={14} />
                            특징 저장
                        </button>
                    </div>
                </div>
            </div>

            {/* 섹션 4: 패키지 관리 */}
            <PackageManager
                facilityId={facilityId}
                packages={packages}
                setPackages={setPackages}
                onSaved={loadData}
            />

            {/* 섹션 5: AI 챗봇 설정 */}
            <AISettingsSection facilityId={facilityId} isSangjo={isSangjoProp ?? facility.type === 'sangjo'} />
        </div>
    );
};
