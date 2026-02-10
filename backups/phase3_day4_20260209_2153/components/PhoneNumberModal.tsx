import React, { useState } from 'react';
import { X, Phone } from 'lucide-react';

interface PhoneNumberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (phoneNumber: string) => void;
}

export const PhoneNumberModal: React.FC<PhoneNumberModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        // 간단한 전화번호 유효성 검사
        const cleaned = phoneNumber.replace(/\D/g, '');

        if (cleaned.length < 10 || cleaned.length > 11) {
            setError('올바른 전화번호를 입력해주세요 (10-11자리)');
            return;
        }

        onSubmit(phoneNumber);
        onClose();
    };

    const handleSkip = () => {
        onSubmit(''); // 빈 값으로 저장 (나중에 입력 가능)
        onClose();
    };

    const formatPhoneNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '');

        if (cleaned.length <= 3) {
            return cleaned;
        } else if (cleaned.length <= 7) {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
        } else if (cleaned.length <= 11) {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
        }
        return value;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhoneNumber(formatted);
        setError('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={20} className="text-gray-500" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Phone size={32} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        전화번호를 입력해주세요
                    </h2>
                    <p className="text-sm text-gray-600">
                        예약 확인 및 연락을 위해 필요합니다
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            전화번호
                        </label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={handleChange}
                            placeholder="010-1234-5678"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            maxLength={13}
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600">{error}</p>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        확인
                    </button>

                    <button
                        onClick={handleSkip}
                        className="w-full text-gray-500 py-2 text-sm hover:text-gray-700 transition-colors"
                    >
                        나중에 입력하기
                    </button>
                </div>
            </div>
        </div>
    );
};
