import React from 'react';

interface WebBusinessFooterProps {
  className?: string;
}

const BUSINESS_LINES = [
  '(주)아톰케어 | 대표: 박태용 | 사업자등록번호: 576-87-02748',
  '경기 고양시 일산동구 탄중로 421 웅산프라자 3층 305-1호',
  '고객센터: 031-975-3335 | 이메일: atomcare@naver.com | 통신판매업신고번호: 2024-고양일산동-0025',
];

export const WebBusinessFooter: React.FC<WebBusinessFooterProps> = ({ className = '' }) => {
  return (
    <footer className={`hidden border-t border-slate-200 bg-white/95 px-6 py-5 text-left text-xs text-slate-500 md:block ${className}`}>
      <div className="space-y-1.5 leading-5">
        {BUSINESS_LINES.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </footer>
  );
};
