import React from 'react';
import { Check } from 'lucide-react';

interface Props {
  onClose: () => void;
  isUrgent?: boolean;
}

export const StepComplete: React.FC<Props> = ({ onClose, isUrgent }) => {
  if (isUrgent) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="text-red-600 w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold mb-2">접수 제출 완료</h3>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed whitespace-pre-line">
          해당 시설 업체 대시보드에 접수 되었습니다.{'\n'}
          담당자 확인 후 연락드리겠습니다.
        </p>
        <button onClick={onClose} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors">
          확인
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <h3 className="text-xl font-bold mb-4">예약 완료!</h3>
      <button onClick={onClose} className="w-full bg-primary text-white py-3 rounded-xl">
        확인
      </button>
    </div>
  );
};
