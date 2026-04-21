import React from 'react';
import { BUSINESS_INFO, BUSINESS_REVIEW_FIELDS } from '../lib/businessInfo';

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
  const primaryLine = BUSINESS_REVIEW_FIELDS.slice(0, 3).join(' · ');
  const secondaryLine = `주소: ${BUSINESS_INFO.address} · 고객센터: ${BUSINESS_INFO.supportPhone} · 이메일: ${BUSINESS_INFO.supportEmail} · 통신판매업신고: ${BUSINESS_INFO.ecommerceRegistration}`;

  return (
    <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-[10px] leading-4 text-slate-500 md:hidden">
      <p className="font-medium text-slate-600">{primaryLine}</p>
      <p className="mt-0.5">{secondaryLine}</p>
    </div>
  );
};
