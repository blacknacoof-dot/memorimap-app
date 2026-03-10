import React from 'react';
import { Package, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthClient } from '../../../lib/supabaseClient';
import { useSession } from '../../../lib/auth';
import { confirmAsync } from '../../../src/components/common/ConfirmModal';

export interface PackageItem {
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

interface PackageManagerProps {
    facilityId: string;
    packages: PackageItem[];
    setPackages: React.Dispatch<React.SetStateAction<PackageItem[]>>;
    onSaved: () => void;
}

export const PackageManager: React.FC<PackageManagerProps> = ({ facilityId, packages, setPackages, onSaved }) => {
    const [saving, setSaving] = React.useState(false);
    const { session } = useSession();

    const addPackage = () => {
        setPackages(prev => [...prev, {
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
        const toDelete = packages.filter(p => p._isDeleted && p.id);
        if (toDelete.length > 0) {
            if (!await confirmAsync(`삭제 표시된 패키지 ${toDelete.length}건이 영구 삭제됩니다. 계속하시겠습니까?`, '패키지 저장')) return;
        }
        setSaving(true);
        try {
            const client = await getAuthClient(session, { strict: true });

            for (const p of toDelete) {
                const { error: delErr } = await client.from('facility_packages').delete().eq('id', p.id!);
                if (delErr) throw delErr;
            }

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
                if (error) throw error;
            }

            const toUpdate = packages.filter(p => !p._isNew && !p._isDeleted && p.id);
            for (const p of toUpdate) {
                const { error: updErr } = await client.from('facility_packages').update({
                    name: p.name,
                    category: p.category || null,
                    price: p.price,
                    price_label: p.price_label || null,
                    description: p.description || null,
                    included_items: p.included_items.length > 0 ? p.included_items : null,
                    sort_order: p.sort_order,
                    is_active: p.is_active,
                }).eq('id', p.id!);
                if (updErr) throw updErr;
            }

            toast.success('패키지가 저장되었습니다.');
            onSaved();
        } catch (err) {
            // 패키지 저장 오류 (toast로 알림)
            toast.error('패키지 저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    return (
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
                                        onClick={async () => { if (await confirmAsync('이 패키지를 삭제하시겠습니까?')) removePackage(idx); }}
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
    );
};
