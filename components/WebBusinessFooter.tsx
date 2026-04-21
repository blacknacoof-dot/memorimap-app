import React from 'react';
import { BUSINESS_INFO } from '../lib/businessInfo';

interface WebBusinessFooterProps {
  className?: string;
}

const BUSINESS_LINES = [
  `${BUSINESS_INFO.operatorName} | 대표자 ${BUSINESS_INFO.representative} | 사업자등록번호 ${BUSINESS_INFO.registrationNumber}`,
  BUSINESS_INFO.address,
  `고객센터: ${BUSINESS_INFO.supportPhone} | 이메일 ${BUSINESS_INFO.supportEmail} | 통신판매업신고번호 ${BUSINESS_INFO.ecommerceRegistration}`,
];

export const WebBusinessFooter: React.FC<WebBusinessFooterProps> = ({ className = '' }) => {
  return (
    <footer
      className={`border-t border-slate-200 bg-white/95 px-4 py-3 text-left text-[10px] text-slate-500 md:px-6 md:py-5 md:text-xs ${className}`}
    >
      <div className="space-y-1 leading-4 md:space-y-1.5 md:leading-5">
        {BUSINESS_LINES.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </footer>
  );
};
