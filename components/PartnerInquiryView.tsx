import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Building2, Phone, User, Send, CheckCircle, Upload, AlertCircle, FileText } from 'lucide-react';
import { useUser } from '../lib/auth';

interface Props {
    onBack: () => void;
}

export const PartnerInquiryView: React.FC<Props> = ({ onBack }) => {
    const { user, isSignedIn } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        companyName: '',
        managerName: '',
        phone: '',
        email: '',
        type: 'funeral_home', // funeral_home, memorial_park, sangjo, pet, other
        message: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Pre-fill email if logged in
    useEffect(() => {
        if (isSignedIn && user) {
            setFormData(prev => ({
                ...prev,
                email: user.primaryEmailAddress?.emailAddress || '',
                managerName: user.fullName || user.username || prev.managerName
            }));
        }
    }, [isSignedIn, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // TODO: Connect to backend
        // Simulate upload and submission
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Partner Inquiry Submitted:', {
            ...formData,
            userId: user?.id || 'anonymous',
            file: selectedFile ? selectedFile.name : 'no file'
        });

        setIsSuccess(true);
        setIsSubmitting(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    if (isSuccess) {
        return (
            <div className="h-full bg-white flex flex-col items-center justify-center p-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">신청이 완료되었습니다!</h2>
                <p className="text-gray-500 text-center mb-8 leading-relaxed">
                    제출해주신 서류를 검토한 후<br />
                    <strong>{user?.primaryEmailAddress?.emailAddress || formData.phone}</strong>으로<br />
                    승인 결과를 안내해 드리겠습니다.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 mb-8 max-w-xs w-full">
                    <p className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-primary mt-0.5" />
                        승인 즉시 업체 관리자 권한이 부여됩니다.
                    </p>
                </div>
                <button
                    onClick={onBack}
                    className="w-full max-w-xs py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-primary/90 transition-colors"
                >
                    확인
                </button>
            </div>
        );
    }

    return (
        <div className="h-full bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 safe-top">
                <div className="flex items-center h-14 px-4 gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={24} className="text-gray-800" />
                    </button>
                    <h1 className="font-bold text-lg">업체 입점/파트너 신청</h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Helper Banner for Logged In User */}
                {isSignedIn && user ? (
                    <div className="bg-blue-50 p-4 px-6 flex items-start gap-3 border-b border-blue-100">
                        <AlertCircle className="text-blue-600 mt-0.5 shrink-0" size={18} />
                        <div>
                            <p className="text-sm font-bold text-blue-800">회원 계정 연동됨</p>
                            <p className="text-xs text-blue-600 mt-1">
                                현재 로그인된 <strong>{user.primaryEmailAddress?.emailAddress}</strong> 계정으로<br />
                                관리자 권한 승인을 요청합니다.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-amber-50 p-4 px-6 flex items-start gap-3 border-b border-amber-100">
                        <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={18} />
                        <div>
                            <p className="text-sm font-bold text-amber-800">비회원 상태입니다</p>
                            <p className="text-xs text-amber-700 mt-1">
                                신청은 가능하지만, 관리자 권한 부여를 위해<br />
                                가급적 <strong>로그인 후 신청</strong>해주시는 것을 권장합니다.
                            </p>
                        </div>
                    </div>
                )}

                {/* Form Section */}
                <div className="p-4 pb-12">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-6">

                        {/* 1. Business Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                업종 구분 <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {['funeral_home', 'memorial_park', 'sangjo', 'pet'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, type }))}
                                        className={`py-3 px-3 rounded-xl text-sm font-medium border transition-colors ${formData.type === type
                                            ? 'bg-primary border-primary text-white shadow-md transform scale-[1.02]'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {type === 'funeral_home' ? '장례식장' :
                                            type === 'memorial_park' ? '봉안/묘지' :
                                                type === 'sangjo' ? '상조회사' : '동물장묘'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. File Upload (Business License) */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                사업자등록증 첨부 <span className="text-red-500">*</span>
                            </label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${selectedFile ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    required
                                />

                                {selectedFile ? (
                                    <>
                                        <FileText size={32} className="text-primary mb-2" />
                                        <p className="text-sm font-bold text-primary truncate max-w-full px-4">{selectedFile.name}</p>
                                        <p className="text-xs text-primary/70 mt-1">클릭하여 변경</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                            <Upload size={20} className="text-gray-400" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-600">사업자등록증 사진 업로드</p>
                                        <p className="text-xs text-gray-400 mt-1">탭하여 파일 선택</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* 3. Basic Info */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">업체명 <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        name="companyName"
                                        required
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="사업자등록증상의 상호명"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">담당자명 <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        name="managerName"
                                        required
                                        value={formData.managerName}
                                        onChange={handleChange}
                                        placeholder="담당자 성함"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">연락처 <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="담당자 연락처"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-dark text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    신청서 제출 중...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    파트너 신청하기
                                </>
                            )}
                        </button>
                        <p className="text-xs text-center text-gray-400">
                            승인 시 입력하신 정보를 바탕으로 업체(시설) 정보가 생성됩니다.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};
