import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, Mail, FileText, Bell, Shield, Info, ChevronLeft, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSession, useUser } from '../lib/auth';
import { getAuthClient } from '../lib/supabaseClient';
import { AdministrativeChecklist } from './AdministrativeChecklist';
import { LegalModal } from './LegalModal';

interface ViewProps {
  onBack: () => void;
  user?: { id?: string; email?: string; user_metadata?: Record<string, unknown> } | null;
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
    <div className="bg-gray-50 h-full overflow-y-auto overscroll-contain pb-20">
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

        {/* 장례 후 행정 체크리스트 */}
        <AdministrativeChecklist />
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
    <div className="bg-gray-50 h-full overflow-y-auto overscroll-contain pb-20">
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
const FAQ_TABS = ['서비스 이용', '시설·계약', '결제·환불', '입점·제휴'] as const;

const FAQ_DATA: Record<string, { q: string; a: string }[]> = {
  '서비스 이용': [
    { q: '추모맵은 어떤 서비스인가요?', a: '장례식장·추모시설·반려동물 장례를 한 곳에서 비교하고 AI 맞춤 추천받을 수 있는 플랫폼입니다.' },
    { q: '회원가입 없이도 이용할 수 있나요?', a: '시설 검색·정보 확인은 비회원도 가능합니다. 상담 예약·리뷰 작성은 로그인이 필요합니다.' },
    { q: 'AI 마음이는 어떻게 사용하나요?', a: '화면 우측 하단 마음이 아이콘을 탭하면 AI 상담이 시작됩니다. 장례식장, 추모시설, 반려동물 장례 중 선택하세요.' },
    { q: '앱 알림은 어떻게 설정하나요?', a: '마이페이지 > 설정에서 알림 수신 여부를 변경할 수 있습니다.' },
  ],
  '시설·계약': [
    { q: '시설 정보는 정확한가요?', a: '입점 업체가 직접 등록·관리하며, 추모맵에서 주기적으로 검증합니다. 오류 발견 시 고객센터로 알려주세요.' },
    { q: '예약은 어떻게 하나요?', a: "시설 상세 페이지 '상담 예약' 버튼 또는 AI 마음이를 통해 예약할 수 있습니다." },
    { q: '예약 취소가 가능한가요?', a: '마이페이지 > 상담 내역에서 취소할 수 있습니다. 시설별 취소 규정이 다를 수 있습니다.' },
    { q: '계약은 추모맵에서 직접 하나요?', a: '추모맵은 시설 추천·상담 연결 플랫폼입니다. 실제 계약은 해당 시설과 직접 진행합니다.' },
  ],
  '결제·환불': [
    { q: '추모맵 이용 요금이 있나요?', a: '고객님의 시설 검색·상담 예약은 모두 무료입니다.' },
    { q: '시설 이용료는 어떻게 결제하나요?', a: '시설 이용료는 해당 시설에 직접 결제합니다. 추모맵에서 별도 청구하지 않습니다.' },
    { q: '환불 규정은 어떻게 되나요?', a: '시설별 환불 규정이 상이합니다. 계약 전 해당 시설에 확인해 주세요.' },
  ],
  '입점·제휴': [
    { q: '우리 시설도 등록할 수 있나요?', a: "사이드 메뉴 > '업체 입점/제휴 문의'에서 신청하실 수 있습니다." },
    { q: '입점 비용은 얼마인가요?', a: '기본 등록은 무료이며, 프리미엄 노출 등은 요금제에 따라 다릅니다.' },
    { q: '제휴 문의는 어디로 하나요?', a: '고객센터 031-975-3335 또는 1:1 문의를 이용해 주세요.' },
  ],
};

const INQUIRY_CATEGORIES = ['서비스 이용', '시설·계약', '결제·환불', '입점·제휴', '기타'] as const;

export const SupportView: React.FC<ViewProps> = ({ onBack, user }) => {
  const { session } = useSession();
  const { user: clerkUser } = useUser();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [faqTab, setFaqTab] = useState<string>(FAQ_TABS[0]);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy' | 'refund' | 'business' | 'license'>('terms');
  const [showInquiry, setShowInquiry] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    category: INQUIRY_CATEGORIES[0] as string,
    name: (user?.user_metadata?.name as string) || (user?.user_metadata?.full_name as string) || '',
    phone: '',
    email: '',
    message: '',
  });

  const handleSubmit = async () => {
    if (!form.phone.trim() || !form.message.trim()) {
      toast.error('연락처와 문의 내용은 필수 항목입니다.');
      return;
    }
    setIsSubmitting(true);
    try {
      const authClient = await getAuthClient(session, { strict: true });
      const { error } = await authClient.from('partner_inquiries').insert({
        user_id: clerkUser?.id || null,
        company_name: '고객문의',
        manager_name: form.name || '고객',
        phone: form.phone,
        email: form.email || null,
        type: 'customer_support',
        inquiry_type: 'customer_support',
        message: `[${form.category}] ${form.message}`,
        status: 'pending',
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success('문의가 접수되었습니다.');
    } catch {
      toast.error('문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentFaqs = FAQ_DATA[faqTab] || [];

  return (
    <div className="bg-gray-50 h-full overflow-y-auto overscroll-contain pb-20">
      <Header title="고객센터" onBack={onBack} />

      {/* Contact Buttons */}
      <div className="p-4 bg-white mb-2">
        <div className="grid grid-cols-2 gap-3">
          <a
            href="tel:031-975-3335"
            className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border hover:bg-gray-100 transition-colors"
          >
            <Phone className="text-primary mb-2" size={24} />
            <span className="font-bold text-gray-800">031-975-3335</span>
            <span className="text-xs text-gray-500">평일 09:00 ~ 18:00</span>
          </a>
          <button
            onClick={() => { setShowInquiry(!showInquiry); setSubmitted(false); }}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-colors ${showInquiry ? 'bg-primary/10 border-primary' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <Mail className={`mb-2 ${showInquiry ? 'text-primary' : 'text-primary'}`} size={24} />
            <span className="font-bold text-gray-800">1:1 문의</span>
            <span className="text-xs text-gray-500">24시간 접수 가능</span>
          </button>
        </div>
      </div>

      {/* 1:1 Inquiry Form (toggle) */}
      {showInquiry && (
        <div className="bg-white p-4 mb-2 border-t">
          {submitted ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle size={48} className="text-green-500 mb-3" />
              <p className="font-bold text-lg text-gray-800">문의가 접수되었습니다</p>
              <p className="text-sm text-gray-500 mt-1">빠른 시일 내 연락드리겠습니다.</p>
              <button
                onClick={() => { setShowInquiry(false); setSubmitted(false); setForm(f => ({ ...f, phone: '', email: '', message: '', category: INQUIRY_CATEGORIES[0] })); }}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg text-sm"
              >
                확인
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-800">1:1 문의하기</h3>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">문의 유형</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white"
                >
                  {INQUIRY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">이름</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="이름을 입력하세요"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">연락처 <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="010-0000-0000"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">이메일</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="example@email.com"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">문의 내용 <span className="text-red-500">*</span></label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="문의 내용을 입력하세요"
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg font-medium text-sm disabled:opacity-50"
              >
                <Send size={16} />
                {isSubmitting ? '접수 중...' : '문의 접수하기'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* FAQ Section */}
      <div className="bg-white p-4">
        <h3 className="font-bold mb-3">자주 묻는 질문</h3>

        {/* Tab chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {FAQ_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setFaqTab(tab); setOpenFaq(null); }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                faqTab === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Accordion FAQ list */}
        <div className="space-y-2">
          {currentFaqs.map((faq, idx) => (
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

      <div className="bg-white p-4 mt-2">
        <h3 className="font-bold mb-3">정책 및 사업자 정보</h3>
        <div className="space-y-2">
          <button
            onClick={() => { setLegalTab('terms'); setShowLegalModal(true); }}
            className="w-full flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-800">이용약관</span>
            </div>
            <ChevronLeft size={16} className="text-gray-300 rotate-180" />
          </button>
          <button
            onClick={() => { setLegalTab('privacy'); setShowLegalModal(true); }}
            className="w-full flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-800">개인정보처리방침</span>
            </div>
            <ChevronLeft size={16} className="text-gray-300 rotate-180" />
          </button>
          <button
            onClick={() => { setLegalTab('refund'); setShowLegalModal(true); }}
            className="w-full flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Info size={18} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-800">환불/해지 정책</span>
            </div>
            <ChevronLeft size={16} className="text-gray-300 rotate-180" />
          </button>
          <button
            onClick={() => { setLegalTab('business'); setShowLegalModal(true); }}
            className="w-full flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Info size={18} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-800">사업자 정보</span>
            </div>
            <ChevronLeft size={16} className="text-gray-300 rotate-180" />
          </button>
        </div>
      </div>

      {showLegalModal && <LegalModal initialTab={legalTab} onClose={() => setShowLegalModal(false)} />}
    </div>
  );
};

// --- 앱 설정 ---
export const SettingsView: React.FC<ViewProps> = ({ onBack, user: _user }) => {
  return (
    <div className="bg-gray-50 h-full overflow-y-auto overscroll-contain pb-20">
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
          <a
            href="https://memorimap.kr/privacy/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-4 flex justify-between items-center border-b last:border-0 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-gray-600" />
              <span className="text-sm font-medium">개인정보 처리방침</span>
            </div>
            <ChevronLeft size={16} className="text-gray-300 rotate-180" />
          </a>
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
