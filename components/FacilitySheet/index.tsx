import React, { useRef, useEffect } from 'react';
import { X, Check, Scale, Bot, Award, Crown, ShieldCheck, Share2 } from 'lucide-react';
import { Facility, Reservation } from '../../types';
import { toast } from 'sonner';
import { analytics } from '../../lib/analytics';
import { getCategoryLabel } from '../../utils/facilityNormalizer';
import { useFacilitySheet } from './useFacilitySheet';
import { Lightbox } from './Lightbox';
import { InfoTab } from './InfoTab';
import { PhotosTab } from './PhotosTab';
import { ReviewTab } from './ReviewTab';
import { PriceTab } from './PriceTab';

interface Props {
  facility: Facility;
  onClose: () => void;
  onBook: () => void;
  onViewMap?: () => void;
  isLoggedIn: boolean;
  currentUser: { id: string; name: string } | null;
  onAddReview: (facilityId: string, content: string, rating: number) => void;
  onLoginRequired: () => void;
  isInCompareList: boolean;
  onToggleCompare: () => void;
  reservations?: Reservation[];
  onOpenConsultation?: () => void;
  onOpenAiChat?: () => void;
  onViewSangjoList?: () => void;
  onDirectConsult?: () => void;
}

export const FacilitySheet: React.FC<Props> = ({
  facility, onClose, onBook, onViewMap, isLoggedIn, currentUser,
  onLoginRequired, isInCompareList, onToggleCompare,
  reservations = [], onOpenAiChat, onViewSangjoList, onDirectConsult,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    analytics.facilityDetailOpen(facility.id, facility.name, facility.type || facility.category || '');
  }, [facility.id]);

  const {
    activeTab, setActiveTab, lightboxIndex, setLightboxIndex,
    reviewRefreshTrigger, setReviewRefreshTrigger,
    isFavorite, dbPackages, handleToggleFavorite,
  } = useFacilitySheet({ facility, isLoggedIn, currentUser, onLoginRequired });

  const tabs = [
    { id: 'info', label: '정보' },
    { id: 'photos', label: '사진' },
    { id: 'reviews', label: '리뷰' },
    { id: 'price', label: '가격' },
  ] as const;

  return (
    <>
      {lightboxIndex !== null && facility.galleryImages && (
        <Lightbox
          images={facility.galleryImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(lightboxIndex - 1)}
          onNext={() => setLightboxIndex(lightboxIndex + 1)}
        />
      )}

      <div className="fixed inset-x-0 bottom-0 z-[210] bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 max-h-[95dvh] h-[88dvh] md:h-[85dvh] flex flex-col md:max-w-md md:mx-auto pb-safe">
        {/* Handle */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full cursor-pointer" />
        </div>

        {/* Hero Image */}
        <div className="relative h-32 md:h-48 shrink-0">
          <img src={facility.imageUrl} alt={facility.name} className="w-full h-full object-cover" />
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={onToggleCompare}
              className={`p-2 rounded-full text-white backdrop-blur-sm transition-colors ${isInCompareList ? 'bg-primary border-primary' : 'bg-black/30'}`}
              title={isInCompareList ? '비교함에서 제거' : '비교함에 추가'}
            >
              {isInCompareList ? <Check size={20} /> : <Scale size={20} />}
            </button>
            {facility.subscription?.plan && (
              <button
                onClick={() => onOpenAiChat?.()}
                className="bg-primary/20 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-primary backdrop-blur-sm hover:bg-primary/30 transition-colors"
                title="AI 상담"
              >
                <Bot size={20} />
              </button>
            )}
            <button onClick={onClose} className="bg-black/30 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white backdrop-blur-sm">
              <X size={20} />
            </button>
          </div>
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="bg-accent px-2 py-0.5 text-xs font-bold rounded inline-block tracking-wider">
                {getCategoryLabel(facility.type || '') || facility.category}
              </div>
              {facility.isVerified && (
                <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-0.5 rounded-full shadow-lg border border-blue-400" title="업체 인증 완료">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-bold">인증됨</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold shadow-sm">{facility.name}</h2>
              {facility.subscription?.plan?.name_en === 'premium' && (
                <div className="bg-gradient-to-r from-gray-300 to-gray-400 text-white p-1 rounded-full shadow-lg" title="프리미엄 실버 등급">
                  <Award size={16} />
                </div>
              )}
              {facility.subscription?.plan?.name_en === 'enterprise' && (
                <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white p-1 rounded-full shadow-lg" title="프리미엄 골드 등급">
                  <Crown className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Consultation Promotion (desktop only) */}
        {facility.subscription?.plan && (
          <div className="hidden md:block px-4 py-6">
            <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
              facility.subscription.plan.name_en === 'premium' || facility.subscription.plan.name_en === 'enterprise'
                ? 'bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20 shadow-sm'
                : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                    facility.subscription.plan.name_en === 'premium' || facility.subscription.plan.name_en === 'enterprise'
                      ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Bot size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">실시간 AI 상담 가능</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">시설 이용 및 절차에 대해 바로 물어보세요</p>
                  </div>
                </div>
                <button
                  onClick={() => onOpenAiChat?.()}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                    facility.subscription.plan.name_en === 'premium' || facility.subscription.plan.name_en === 'enterprise'
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  상담 시작
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`facility-sheet-tab-${tab.id}`}
              className={`flex-1 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 no-scrollbar">
          {activeTab === 'info' && (
            <InfoTab
              facility={facility}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
              onViewMap={onViewMap}
              onViewPhotos={() => setActiveTab('photos')}
              onOpenAiChat={onOpenAiChat}
              onViewSangjoList={onViewSangjoList}
              onClose={onClose}
              onLightboxOpen={setLightboxIndex}
            />
          )}
          {activeTab === 'photos' && (
            <PhotosTab images={facility.galleryImages} onLightboxOpen={setLightboxIndex} />
          )}
          {activeTab === 'reviews' && (
            <ReviewTab
              facilityId={facility.id}
              facilityRating={facility.rating || 0}
              facilityReviewCount={facility.reviews?.length || 0}
              reviewRefreshTrigger={reviewRefreshTrigger}
              setReviewRefreshTrigger={setReviewRefreshTrigger}
              onLoginRequired={onLoginRequired}
            />
          )}
          {activeTab === 'price' && (
            <PriceTab facility={facility} dbPackages={dbPackages} />
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-3 md:p-4 border-t bg-white pb-safe flex gap-2 md:gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20">
          <button
            onClick={async () => {
              const shareData = { title: facility.name, text: `${facility.name} - ${facility.address}`, url: window.location.href };
              try {
                if (navigator.share) {
                  await navigator.share(shareData);
                } else {
                  await navigator.clipboard.writeText(`${facility.name}\n${facility.address}\n${window.location.href}`);
                  toast.success('링크가 복사되었습니다.');
                }
              } catch { /* 사용자 취소 */ }
            }}
            className="flex flex-col items-center justify-center min-w-[44px] text-gray-500 hover:text-primary transition-colors"
          >
            <Share2 size={18} />
            <span className="text-[9px] mt-0.5 font-medium">공유</span>
          </button>

          <button
            onClick={() => { analytics.aiChatOpen(facility.id, facility.name); onOpenAiChat?.(); }}
            data-testid="facility-sheet-ai-chat-button"
            className="flex-1 bg-primary/10 text-primary border border-primary/30 py-3 rounded-xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-1.5 text-sm"
          >
            <Bot size={18} />
            AI 상담
          </button>

          {facility.naverBookingUrl && facility.naverBookingUrl.length > 10 &&
           String(facility.id) !== '3' && /^https?:\/\//i.test(facility.naverBookingUrl) && (
            <button
              onClick={() => window.open(facility.naverBookingUrl, '_blank', 'noopener,noreferrer')}
              className="flex-1 bg-[#03C75A] text-white py-3 rounded-xl font-bold shadow-lg shadow-green-600/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5 text-sm"
            >
              <span className="bg-white text-[#03C75A] w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-black">N</span>
              네이버 예약
            </button>
          )}

          <button
            onClick={() => {
              analytics.reservationStart(facility.id, facility.name);
              if (facility.type === 'funeral' && onDirectConsult) {
                onDirectConsult();
              } else {
                onBook();
              }
            }}
            data-testid="facility-sheet-book-button"
            className="flex-1 bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform text-sm"
          >
            {facility.type === 'funeral' ? '바로예약하기' : '방문 예약하기'}
          </button>
        </div>
      </div>
    </>
  );
};
