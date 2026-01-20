import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Building2, Phone, User, Send, CheckCircle, Upload, AlertCircle, FileText, MapPin, Search } from 'lucide-react';
import { useUser } from '../lib/auth';

import { submitPartnerApplication, searchKnownFacilities, PARTNER_CATEGORIES, getFacilitiesByCategory } from '../lib/queries';
import { FUNERAL_COMPANIES } from '../constants';

interface Props {
    onBack: () => void;
    onLoginClick?: () => void;
}

export const PartnerInquiryView: React.FC<Props> = ({ onBack, onLoginClick }) => {
    const { user, isSignedIn } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        companyName: '',
        managerName: '',
        phone: '',
        managerMobile: '',
        companyPhone: '',        // 추가: 업체 대표 전화
        managerPosition: '',     // 추가: 담당자 부서/직급
        address: '',
        email: '',
        companyEmail: '',
        type: 'funeral_home',
        message: '',
        privacyConsent: false,   // 추가: 개인정보 동의
        targetFacilityId: null as number | null // [Fixed] Match DB type
    });
    const [isReadOnly, setIsReadOnly] = useState(false); // [New] Lock fields

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Search related state
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

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

    // Search effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (formData.companyName.length >= 2) {
                setIsSearching(true);
                try {
                    if (formData.type === 'sangjo') {
                        // Search local constants for Sangjo
                        const results = FUNERAL_COMPANIES.filter(c =>
                            c.name.includes(formData.companyName)
                        ).map(c => ({
                            id: c.id,
                            name: c.name,
                            address: '전국 서비스 (본사)',
                            phone: c.phone
                        }));
                        setSearchResults(results);
                        setShowResults(true);
                    } else {
                        // Search DB for facilities - use the category directly (no mapping needed)
                        const results = await searchKnownFacilities(formData.companyName, formData.type);
                        setSearchResults(results);
                        setShowResults(true);
                    }
                } catch (e) {
                    console.error('Search error', e);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.companyName, formData.type]);

    const handleSelectFacility = (facility: any) => {
        setFormData(prev => ({
            ...prev,
            companyName: facility.name,
            address: facility.address || '',
            phone: facility.phone || '',
            targetFacilityId: facility.id
        }));
        setIsReadOnly(true);
        setShowResults(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile) {
            alert('사업자등록증 파일을 첨부해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            await submitPartnerApplication({
                name: formData.companyName,
                type: formData.type,
                address: formData.address,
                phone: formData.phone,
                companyPhone: formData.companyPhone,        // 추가
                managerName: formData.managerName,
                managerPosition: formData.managerPosition,  // 추가
                managerMobile: formData.managerMobile,
                companyEmail: formData.companyEmail,
                email: formData.email,
                businessLicenseImage: selectedFile,
                userId: user?.id,
                privacyConsent: formData.privacyConsent,    // 추가
                targetFacilityId: formData.targetFacilityId
            });
            console.log('Submission success');
            setIsSuccess(true);
        } catch (error: any) {
            console.error('Submission failed', error);

            // 🔍 중복 이메일 에러 감지
            if (error?.code === '23505' && error?.message?.includes('partner_inquiries_company_email_idx')) {
                alert('⚠️ 이미 등록된 회사 이메일입니다.\n\n다른 이메일로 신청하시거나, 기존 신청 상태를 확인해주세요.\n문의: 고객센터');
            }
            // 🔍 기타 DB 제약 에러
            else if (error?.code?.startsWith('23')) {
                alert('⚠️ 입력하신 정보에 문제가 있습니다.\n\n모든 필드를 확인 후 다시 시도해주세요.');
            }
            // 🔍 일반 에러
            else {
                alert('❌ 신청 제출 중 오류가 발생했습니다.\n\n잠시 후 다시 시도해주세요.');
            }
        } finally {
            setIsSubmitting(false);
        }
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
                    <div className="bg-red-50 p-4 px-6 flex items-start gap-3 border-b border-red-100 justify-between">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={18} />
                            <div>
                                <p className="text-sm font-bold text-red-800">로그인이 필요합니다</p>
                                <p className="text-xs text-red-700 mt-1">
                                    파트너 신청 및 관리자 권한 부여를 위해<br />
                                    반드시 <strong>로그인 후 신청</strong>해주세요. (비회원 신청 불가)
                                </p>
                            </div>
                        </div>
                        {onLoginClick && (
                            <button
                                type="button"
                                onClick={onLoginClick}
                                className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors"
                            >
                                로그인하기
                            </button>
                        )}
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
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.entries(PARTNER_CATEGORIES).map(([key, config]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                type: key,
                                                companyName: '',
                                                address: '',
                                                phone: '',
                                                targetFacilityId: null
                                            }));
                                            setIsReadOnly(false);
                                        }}
                                        className={`py-4 px-3 rounded-xl text-sm font-medium border-2 transition-all ${formData.type === key
                                            ? key === 'sangjo'
                                                ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-md transform scale-[1.02]'
                                                : 'bg-primary border-primary text-white shadow-md transform scale-[1.02]'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="text-2xl mb-1">{config.icon}</div>
                                        <div>{config.label}</div>
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
                            <div className="space-y-1 relative" ref={wrapperRef}>
                                <label className="text-sm font-bold text-gray-700">업체명 <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        name="companyName"
                                        required
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        readOnly={isReadOnly}
                                        autoComplete="off"
                                        placeholder={formData.type === 'sangjo' ? "상조회사/브랜드명 입력" : "업체명 검색/입력 (자동완성)"}
                                        className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all ${isReadOnly
                                            ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                                            : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-primary/20'
                                            }`}
                                    />
                                    {isSearching && !isReadOnly && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        </div>
                                    )}
                                    {isReadOnly && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsReadOnly(false);
                                                setFormData(prev => ({ ...prev, targetFacilityId: null, companyName: '', address: '' }));
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-500 hover:underline"
                                        >
                                            다시 검색
                                        </button>
                                    )}
                                </div>

                                {/* Autocomplete Results */}
                                {showResults && searchResults.length > 0 && !isReadOnly && (
                                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        <div className="p-2 text-xs text-gray-500 border-b bg-gray-50">
                                            '{formData.companyName}' 검색 결과 (탭하여 정보 입력)
                                        </div>
                                        {searchResults.map((facility) => (
                                            <button
                                                key={facility.id}
                                                type="button"
                                                onClick={() => handleSelectFacility(facility)}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0 transition-colors flex flex-col"
                                            >
                                                <span className="font-bold text-gray-900 text-sm">{facility.name}</span>
                                                <span className="text-xs text-gray-500 truncate">{facility.address}</span>
                                                {facility.owner_user_id && <span className="text-xs text-red-400 mt-1">⚠️ 이미 관리자가 존재하는 시설입니다</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">주소 <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        name="address"
                                        required
                                        value={formData.address}
                                        onChange={handleChange}
                                        readOnly={isReadOnly}
                                        placeholder="사업장 주소 (시/군/구 포함)"
                                        className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all ${isReadOnly
                                            ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                                            : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-primary/20'
                                            }`}
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="space-y-4 pt-2 border-t border-gray-100">
                            <label className="text-lg font-bold">담당자 정보</label>

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
                                        placeholder="홍길동"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">부서/직급 <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        name="managerPosition"
                                        required
                                        value={formData.managerPosition}
                                        onChange={handleChange}
                                        placeholder="예: 관리팀 과장, 대표이사"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 pl-1">신청자의 직책을 입력해주세요.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">업체 대표 전화번호 <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        name="companyPhone"
                                        required
                                        value={formData.companyPhone}
                                        onChange={handleChange}
                                        placeholder="02-1234-5678"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 pl-1">시설의 고정 유선 번호입니다.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">담당자 휴대폰 <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        name="managerMobile"
                                        required
                                        value={formData.managerMobile}
                                        onChange={handleChange}
                                        placeholder="010-1234-5678"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 pl-1">긴급 연락 시 사용됩니다.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">회사 이메일 (로그인 ID) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        name="companyEmail"
                                        required
                                        value={formData.companyEmail}
                                        onChange={handleChange}
                                        placeholder="ceo@memorimap.com"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg mt-2 flex items-start gap-2">
                                    <AlertCircle size={14} className="text-blue-600 mt-0.5 shrink-0" />
                                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                        중요: 승인 완료 시, 이 이메일로 '가입 초대장'이 발송됩니다.<br />
                                        추후 파트너 센터 로그인 아이디로 사용되니 정확히 입력해주세요.
                                    </p>
                                </div>
                            </div>
                        </div>


                        {/* Privacy Consent */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="privacyConsent"
                                    checked={formData.privacyConsent}
                                    onChange={(e) => setFormData(prev => ({ ...prev, privacyConsent: e.target.checked }))}
                                    className="mt-0.5 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 flex-1">
                                    <strong className="text-blue-900">[필수]</strong> 개인정보 수집 및 이용에 동의합니다.
                                    <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                                        • 수집항목: 담당자명, 휴대폰, 이메일, 회사 이메일<br />
                                        • 수집목적: 파트너 신청 처리 및 연락<br />
                                        • 보유기간: 승인 후 3년 또는 거절 시 즉시 파기
                                    </p>
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !isSignedIn || !formData.privacyConsent}
                            className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 
                                ${!isSignedIn || !formData.privacyConsent
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-dark text-white hover:bg-gray-800'
                                }
                                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {!isSignedIn ? (
                                <>
                                    <User size={18} />
                                    로그인 후 신청 가능합니다
                                </>
                            ) : isSubmitting ? (
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
