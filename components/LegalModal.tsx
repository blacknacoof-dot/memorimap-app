import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type LegalTab = 'terms' | 'privacy' | 'refund' | 'business' | 'license';

interface Props {
  onClose: () => void;
  initialTab?: LegalTab;
}

const TAB_LABELS: Record<LegalTab, string> = {
  terms: '이용약관',
  privacy: '개인정보처리방침',
  refund: '환불/해지 정책',
  business: '사업자 정보',
  license: '오픈소스 라이선스',
};

const BUSINESS_INFO = {
  serviceName: '메모리맵',
  operatorName: '(주)아톰케어',
  representative: '박태용',
  registrationNumber: '576-87-02748',
  address: '경기 고양시 일산동구 탄중로 421 (웅산프라자) 3층 305-1호',
  supportPhone: '031-975-3335',
  supportEmail: 'atomcare@kakao.com',
  faxNumber: '0504-336-4569',
  ecommerceRegistration: '2024-고양일산동-0025',
  businessHours: '평일 09:00 ~ 18:00',
};

export const LegalModal: React.FC<Props> = ({ onClose, initialTab = 'privacy' }) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-3xl max-h-[85dvh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-lg text-gray-800">법적 고지 및 사업자 정보</h2>
          <button
            onClick={onClose}
            className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="border-b bg-white px-3 py-2 md:py-3 overflow-x-auto">
          <div className="flex gap-1.5 md:gap-2">
            {(Object.keys(TAB_LABELS) as LegalTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-sm leading-relaxed text-gray-700">
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900">이용약관</h3>
              <p>본 약관은 메모리맵이 제공하는 추모시설 정보, 상담 연결, 구독형 서비스의 이용 조건과 절차를 정합니다.</p>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">1. 서비스 범위</h4>
                <p>메모리맵은 장례식장, 추모시설, 상조 관련 정보 제공, 상담 연결, 사업자용 구독형 기능을 제공합니다.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">2. 회원의 의무</h4>
                <p>이용자는 정확한 정보를 제공해야 하며, 타인의 정보를 도용하거나 서비스 운영을 방해하는 행위를 해서는 안 됩니다.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">3. 결제 및 구독</h4>
                <p>유료 구독 서비스는 결제 완료 시점부터 이용 가능하며, 과금 주기와 제공 범위는 결제 화면 또는 요금제 안내에 따릅니다.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">4. 해지</h4>
                <p>구독 해지는 대시보드 또는 고객센터를 통해 요청할 수 있으며, 다음 결제일부터 자동 청구가 중단됩니다.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">5. 책임 제한</h4>
                <p>메모리맵은 입점 업체가 제공한 정보의 정확성을 높이기 위해 노력하지만, 최종 계약과 실제 서비스 제공은 해당 업체와 이용자 사이에서 이루어집니다.</p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900">개인정보처리방침</h3>
              <p>메모리맵은 관련 법령을 준수하며 이용자의 개인정보를 안전하게 처리합니다.</p>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">1. 수집 항목</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>필수: 이메일, 로그인 식별자, 서비스 이용 기록</li>
                  <li>선택: 이름, 연락처, 프로필 이미지</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">2. 이용 목적</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>회원 식별 및 서비스 제공</li>
                  <li>상담 및 문의 응대</li>
                  <li>결제, 구독 상태 관리, 고객 지원</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">3. 보관 기간</h4>
                <p>개인정보는 수집 및 이용 목적 달성 시 지체 없이 파기하며, 법령상 보관이 필요한 경우 해당 기간 동안만 보관합니다.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">4. 이용자 권리</h4>
                <p>이용자는 개인정보 열람, 수정, 삭제, 처리 정지를 요청할 수 있으며 고객센터를 통해 접수할 수 있습니다.</p>
              </div>
            </div>
          )}

          {activeTab === 'refund' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900">환불 및 해지 정책</h3>
              <p>아래 정책은 메모리맵의 구독형 유료 서비스 기준이며, 입점 시설과 이용자 사이의 개별 계약에는 별도 정책이 적용될 수 있습니다.</p>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">1. 정기결제 해지</h4>
                <p>정기결제 해지는 다음 결제 예정일 전까지 신청해야 하며, 해지 후 다음 청구일부터 자동 결제가 중단됩니다.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">2. 환불 기준</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>결제 오류 또는 중복 결제는 확인 후 환불합니다.</li>
                  <li>서비스 장애 등 회사 귀책 사유가 확인되면 별도 기준에 따라 환불 또는 보상합니다.</li>
                  <li>당월 이용이 개시된 구독의 단순 변심 환불은 제한될 수 있습니다.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">3. 청약철회 및 문의</h4>
                <p>환불, 결제 취소, 청약철회 문의는 고객센터 또는 1:1 문의를 통해 접수할 수 있으며, 접수 후 확인 절차를 거쳐 안내합니다.</p>
              </div>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900">사업자 정보</h3>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                <div><span className="font-bold text-gray-900">서비스명:</span> {BUSINESS_INFO.serviceName}</div>
                <div><span className="font-bold text-gray-900">상호:</span> {BUSINESS_INFO.operatorName}</div>
                <div><span className="font-bold text-gray-900">대표자명:</span> {BUSINESS_INFO.representative}</div>
                <div><span className="font-bold text-gray-900">사업자등록번호:</span> {BUSINESS_INFO.registrationNumber}</div>
                <div><span className="font-bold text-gray-900">사업장 주소:</span> {BUSINESS_INFO.address}</div>
                <div><span className="font-bold text-gray-900">고객센터:</span> {BUSINESS_INFO.supportPhone}</div>
                <div><span className="font-bold text-gray-900">이메일:</span> {BUSINESS_INFO.supportEmail}</div>
                <div><span className="font-bold text-gray-900">팩스:</span> {BUSINESS_INFO.faxNumber}</div>
                <div><span className="font-bold text-gray-900">통신판매업신고:</span> {BUSINESS_INFO.ecommerceRegistration}</div>
                <div><span className="font-bold text-gray-900">운영시간:</span> {BUSINESS_INFO.businessHours}</div>
              </div>
            </div>
          )}

          {activeTab === 'license' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900">오픈소스 라이선스 고지</h3>
              <p>본 서비스는 다음 오픈소스 소프트웨어를 포함할 수 있습니다.</p>
              <div className="bg-gray-50 p-4 rounded-lg border text-xs font-mono space-y-3">
                <div>
                  <strong className="block text-gray-800 mb-1">React / React DOM</strong>
                  <p>MIT License</p>
                </div>
                <hr className="border-gray-200" />
                <div>
                  <strong className="block text-gray-800 mb-1">Lucide React</strong>
                  <p>ISC License</p>
                </div>
                <hr className="border-gray-200" />
                <div>
                  <strong className="block text-gray-800 mb-1">Supabase JavaScript Client</strong>
                  <p>MIT License</p>
                </div>
                <hr className="border-gray-200" />
                <div>
                  <strong className="block text-gray-800 mb-1">Clerk / 기타 프론트엔드 라이브러리</strong>
                  <p>각 라이브러리의 개별 라이선스를 따릅니다.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t text-center text-xs text-gray-500">
          <p>{BUSINESS_INFO.operatorName} · 고객센터 {BUSINESS_INFO.supportPhone}</p>
        </div>
      </div>
    </div>
  );
};
