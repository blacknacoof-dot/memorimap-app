// components/AI/MemorialConsultationForm.tsx
import React, { useState } from 'react';
import { createMemorialConsultation } from '@/lib/queries';
import { Loader2, Check, X } from 'lucide-react';

/**
 * AI 상담 폼 – 추모시설(봉안당/공원묘지) 전용
 * 기존 MemorialSearchForm 디자인을 유지하면서
 *   - 긴급/사전 모드 선택
 *   - 종교 선택
 *   - 예산 선택
 *   - **채광 옵션** (밝음/어두움)
 *   - **단높이 옵션** (저단/중단/고단)
 *   - 연락처 입력 → DB 저장
 */
interface Props {
    facilityId: number; // memorial_spaces.id
    facilityName: string;
    currentUser?: { id: string; name?: string; phone?: string } | null;
    onClose?: () => void;
}

const LightingOptions = [
    { id: 'bright', label: '채광 좋음' },
    { id: 'dim', label: '채광 어두움' },
];

const TierOptions = [
    { id: 'low', label: '저단' },
    { id: 'mid', label: '중단' },
    { id: 'high', label: '고단' },
];

export const MemorialConsultationForm: React.FC<Props> = ({
    facilityId,
    facilityName,
    currentUser,
    onClose,
}) => {
    const [step, setStep] = useState(1);
    const [mode, setMode] = useState<'urgent' | 'prepare' | ''>('');
    const [religion, setReligion] = useState('');
    const [budget, setBudget] = useState('');
    const [lighting, setLighting] = useState('');
    const [tier, setTier] = useState('');
    const [name, setName] = useState(currentUser?.name ?? '');
    const [phone, setPhone] = useState(currentUser?.phone ?? '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleNext = () => {
        setError('');
        if (step === 1 && !mode) return setError('모드를 선택해주세요.');
        if (step === 2 && !religion) return setError('종교를 선택해주세요.');
        if (step === 3 && !budget) return setError('예산을 선택해주세요.');
        if (step === 4 && !lighting) return setError('채광 옵션을 선택해주세요.');
        if (step === 5 && !tier) return setError('단높이 옵션을 선택해주세요.');
        if (step === 6 && (!name || !phone)) return setError('연락처 정보를 입력해주세요.');
        setStep(prev => prev + 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await createMemorialConsultation({
                facility_id: facilityId,
                user_id: currentUser?.id ?? '',
                user_name: name,
                user_phone: phone,
                mode,
                religion,
                budget,
                lighting,
                tier,
            });
            // 성공 시 간단한 완료 메시지
            alert('상담 요청이 접수되었습니다. 담당자가 연락드리겠습니다.');
            if (onClose) onClose();
        } catch (e) {
            console.error(e);
            setError('요청 전송에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // UI rendering per step
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">상담 모드 선택</h3>
                        <button
                            className={`px-4 py-2 rounded ${mode === 'urgent' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                            onClick={() => setMode('urgent')}
                        >🚨 긴급 안치</button>
                        <button
                            className={`px-4 py-2 rounded ${mode === 'prepare' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                            onClick={() => setMode('prepare')}
                        >📅 사전 상담</button>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">종교 선택</h3>
                        {['none', 'christian', 'catholic', 'buddhist'].map(id => (
                            <button
                                key={id}
                                className={`px-3 py-1 rounded ${religion === id ? 'bg-primary text-white' : 'bg-gray-100'}`}
                                onClick={() => setReligion(id)}
                            >{id === 'none' ? '무교' : id}</button>
                        ))}
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">예산 선택</h3>
                        {['low', 'medium', 'high'].map(id => (
                            <button
                                key={id}
                                className={`px-3 py-1 rounded ${budget === id ? 'bg-primary text-white' : 'bg-gray-100'}`}
                                onClick={() => setBudget(id)}
                            >{id}</button>
                        ))}
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">채광 옵션</h3>
                        {LightingOptions.map(o => (
                            <button
                                key={o.id}
                                className={`px-3 py-1 rounded ${lighting === o.id ? 'bg-primary text-white' : 'bg-gray-100'}`}
                                onClick={() => setLighting(o.id)}
                            >{o.label}</button>
                        ))}
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">단높이 옵션</h3>
                        {TierOptions.map(o => (
                            <button
                                key={o.id}
                                className={`px-3 py-1 rounded ${tier === o.id ? 'bg-primary text-white' : 'bg-gray-100'}`}
                                onClick={() => setTier(o.id)}
                            >{o.label}</button>
                        ))}
                    </div>
                );
            case 6:
                return (
                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">연락처 입력</h3>
                        <input
                            type="text"
                            placeholder="이름"
                            className="border rounded w-full p-2"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                        <input
                            type="tel"
                            placeholder="전화번호"
                            className="border rounded w-full p-2"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-4 bg-white rounded shadow-md max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">{facilityName} AI 상담</h2>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            {renderStep()}
            <div className="mt-4 flex justify-between">
                {step > 1 && (
                    <button className="px-3 py-1" onClick={() => setStep(prev => prev - 1)}>
                        ← 이전
                    </button>
                )}
                {step < 6 && (
                    <button className="px-3 py-1 bg-primary text-white rounded" onClick={handleNext}>
                        다음 →
                    </button>
                )}
                {step === 6 && (
                    <button
                        className="px-3 py-1 bg-green-600 text-white rounded flex items-center"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
                        제출
                    </button>
                )}
            </div>
        </div>
    );
};

export default MemorialConsultationForm;
