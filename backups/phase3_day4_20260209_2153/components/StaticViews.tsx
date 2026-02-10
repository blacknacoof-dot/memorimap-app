import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, Mail, FileText, Bell, Shield, Info, ChevronLeft } from 'lucide-react';
import { ViewState } from '../types';

interface ViewProps {
  onBack: () => void;
  user?: any;
}

const Header = ({ title, onBack }: { title: string, onBack: () => void }) => (
  <div className="flex items-center gap-3 p-4 border-b bg-white sticky top-0 z-10">
    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
      <ChevronLeft size={24} className="text-gray-700" />
    </button>
    <h1 className="text-xl font-bold text-gray-800">{title}</h1>
  </div>
);

// --- 장례/추모 가이드 ---
export const GuideView: React.FC<ViewProps> = ({ onBack }) => {
  return (
    <div className="bg-gray-50 min-h-full pb-20">
      <Header title="장례/추모 가이드" onBack={onBack} />
      <div className="p-4 space-y-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="font-bold text-lg mb-2 text-primary">장례 3일장 절차</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="bg-gray-100 text-gray-800 font-bold px-2 py-0.5 rounded h-fit">1일차</span>
              <p>임종 및 운구, 빈소 설치, 부고 알림, 상주 상복 착용</p>
            </li>
            <li className="flex gap-3">
              <span className="bg-gray-100 text-gray-800 font-bold px-2 py-0.5 rounded h-fit">2일차</span>
              <p>염습 및 입관, 성복제(기독교는 입관예배), 조문객 맞이</p>
            </li>
            <li className="flex gap-3">
              <span className="bg-gray-100 text-gray-800 font-bold px-2 py-0.5 rounded h-fit">3일차</span>
              <p>발인제, 화장장 이동 및 화장, 장지 이동 및 안치</p>
            </li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="font-bold text-lg mb-2 text-primary">올바른 조문 예절</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• 복장은 검은색 정장이 원칙이며, 준비되지 않은 경우 감색 등 어두운 계열의 단정한 복장을 착용합니다.</p>
            <p>• 빈소에 도착하면 외투나 모자를 미리 벗어두고 들어갑니다.</p>
            <p>• 상주와 가볍게 목례 후 영정 앞에 무릎을 꿇고 앉아 분향 또는 헌화를 합니다.</p>
            <p>• 절을 할 때는 남자는 오른손, 여자는 왼손이 위로 가도록 합니다.</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h3 className="font-bold text-lg mb-2 text-primary">제사 상차림의 원칙</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="bg-gray-50 p-2 rounded">
              <span className="font-bold block mb-1">홍동백서</span>
              붉은 과일은 동쪽, 흰 과일은 서쪽
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="font-bold block mb-1">조율이시</span>
              왼쪽부터 대추, 밤, 배, 감 순서
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="font-bold block mb-1">어동육서</span>
              생선은 동쪽, 고기는 서쪽
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="font-bold block mb-1">두동미서</span>
              생선 머리는 동쪽, 꼬리는 서쪽
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 공지사항 & 이벤트 ---
export const NoticesView: React.FC<ViewProps> = ({ onBack }) => {
  const notices = [
    { id: 4, type: '공지', title: '전국 추천 시설 20개소 대대적 확장 업데이트', date: '2025.12.18', read: false },
    { id: 5, type: '공지', title: '대한민국 상조 서비스 TOP 10 순위 정보 반영', date: '2025.12.18', read: false },
    { id: 1, type: '공지', title: '추모맵 서비스 정식 오픈 안내', date: '2023.10.01', read: false },
    { id: 2, type: '이벤트', title: '사전 예약 고객 10% 할인 프로모션', date: '2023.10.05', read: true },
    { id: 3, type: '점검', title: '서버 점검 안내 (10/25 02:00~04:00)', date: '2023.10.20', read: true },
  ];

  return (
    <div className="bg-gray-50 min-h-full pb-20">
      <Header title="공지사항 & 이벤트" onBack={onBack} />
      <div className="divide-y border-b bg-white">
        {notices.map((notice) => (
          <div key={notice.id} className="p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${notice.type === '이벤트' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                notice.type === '점검' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                  'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                {notice.type}
              </span>
              <span className="text-xs text-gray-400">{notice.date}</span>
            </div>
            <h3 className={`text-sm ${notice.read ? 'text-gray-500 font-normal' : 'text-gray-800 font-bold'}`}>
              {notice.title}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 고객센터 / 자주 묻는 질문 ---
export const SupportView: React.FC<ViewProps> = ({ onBack }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "예약은 어떻게 취소하나요?", a: "마이페이지 > 예약 내역에서 해당 예약을 선택하신 후 '예약 취소' 버튼을 눌러 진행하실 수 있습니다. 방문 3일 전까지는 전액 환불됩니다." },
    { q: "예약금은 꼭 결제해야 하나요?", a: "네, 허위 예약을 방지하기 위해 10만원의 예약금을 선결제 받고 있습니다. 이는 추후 계약 시 시설 비용에서 차감됩니다." },
    { q: "당일 방문 예약도 가능한가요?", a: "시설 상황에 따라 다르지만, 최소 3시간 전까지 예약해 주시는 것을 권장드립니다. 급한 경우 고객센터로 전화 부탁드립니다." },
  ];

  return (
    <div className="bg-gray-50 min-h-full pb-20">
      <Header title="고객센터" onBack={onBack} />

      {/* Contact Info */}
      <div className="p-4 bg-white mb-2">
        <h3 className="font-bold mb-3">문의하기</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border hover:bg-gray-100">
            <Phone className="text-primary mb-2" size={24} />
            <span className="font-bold text-gray-800">1588-0000</span>
            <span className="text-xs text-gray-500">평일 09:00 - 18:00</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border hover:bg-gray-100">
            <Mail className="text-primary mb-2" size={24} />
            <span className="font-bold text-gray-800">1:1 문의</span>
            <span className="text-xs text-gray-500">24시간 접수 가능</span>
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white p-4">
        <h3 className="font-bold mb-3">자주 묻는 질문</h3>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex justify-between items-center p-4 bg-white text-left hover:bg-gray-50"
              >
                <span className="font-medium text-sm text-gray-800">Q. {faq.q}</span>
                {openFaq === idx ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {openFaq === idx && (
                <div className="p-4 bg-gray-50 text-sm text-gray-600 border-t">
                  A. {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 앱 설정 ---
export const SettingsView: React.FC<ViewProps> = ({ onBack, user }) => {
  return (
    <div className="bg-gray-50 min-h-full pb-20">
      <Header title="설정" onBack={onBack} />

      <div className="space-y-2 p-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b text-xs font-bold text-gray-400">알림 설정</div>
          <div className="p-4 flex justify-between items-center border-b last:border-0">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-gray-600" />
              <span className="text-sm font-medium">푸시 알림</span>
            </div>
            <input type="checkbox" defaultChecked className="toggle" />
          </div>
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-gray-600" />
              <span className="text-sm font-medium">마케팅 정보 수신 동의</span>
            </div>
            <input type="checkbox" className="toggle" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b text-xs font-bold text-gray-400">정보</div>
          <button className="w-full p-4 flex justify-between items-center border-b last:border-0 hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-gray-600" />
              <span className="text-sm font-medium">개인정보 처리방침</span>
            </div>
            <ChevronLeft size={16} className="text-gray-300 rotate-180" />
          </button>
          <button className="w-full p-4 flex justify-between items-center hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <Info size={20} className="text-gray-600" />
              <span className="text-sm font-medium">오픈소스 라이선스</span>
            </div>
            <ChevronLeft size={16} className="text-gray-300 rotate-180" />
          </button>
          <div className="p-4 flex justify-between items-center border-t">
            <span className="text-sm text-gray-600">현재 버전</span>
            <span className="text-sm font-bold text-primary">v1.0.0</span>
          </div>
        </div>

        <button className="w-full mt-6 text-gray-400 text-xs underline p-2">
          회원 탈퇴
        </button>
      </div>
    </div>
  );
};
