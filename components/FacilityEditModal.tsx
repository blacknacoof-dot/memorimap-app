import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Building2, MapPin, Phone, FileText, ImagePlus, Trash2, Plus, Mail, Globe, Clock, Package, Tag, Users } from 'lucide-react';
import { updateFacility, uploadFacilityImage } from '../lib/queries';
import { getAuthClient } from '../lib/supabaseClient';
import { useSession } from '../lib/auth';
import { Facility, FacilityPackage, FacilityManager } from '../types';
import { toast } from 'sonner';
import { confirmAsync } from '../src/components/common/ConfirmModal';

interface Props {
    facility: Facility;
    onClose: () => void;
    onSave: () => void;
}

type TabKey = 'basic' | 'packages' | 'features' | 'managers';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'basic', label: '기본 정보', icon: <Building2 size={16} /> },
    { key: 'packages', label: '가격/패키지', icon: <Package size={16} /> },
    { key: 'features', label: '시설 특성', icon: <Tag size={16} /> },
    { key: 'managers', label: '담당자', icon: <Users size={16} /> },
];

const FEATURE_CATEGORIES: Record<string, string[]> = {
    '편의시설': ['주차가능', '엘리베이터', '장애인시설', '식당', '매점', '휴게실', 'Wi-Fi'],
    '서비스': ['24시간', '운구차', '종교의식', '꽃배달', '도우미', '유품정리', '사진촬영'],
    '빈소': ['대형(50인+)', '중형(30인)', '소형(10인)', 'VIP실', '가족실'],
    '종교시설': ['무종교', '기독교', '불교', '천주교', '원불교'],
};

const EMPTY_PACKAGE: FacilityPackage = { name: '', price: 0, items: [], description: '' };
const EMPTY_MANAGER: FacilityManager = { name: '', position: '', phone: '' };

export const FacilityEditModal: React.FC<Props> = ({ facility, onClose, onSave }) => {
    const { session } = useSession();
    const [activeTab, setActiveTab] = useState<TabKey>('basic');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // --- Basic Info ---
    const [name, setName] = useState(facility.name);
    const [address, setAddress] = useState(facility.address);
    const [phone, setPhone] = useState(facility.phone || '');
    const [email, setEmail] = useState(facility.email || '');
    const [website, setWebsite] = useState(facility.website || '');
    const [operatingHours, setOperatingHours] = useState(facility.operating_hours || '');
    const [description, setDescription] = useState(facility.description || '');
    const [imageUrl, setImageUrl] = useState(facility.imageUrl || '');
    const [galleryImages, setGalleryImages] = useState<string[]>(facility.galleryImages || []);

    // --- Packages ---
    const [packages, setPackages] = useState<FacilityPackage[]>(facility.packages || []);

    // --- Features ---
    const [features, setFeatures] = useState<string[]>(facility.features || []);
    const [customTagInput, setCustomTagInput] = useState('');

    // --- Managers ---
    const [managers, setManagers] = useState<FacilityManager[]>(facility.managers || []);

    useEffect(() => {
        setName(facility.name);
        setAddress(facility.address);
        setPhone(facility.phone || '');
        setEmail(facility.email || '');
        setWebsite(facility.website || '');
        setOperatingHours(facility.operating_hours || '');
        setDescription(facility.description || '');
        setImageUrl(facility.imageUrl || '');
        setGalleryImages(facility.galleryImages || []);
        setPackages(facility.packages || []);
        setFeatures(facility.features || []);
        setManagers(facility.managers || []);
    }, [facility]);

    // --- Handlers ---
    const handlePhoneChange = (value: string, setter: (v: string) => void) => {
        let v = value.replace(/[^0-9]/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 3 && v.length <= 7) {
            v = v.replace(/(\d{2,3})(\d{1,4})/, '$1-$2');
        } else if (v.length > 7) {
            v = v.replace(/(\d{2,3})(\d{3,4})(\d{4})/, '$1-$2-$3');
        }
        setter(v);
    };

    const getUploadClient = async () => {
        return await getAuthClient(session, { strict: true });
    };

    const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const client = await getUploadClient();
            const url = await uploadFacilityImage(facility.id, file, client);
            setImageUrl(url);
        } catch {
            toast.error('이미지 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const client = await getUploadClient();
            const url = await uploadFacilityImage(facility.id, file, client);
            setGalleryImages(prev => [...prev, url]);
        } catch {
            toast.error('이미지 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleReplaceGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const client = await getUploadClient();
            const url = await uploadFacilityImage(facility.id, file, client);
            setGalleryImages(prev => prev.map((old, i) => i === idx ? url : old));
        } catch {
            toast.error('이미지 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    // --- Package helpers ---
    const addPackage = () => {
        if (packages.length >= 5) return;
        setPackages(prev => [...prev, { ...EMPTY_PACKAGE }]);
    };
    const updatePackage = (idx: number, field: keyof FacilityPackage, value: string | number | string[]) => {
        setPackages(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
    };
    const removePackage = (idx: number) => {
        setPackages(prev => prev.filter((_, i) => i !== idx));
    };
    const addPackageItem = (pkgIdx: number, item: string) => {
        if (!item.trim()) return;
        setPackages(prev => prev.map((p, i) =>
            i === pkgIdx ? { ...p, items: [...p.items, item.trim()] } : p
        ));
    };
    const removePackageItem = (pkgIdx: number, itemIdx: number) => {
        setPackages(prev => prev.map((p, i) =>
            i === pkgIdx ? { ...p, items: p.items.filter((_, j) => j !== itemIdx) } : p
        ));
    };

    // --- Feature helpers ---
    const toggleFeature = (category: string, tag: string) => {
        const key = `${category}:${tag}`;
        setFeatures(prev =>
            prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
        );
    };
    const isFeatureSelected = (category: string, tag: string) => {
        return features.includes(`${category}:${tag}`);
    };
    const addCustomTag = () => {
        if (!customTagInput.trim()) return;
        const key = `커스텀:${customTagInput.trim()}`;
        if (!features.includes(key)) {
            setFeatures(prev => [...prev, key]);
        }
        setCustomTagInput('');
    };

    // --- Manager helpers ---
    const addManager = () => {
        if (managers.length >= 3) return;
        setManagers(prev => [...prev, { ...EMPTY_MANAGER }]);
    };
    const updateManager = (idx: number, field: keyof FacilityManager, value: string) => {
        setManagers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
    };
    const removeManager = (idx: number) => {
        setManagers(prev => prev.filter((_, i) => i !== idx));
    };

    // --- Price range auto-calc from packages ---
    const calcPriceRange = (): string => {
        const prices = packages.filter(p => p.price > 0).map(p => p.price);
        if (prices.length === 0) return '';
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const fmt = (n: number) => n.toLocaleString('ko-KR');
        return min === max ? `${fmt(min)}원` : `${fmt(min)}원 ~ ${fmt(max)}원`;
    };

    // --- Submit ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const priceRange = calcPriceRange();
            const authClient = await getAuthClient(session, { strict: true });
            await updateFacility(facility.id, {
                name,
                address,
                phone,
                email: email || null,
                website: website || null,
                operating_hours: operatingHours || null,
                description,
                price_range: priceRange || null,
                image_url: imageUrl,
                images: galleryImages,
                packages: packages.length > 0 ? packages : [],
                features: features.length > 0 ? features : [],
                managers: managers.length > 0 ? managers : [],
            }, authClient);
            onSave();
            onClose();
            toast.success('시설 정보가 성공적으로 수정되었습니다.');
        } catch (_error) {
            toast.error('시설 정보 수정 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputCls = "w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900";
    const inputNoPadCls = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900";

    return (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90dvh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">시설 정보 수정</h2>
                    <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-full">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b shrink-0 bg-gray-50">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all ${
                                activeTab === tab.key
                                    ? 'text-primary border-b-2 border-primary bg-white'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-4">

                        {/* ===== TAB 1: BASIC INFO ===== */}
                        {activeTab === 'basic' && (
                            <>
                                {/* Name */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">시설 이름 *</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="시설 이름" required />
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">주소 *</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={inputCls} placeholder="주소" required />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">전화번호</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="tel" value={phone} onChange={e => handlePhoneChange(e.target.value, setPhone)} className={inputCls} placeholder="02-0000-0000" />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">이메일</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="email@example.com" />
                                    </div>
                                </div>

                                {/* Website */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">웹사이트</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className={inputCls} placeholder="https://..." />
                                    </div>
                                </div>

                                {/* Operating Hours */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">영업시간</label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="text" value={operatingHours} onChange={e => setOperatingHours(e.target.value)} className={inputCls} placeholder="09:00 ~ 18:00 (연중무휴)" />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">시설 설명</label>
                                    <div className="relative">
                                        <FileText className="absolute left-4 top-4 text-gray-400" size={18} />
                                        <textarea value={description} onChange={e => setDescription(e.target.value)} className={`${inputCls} min-h-[100px] resize-none`} placeholder="시설에 대한 설명" />
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Images */}
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        이미지 관리
                                        {isUploading && <Loader2 size={16} className="animate-spin text-primary" />}
                                    </label>

                                    {/* Main Image */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700">대표 이미지</label>
                                        <div className="flex gap-4 items-center">
                                            {imageUrl ? (
                                                <div className="relative w-32 h-24 rounded-lg overflow-hidden border group">
                                                    <img src={imageUrl} alt="Main" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <label className="p-1.5 bg-white text-gray-700 rounded-full cursor-pointer hover:bg-gray-100" title="교체">
                                                            <ImagePlus size={14} />
                                                            <input type="file" className="hidden" accept="image/*" onChange={handleMainImageChange} />
                                                        </label>
                                                        <button type="button" onClick={async () => { if (await confirmAsync('대표 이미지를 삭제하시겠습니까?')) setImageUrl(''); }} className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600" title="삭제">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="w-32 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                                    <ImagePlus size={24} className="text-gray-400 mb-1" />
                                                    <span className="text-[10px] text-gray-500">이미지 추가</span>
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleMainImageChange} />
                                                </label>
                                            )}
                                            <p className="text-[10px] text-gray-500">목록에서 가장 먼저 보여지는 대표 사진입니다.</p>
                                        </div>
                                    </div>

                                    {/* Gallery */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700">갤러리 사진 {galleryImages.length}/3</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {galleryImages.map((url, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border group">
                                                    <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <label className="p-1.5 bg-white text-gray-700 rounded-full cursor-pointer hover:bg-gray-100" title="교체">
                                                            <ImagePlus size={12} />
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleReplaceGalleryImage(e, idx)} />
                                                        </label>
                                                        <button type="button" onClick={async () => { if (await confirmAsync('이 갤러리 이미지를 삭제하시겠습니까?')) setGalleryImages(prev => prev.filter((_, i) => i !== idx)); }} className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600" title="삭제">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {galleryImages.length < 3 && (
                                                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                                    <Plus size={24} className="text-gray-400" />
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleAddGalleryImage} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ===== TAB 2: PACKAGES ===== */}
                        {activeTab === 'packages' && (
                            <>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">패키지형 가격 구성 (최대 5개)</p>
                                    {packages.length < 5 && (
                                        <button type="button" onClick={addPackage} className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 px-3 py-1.5 border border-primary/30 rounded-lg hover:bg-primary/5">
                                            <Plus size={14} /> 패키지 추가
                                        </button>
                                    )}
                                </div>

                                {packages.length === 0 && (
                                    <div className="text-center py-10 text-gray-400 text-sm">
                                        등록된 패키지가 없습니다.<br />위 버튼으로 패키지를 추가하세요.
                                    </div>
                                )}

                                {packages.map((pkg, pkgIdx) => (
                                    <div key={pkgIdx} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-500">패키지 {pkgIdx + 1}</span>
                                            <button type="button" onClick={async () => { if (await confirmAsync('이 패키지를 삭제하시겠습니까?')) removePackage(pkgIdx); }} className="text-red-400 hover:text-red-600 text-xs font-bold flex items-center gap-1">
                                                <Trash2 size={12} /> 삭제
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-600">패키지명</label>
                                                <input value={pkg.name} onChange={e => updatePackage(pkgIdx, 'name', e.target.value)} className={inputNoPadCls} placeholder="기본형" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-600">가격 (원)</label>
                                                <input type="number" value={pkg.price || ''} onChange={e => updatePackage(pkgIdx, 'price', Number(e.target.value))} className={inputNoPadCls} placeholder="1500000" />
                                            </div>
                                        </div>

                                        {/* Package Items */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-600">구성품</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {pkg.items.map((item, itemIdx) => (
                                                    <span key={itemIdx} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">
                                                        {item}
                                                        <button type="button" onClick={async () => { if (await confirmAsync('이 구성품을 삭제하시겠습니까?')) removePackageItem(pkgIdx, itemIdx); }} className="hover:text-red-500">
                                                            <X size={12} />
                                                        </button>
                                                    </span>
                                                ))}
                                                <PackageItemInput onAdd={(item) => addPackageItem(pkgIdx, item)} />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-600">설명</label>
                                            <textarea value={pkg.description} onChange={e => updatePackage(pkgIdx, 'description', e.target.value)} className={`${inputNoPadCls} min-h-[60px] resize-none text-sm`} placeholder="패키지에 대한 간단한 설명" />
                                        </div>
                                    </div>
                                ))}

                                {packages.length > 0 && (
                                    <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                                        자동 계산 가격 범위: <strong>{calcPriceRange() || '가격 입력 필요'}</strong>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ===== TAB 3: FEATURES ===== */}
                        {activeTab === 'features' && (
                            <>
                                {Object.entries(FEATURE_CATEGORIES).map(([category, tags]) => (
                                    <div key={category} className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700">{category}</label>
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map(tag => {
                                                const selected = isFeatureSelected(category, tag);
                                                return (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => toggleFeature(category, tag)}
                                                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                                            selected
                                                                ? 'bg-primary text-white border-primary shadow-sm'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:text-primary'
                                                        }`}
                                                    >
                                                        {selected ? '\u2713 ' : ''}{tag}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Custom Tags */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700">직접 입력</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={customTagInput}
                                            onChange={e => setCustomTagInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
                                            className={`${inputNoPadCls} flex-1 text-sm`}
                                            placeholder="커스텀 태그 입력 후 Enter"
                                        />
                                        <button type="button" onClick={addCustomTag} className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shrink-0">추가</button>
                                    </div>
                                </div>

                                {/* Custom tag display */}
                                {features.filter(f => f.startsWith('커스텀:')).length > 0 && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">커스텀 태그</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {features.filter(f => f.startsWith('커스텀:')).map(f => (
                                                <span key={f} className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-full">
                                                    {f.replace('커스텀:', '')}
                                                    <button type="button" onClick={async () => { if (await confirmAsync('이 태그를 삭제하시겠습니까?')) setFeatures(prev => prev.filter(x => x !== f)); }} className="hover:text-red-500">
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                                    선택된 태그: <strong>{features.length}개</strong>
                                </div>
                            </>
                        )}

                        {/* ===== TAB 4: MANAGERS ===== */}
                        {activeTab === 'managers' && (
                            <>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">담당자 관리 (최대 3명)</p>
                                    {managers.length < 3 && (
                                        <button type="button" onClick={addManager} className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 px-3 py-1.5 border border-primary/30 rounded-lg hover:bg-primary/5">
                                            <Plus size={14} /> 담당자 추가
                                        </button>
                                    )}
                                </div>

                                {managers.length === 0 && (
                                    <div className="text-center py-10 text-gray-400 text-sm">
                                        등록된 담당자가 없습니다.<br />위 버튼으로 담당자를 추가하세요.
                                    </div>
                                )}

                                {managers.map((mgr, idx) => (
                                    <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-500">담당자 {idx + 1}</span>
                                            <button type="button" onClick={() => removeManager(idx)} className="text-red-400 hover:text-red-600 text-xs font-bold flex items-center gap-1">
                                                <Trash2 size={12} /> 삭제
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-600">이름</label>
                                                <input value={mgr.name} onChange={e => updateManager(idx, 'name', e.target.value)} className={inputNoPadCls} placeholder="홍길동" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-600">직책</label>
                                                <input value={mgr.position} onChange={e => updateManager(idx, 'position', e.target.value)} className={inputNoPadCls} placeholder="팀장" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-600">연락처</label>
                                            <input value={mgr.phone} onChange={e => handlePhoneChange(e.target.value, v => updateManager(idx, 'phone', v))} className={inputNoPadCls} placeholder="010-1234-5678" />
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-3 p-4 border-t bg-white shrink-0">
                        <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 active:scale-[0.98] transition-all">
                            취소
                        </button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            {isSubmitting ? (
                                <><Loader2 size={20} className="animate-spin" /> 저장 중...</>
                            ) : (
                                <><Save size={20} /> 저장하기</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/** Small inline input for adding package items */
const PackageItemInput: React.FC<{ onAdd: (item: string) => void }> = ({ onAdd }) => {
    const [value, setValue] = useState('');
    const handleAdd = () => {
        if (!value.trim()) return;
        onAdd(value.trim());
        setValue('');
    };
    return (
        <span className="inline-flex items-center">
            <input
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
                className="w-24 text-xs px-2 py-1 border border-dashed border-gray-300 rounded-full focus:outline-none focus:border-primary"
                placeholder="+ 구성품"
            />
        </span>
    );
};
