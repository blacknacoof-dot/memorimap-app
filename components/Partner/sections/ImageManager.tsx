import React, { useRef } from 'react';
import { Image as ImageIcon, Upload, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthClient } from '../../../lib/supabaseClient';
import { useSession } from '../../../lib/auth';
import { validateFacilityImageFile } from '../../../lib/security/fileValidation';
import { uploadFacilityImage } from '../../../lib/queries';
import { confirmAsync } from '../../../src/components/common/ConfirmModal';
import OptimizedImage from '../../ui/OptimizedImage';

interface ImageManagerProps {
    facilityId: string;
    images: string[];
    onImagesChange: (images: string[]) => void;
}

export const ImageManager: React.FC<ImageManagerProps> = ({ facilityId, images, onImagesChange }) => {
    const [uploading, setUploading] = React.useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { session } = useSession();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setUploading(true);
        const client = await getAuthClient(session, { strict: true });
        const newImages = [...images];

        for (const file of Array.from(files)) {
            const validation = await validateFacilityImageFile(file);
            if (!validation.valid) {
                toast.error(validation.error || `업로드할 수 없는 파일입니다: ${file.name}`);
                continue;
            }

            try {
                const path = await uploadFacilityImage(facilityId, file, client);
                newImages.push(path);
            } catch {
                toast.error(`업로드 실패: ${file.name}`);
            }
        }

        const { error } = await client
            .from('facilities')
            .update({ images: newImages })
            .eq('id', facilityId);

        if (!error) {
            onImagesChange(newImages);
            toast.success('이미지가 업로드되었습니다.');
        }

        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveImage = async (index: number) => {
        if (!await confirmAsync('이미지를 삭제하시겠습니까?', '이미지 삭제')) return;
        const newImages = images.filter((_, i) => i !== index);
        const client = await getAuthClient(session, { strict: true });
        const { error } = await client
            .from('facilities')
            .update({ images: newImages })
            .eq('id', facilityId);

        if (!error) {
            onImagesChange(newImages);
            toast.success('이미지를 삭제했습니다.');
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                    <ImageIcon size={18} className="text-purple-600" />
                    이미지 관리
                    <span className="text-xs font-normal text-slate-400">({images.length}장)</span>
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
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                />
            </div>
            <div className="p-6">
                {images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
                                <OptimizedImage
                                    src={img}
                                    alt={`시설 이미지 ${idx + 1}`}
                                    className="w-full h-full"
                                    storageBucket="facility-images"
                                />
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
                        <p className="text-xs mt-1">이미지를 추가하면 검색 결과에 노출됩니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
