import React, { useState, useEffect, useRef } from 'react';
import {
    Building2, Phone, Clock, MapPin, FileText,
    Image as ImageIcon, Package, Tag, Save, Plus,
    Trash2, GripVertical, Upload, X, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { getAuthClient } from '../../lib/supabaseClient';
import { useSession } from '../../lib/auth';

interface FacilityInfoEditorProps {
    facilityId: string;
}

interface FacilityData {
    id: string;
    name: string;
    address: string;
    phone: string;
    description: string;
    operating_hours: string;
    images: string[];
    features: string[];
}

interface PackageItem {
    id?: string;
    name: string;
    category: string;
    price: number | null;
    price_label: string;
    description: string;
    included_items: string[];
    sort_order: number;
    is_active: boolean;
    _isNew?: boolean;
    _isDeleted?: boolean;
}

export const FacilityInfoEditor: React.FC<FacilityInfoEditorProps> = ({ facilityId }) => {
    const [facility, setFacility] = useState<FacilityData | null>(null);
    const [packages, setPackages] = useState<PackageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newFeature, setNewFeature] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { session } = useSession();

    useEffect(() => {
        loadData();
    }, [facilityId]);

    const loadData = async () => {
        setLoading(true);
        const client = await getAuthClient(session);

        const [facilityResult, packagesResult] = await Promise.all([
            client.from('facilities')
                .select('id, name, address, phone, description, operating_hours, images, features')
                .eq('id', facilityId)
                .single(),
            client.from('facility_packages')
                .select('*')
                .eq('facility_id', facilityId)
                .order('sort_order')
        ]);

        if (facilityResult.data) {
            const d = facilityResult.data;
            setFacility({
                id: d.id,
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

        setLoading(false);
    };

    // === 기본 정보 저장 ===
    const handleSaveFacility = async () => {
        if (!facility) return;
        setSaving(true);
        const client = await getAuthClient(session);

        const { error } = await client.from('facilities').update({
            name: facility.name,
            address: facility.address,
            phone: facility.phone,
            description: facility.description,
            operating_hours: facility.operating_hours,
            features: facility.features,
        }).eq('id', facilityId);

        if (error) {
            toast.error('저장 실패: ' + error.message);
        } else {
            toast.success('기본 정보가 저장되었습니다.');
        }
        setSaving(false);
    };

    // === 이미지 업로드 ===
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !facility) return;
        setUploading(true);
        const client = await getAuthClient(session);
        const newImages = [...facility.images];

        for (const file of Array.from(files)) {
            const ext = file.name.split('.').pop();
            const path = `${facilityId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

            const { error: uploadError } = await client.storage
                .from('facility-images')
                .upload(path, file, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                toast.error(`업로드 실패: ${file.name}`);
                continue;
            }

            const { data: urlData } = client.storage.from('facility-images').getPublicUrl(path);
            if (urlData?.publicUrl) {
                newImages.push(urlData.publicUrl);
            }
        }

        // DB에 이미지 목록 업데이트
        const { error } = await client.from('facilities')
            .update({ images: newImages })
            .eq('id', facilityId);

        if (!error) {
            setFacility({ ...facility, images: newImages });
            toast.success('이미지가 업로드되었습니다.');
        }
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveImage = async (index: number) => {
        if (!facility) return;
        const newImages = facility.images.filter((_, i) => i !== index);
        const client = await getAuthClient(session);
        const { error } = await client.from('facilities')
            .update({ images: newImages })
            .eq('id', facilityId);
        if (!error) {
            setFacility({ ...facility, images: newImages });
            toast.success('이미지가 삭제되었습니다.');
        }
    };

    // === Features (태그) ===
    const addFeature = () => {
        if (!newFeature.trim() || !facility) return;
        setFacility({ ...facility, features: [...facility.features, newFeature.trim()] });
        setNewFeature('');
    };

    const removeFeature = (index: number) => {
        if (!facility) return;
        setFacility({ ...facility, features: facility.features.filter((_, i) => i !== index) });
    };

    // === 패키지 CRUD ===
    const addPackage = () => {
        setPackages([...packages, {
            name: '',
            category: '',
            price: null,
            price_label: '',
            description: '',
            included_items: [],
            sort_order: packages.length,
            is_active: true,
            _isNew: true,
        }]);
    };

    const updatePackage = (index: number, field: keyof PackageItem, value: string | number | boolean | string[] | null) => {
        setPackages(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
    };

    const removePackage = (index: number) => {
        const pkg = packages[index];
        if (pkg._isNew) {
            setPackages(prev => prev.filter((_, i) => i !== index));
        } else {
            setPackages(prev => prev.map((p, i) => i === index ? { ...p, _isDeleted: true } : p));
        }
    };

    const handleSavePackages = async () => {
        setSaving(true);
        const client = await getAuthClient(session);

        // 삭제
        const toDelete = packages.filter(p => p._isDeleted && p.id);
        for (const p of toDelete) {
            await client.from('facility_packages').delete().eq('id', p.id!);
        }

        // 신규
        const toInsert = packages.filter(p => p._isNew && !p._isDeleted && p.name.trim());
        if (toInsert.length > 0) {
            const { error } = await client.from('facility_packages').insert(
                toInsert.map(p => ({
                    facility_id: facilityId,
                    name: p.name,
                    category: p.category || null,
                    price: p.price,
                    price_label: p.price_label || null,
                    description: p.description || null,
                    included_items: p.included_items.length > 0 ? p.included_items : null,
                    sort_order: p.sort_order,
                    is_active: p.is_active,
                }))
            );
            if (error) {
                toast.error('패키지 추가 실패: ' + error.message);
                setSaving(false);
                return;
            }
        }

        // 수정 (기존 항목)
        const toUpdate = packages.filter(p => !p._isNew && !p._isDeleted && p.id);
        for (const p of toUpdate) {
            await client.from('facility_packages').update({
                name: p.name,
                category: p.category || null,
                price: p.price,
                price_label: p.price_label || null,
                description: p.description || null,
                included_items: p.included_items.length > 0 ? p.included_items : null,
                sort_order: p.sort_order,
                is_active: p.is_active,
            }).eq('id', p.id!);
        }

        toast.success('패키지가 저장되었습니다.');
        await loadData(); // 리로드
        setSaving(false);
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
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <ImageIcon size={18} className="text-purple-600" />
                        이미지 관리
                        <span className="text-xs font-normal text-slate-400">({facility.images.length}장)</span>
                    </h3>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all disabled:opacity-50"
                    >
                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {uploading ? '업로드 중...' : '이미지 추가'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                </div>
                <div className="p-6">
                    {facility.images.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {facility.images.map((img, idx) => (
                                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
                                    <img src={img} alt={`시설 이미지 ${idx + 1}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => handleRemoveImage(idx)}
                                            className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    {idx === 0 && (
                                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                            대표
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <ImageIcon size={36} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">등록된 이미지가 없습니다.</p>
                            <p className="text-xs mt-1">이미지를 추가하면 검색 시 노출됩니다.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 섹션 3: 서비스 특징 (태그) */}
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
                                <button onClick={() => removeFeature(idx)} className="hover:text-red-500 transition-colors">
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

            {/* 섹션 4: 가격/패키지 관리 */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <Package size={18} className="text-amber-600" />
                        가격/패키지 관리
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={addPackage}
                            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all border border-amber-200"
                        >
                            <Plus size={14} />
                            패키지 추가
                        </button>
                        <button
                            onClick={handleSavePackages}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-all disabled:opacity-50"
                        >
                            <Save size={14} />
                            {saving ? '저장 중...' : '전체 저장'}
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    {packages.filter(p => !p._isDeleted).length === 0 ? (
                        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Package size={36} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">등록된 패키지가 없습니다.</p>
                            <p className="text-xs mt-1">'패키지 추가' 버튼으로 가격 정보를 등록하세요.</p>
                        </div>
                    ) : (
                        packages.map((pkg, idx) => {
                            if (pkg._isDeleted) return null;
                            return (
                                <div key={pkg.id || `new-${idx}`} className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <GripVertical size={16} className="text-slate-300" />
                                            <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                                            {pkg._isNew && (
                                                <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">NEW</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => removePackage(idx)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 mb-0.5 block">패키지명 *</label>
                                            <input
                                                type="text"
                                                value={pkg.name}
                                                onChange={e => updatePackage(idx, 'name', e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                                placeholder="예: VIP실, 무궁화 3호"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 mb-0.5 block">분류</label>
                                            <input
                                                type="text"
                                                value={pkg.category}
                                                onChange={e => updatePackage(idx, 'category', e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                                placeholder="예: 빈소, 봉안묘"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 mb-0.5 block">표시 가격</label>
                                            <input
                                                type="text"
                                                value={pkg.price_label}
                                                onChange={e => updatePackage(idx, 'price_label', e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                                placeholder="예: 390만원, 문의"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 mb-0.5 block">실제 가격 (원)</label>
                                            <input
                                                type="number"
                                                value={pkg.price ?? ''}
                                                onChange={e => updatePackage(idx, 'price', e.target.value ? parseInt(e.target.value) : null)}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                                placeholder="3900000"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 mb-0.5 block">순서</label>
                                            <input
                                                type="number"
                                                value={pkg.sort_order}
                                                onChange={e => updatePackage(idx, 'sort_order', parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 mb-0.5 block">설명</label>
                                        <textarea
                                            value={pkg.description}
                                            onChange={e => updatePackage(idx, 'description', e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                                            placeholder="패키지 설명..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 mb-0.5 block">포함 서비스 (쉼표로 구분)</label>
                                        <input
                                            type="text"
                                            value={pkg.included_items.join(', ')}
                                            onChange={e => updatePackage(idx, 'included_items', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                            placeholder="예: 수의, 관, 안치실, 장지 안내"
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
