import React, { useState, useEffect } from 'react';
import { X, User, Phone, Save, Loader2 } from 'lucide-react';
import { updateUserProfile } from '../lib/queries';

interface Props {
    user: {
        id: string; // Clerk ID
        name: string;
        email: string;
        phone?: string;
        imageUrl?: string;
    };
    onClose: () => void;
    onUpdate: () => void; // Trigger a refresh of user data
}

export const EditProfileModal: React.FC<Props> = ({ user, onClose, onUpdate }) => {
    const [name, setName] = useState(user.name || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Always sync state with props when modal is open
        setName(user.name || '');
        setPhone(user.phone || '');
    }, [user]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 3 && value.length <= 7) {
            value = value.replace(/(\d{3})(\d{1,4})/, '$1-$2');
        } else if (value.length > 7) {
            value = value.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
        }

        setPhone(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await updateUserProfile(user.id, {
                name,
                phone_number: phone
            });
            onUpdate(); // Refresh parent data
            onClose(); // Close modal
            alert('프로필이 성공적으로 수정되었습니다.');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('프로필 수정 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-900">프로필 수정</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Read-only Email */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">이메일 (변경 불가)</label>
                        <input
                            type="text"
                            value={user.email}
                            disabled
                            className="w-full px-4 py-3 bg-gray-100 text-gray-500 rounded-xl border-none focus:ring-0"
                        />
                    </div>

                    {/* Name Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">이름</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900"
                                placeholder="이름을 입력하세요"
                                required
                            />
                        </div>
                    </div>

                    {/* Phone Input */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">전화번호</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="tel"
                                value={phone}
                                onChange={handlePhoneChange}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900"
                                placeholder="010-0000-0000"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={24} className="animate-spin" />
                                저장 중...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                저장하기
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
