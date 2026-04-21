import React from 'react';
import { BUSINESS_INFO } from '../lib/businessInfo';

interface WebBusinessFooterProps {
  className?: string;
}

export const WebBusinessFooter: React.FC<WebBusinessFooterProps> = ({ className = '' }) => {
  return (
    <footer className={`hidden border-t border-slate-200 bg-white/95 px-6 py-5 text-left text-xs text-slate-500 md:block ${className}`}>
      <div className="space-y-1.5 leading-5">
        {[
          `${BUSINESS_INFO.operatorName} | 대표: ${BUSINESS_INFO.representative} | 사업자등록번호: ${BUSINESS_INFO.registrationNumber}`,
          BUSINESS_INFO.address,
          `고객센터: ${BUSINESS_INFO.supportPhone} | 이메일: ${BUSINESS_INFO.supportEmail} | 통신판매업신고번호: ${BUSINESS_INFO.ecommerceRegistration}`,
        ].map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </footer>
  );
};

export const MobileBusinessInfoBar: React.FC = () => {
  const compactLine = `${BUSINESS_INFO.operatorName} · 사업자등록번호 ${BUSINESS_INFO.registrationNumber} · 통신판매업신고 ${BUSINESS_INFO.ecommerceRegistration}`;

  return (
    <div className="shrink-0 border-t border-slate-100 bg-white px-1 pt-0.5 pb-0 text-center text-[9px] leading-3 text-slate-500 md:hidden">
      <p className="truncate whitespace-nowrap">{compactLine}</p>
    </div>
  );
};
