import React, { useState, useRef, useEffect, useMemo } from 'react';
import { favoriteService } from '../services/favoriteService';
import { Facility, Reservation } from '../types';
import { X, Star, MapPin, Phone, Clock, Navigation, Heart, Check, Scale, Bot, Award, Crown, ShieldCheck, MessageSquare, ChevronLeft, ChevronRight, Image as ImageIcon, Gift } from 'lucide-react';
import { incrementAiUsage } from '../lib/queries';
import { ReviewForm } from './ReviewForm';
import { ReviewList } from './ReviewList';
import { ChatInterface } from './AI/ChatInterface';
import { getSmartFeatures, getSmartDescription } from '../lib/facilityUtils';

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
}



export const FacilitySheet: React.FC<Props> = ({
  facility,
  onClose,
  onBook,
  onViewMap,
  isLoggedIn,
  currentUser,
  onAddReview,
  onLoginRequired,
  isInCompareList,
  onToggleCompare,
  reservations = [],
  onOpenConsultation,
  onOpenAiChat,
  onViewSangjoList
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'reviews' | 'price' | 'ai'>('info');

  // Gallery State (Index based)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Review Refresh State
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);

  const [isFavorite, setIsFavorite] = useState(false);

  // Check Favorite Status
  useEffect(() => {
    const checkFav = async () => {
      if (isLoggedIn && currentUser && currentUser.id) {
        try {
          const status = await favoriteService.checkFavorite(currentUser.id, facility.id);
          setIsFavorite(status);
        } catch (e) {
          console.error('Failed to check favorite status', e);
        }
      } else {
        setIsFavorite(false);
      }
    };
    checkFav();
  }, [facility.id, isLoggedIn, currentUser]);

  const handleToggleFavorite = async () => {
    if (!isLoggedIn || !currentUser) {
      onLoginRequired();
      return;
    }

    try {
      // Optimistic UI update
      const newStatus = !isFavorite;
      setIsFavorite(newStatus);

      // Actual API call
      const result = await favoriteService.toggleFavorite(currentUser.id, facility.id);

      // Sync just in case
      if (result !== newStatus) {
        setIsFavorite(result);
      }
    } catch (e) {
      console.error('Failed to toggle favorite', e);
      // Revert on error
      setIsFavorite(!isFavorite);
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;

      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        if (facility.galleryImages && lightboxIndex < facility.galleryImages.length - 1) {
          setLightboxIndex(lightboxIndex + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (lightboxIndex > 0) {
          setLightboxIndex(lightboxIndex - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, facility.galleryImages]);





  return (
    <>
      {/* Lightbox Overlay */}
      {lightboxIndex !== null && facility.galleryImages && (
        <div
          className="fixed inset-0 z-[220] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 select-none"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close Button */}
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors z-20">
            <X size={28} />
          </button>

          {/* Prev Button */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors z-20"
            >
              <ChevronLeft size={40} />
            </button>
          )}

          <img
            src={facility.galleryImages[lightboxIndex]}
            alt={`Gallery ${lightboxIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next Button */}
          {lightboxIndex < facility.galleryImages.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors z-20"
            >
              <ChevronRight size={40} />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md">
            {lightboxIndex + 1} / {facility.galleryImages.length}
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-[210] bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 max-h-[90vh] h-[85vh] flex flex-col md:max-w-md md:mx-auto">
        {/* Handle for dragging (visual only) */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full cursor-pointer"></div>
        </div>

        {/* Hero Image */}
        <div className="relative h-48 shrink-0">
          <img src={facility.imageUrl} alt={facility.name} className="w-full h-full object-cover" />

          {/* Top Right Controls */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={onToggleCompare}
              className={`p-2 rounded-full text-white backdrop-blur-sm transition-colors ${isInCompareList ? 'bg-primary border-primary' : 'bg-black/30'}`}
              title={isInCompareList ? "비교함에서 제거" : "비교함에 추가"}
            >
              {isInCompareList ? <Check size={20} /> : <Scale size={20} />}
            </button>
            {facility.subscription && facility.subscription.plan && (
              <button
                onClick={() => onOpenAiChat?.()}
                className="bg-primary/20 p-2 rounded-full text-primary backdrop-blur-sm hover:bg-primary/30 transition-colors"
                title="AI 상담"
              >
                <Bot size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-black/30 p-2 rounded-full text-white backdrop-blur-sm"
            >
              <X size={20} />
            </button>
          </div>

          <div className="absolute bottom-4 left-4 text-white">
            <div className="bg-accent px-2 py-0.5 text-xs font-bold rounded mb-1 inline-block uppercase tracking-wider">
              {facility.category}
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
              {facility.isVerified && (
                <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-0.5 rounded-full shadow-lg border border-blue-400" title="업체 인증 완료">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-bold">인증됨</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Consultation Promotion / Button */}
        {facility.subscription && facility.subscription.plan && (
          <div className="px-4 py-6">
            <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${facility.subscription.plan.name_en === 'premium' || facility.subscription.plan.name_en === 'enterprise'
              ? 'bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20 shadow-sm'
              : 'bg-slate-50 border-slate-100'
              }`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${facility.subscription.plan.name_en === 'premium' || facility.subscription.plan.name_en === 'enterprise'
                    ? 'bg-primary text-white'
                    : 'bg-slate-200 text-slate-500'
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
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${facility.subscription.plan.name_en === 'premium' || facility.subscription.plan.name_en === 'enterprise'
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
          {[
            { id: 'info', label: '정보' },
            { id: 'photos', label: '사진' },
            { id: 'reviews', label: '리뷰' },
            { id: 'price', label: '가격' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-none px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => onOpenAiChat?.()}
            className={`flex-none px-6 py-3 text-sm font-bold whitespace-nowrap flex items-center gap-1 text-primary animate-pulse`}
          >
            <Bot size={16} /> AI 상담
          </button>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 no-scrollbar">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                    <Star size={16} fill="currentColor" />
                    <span className="font-bold text-black">{Math.round(facility.rating || 0)}</span>
                    <span className="text-gray-400 text-sm">({facility.reviewCount || 0}개 리뷰)</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <MapPin size={16} />
                    <span>{facility.address}</span>
                    {onViewMap && (
                      <button
                        onClick={onViewMap}
                        className="text-primary text-xs font-bold border border-primary px-2 py-0.5 rounded-full ml-1 whitespace-nowrap min-w-fit"
                      >
                        지도 보기
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleToggleFavorite}
                  className={`transition-colors ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                >
                  <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Photo Gallery Preview Section - Only show if images exist */}
              {facility.galleryImages && facility.galleryImages.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800">시설 둘러보기</h3>
                    <button
                      onClick={() => setActiveTab('photos')}
                      className="text-xs text-primary flex items-center gap-0.5 hover:underline font-medium"
                    >
                      더보기 <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
                    {facility.galleryImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`preview-${idx}`}
                        className="w-32 h-24 object-cover rounded-lg flex-none snap-start cursor-pointer hover:opacity-90 active:scale-95 transition-transform border border-gray-100"
                        onClick={() => setLightboxIndex(idx)}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-bold mb-2 text-gray-800">시설 소개</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{getSmartDescription(facility)}</p>
              </div>

              <div>
                <h3 className="font-bold mb-2 text-gray-800">편의시설 및 특징</h3>
                <div className="flex flex-wrap gap-2">
                  {getSmartFeatures(facility).map((feature, idx) => (
                    <span key={idx} className="bg-secondary text-primary px-3 py-1 rounded-full text-xs font-medium">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="text-gray-400" size={18} />
                  <span className="text-sm">{facility.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="text-gray-400" size={18} />
                  <span className="text-sm">09:00 - 18:00 (연중무휴)</span>
                </div>
              </div>

              {/* Partner Funeral Companies */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="text-amber-600" size={20} />
                  <h3 className="font-bold text-amber-900">제휴 상조 패키지 혜택</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-amber-100 mt-0.5">
                      <Gift size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-900 mb-0.5">상조 + 장지 결합 할인</p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        제휴 상조회사를 통해 방문 예약 시 <strong>분양가 5% 추가 할인</strong> 및 <strong>10만원 상당의 추모 꽃다발</strong>을 증정합니다.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      if (onViewSangjoList) {
                        onViewSangjoList();
                      }
                    }}
                    className="w-full py-2.5 bg-white border border-amber-300 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    제휴 상조회사 리스트 보기 <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <ImageIcon size={20} className="text-primary" />
                시설 갤러리
              </h3>
              {facility.galleryImages && facility.galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {facility.galleryImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`gallery-${idx}`}
                      className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer border"
                      onClick={() => setLightboxIndex(idx)}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-xl">
                  등록된 사진이 없습니다.
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <MessageSquare size={20} className="text-primary" />
                  방문자 리뷰 <span className="text-gray-400 text-sm font-normal">({facility.reviews?.length || 0})</span>
                </h3>
                <div className="text-yellow-500 font-bold text-lg">
                  ★ {Math.round(facility.rating)}
                </div>
              </div>

              {/* Review Form */}
              <div className="mb-4">
                <ReviewForm
                  spaceId={facility.id}
                  onSuccess={() => {
                    setReviewRefreshTrigger(prev => prev + 1);
                  }}
                  onLoginRequired={onLoginRequired}
                  reservations={reservations}
                />
              </div>

              <ReviewList
                spaceId={facility.id}
                refreshTrigger={reviewRefreshTrigger}
              />
            </div>
          )}

          {activeTab === 'price' && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg mb-4">
                {facility.type === 'funeral' ? '가격표' : '분양 가격표'}
              </h3>

              {facility.priceInfo && facility.priceInfo.items && facility.priceInfo.items.length > 0 ? (
                // New Detailed Price Info Rendering from Public Data
                <div className="border rounded-xl overflow-hidden text-sm">
                  <div className="bg-gray-50 flex font-bold py-2 border-b text-gray-500 text-xs text-center">
                    <div className="w-2/5 px-2">품목</div>
                    <div className="w-1/5 px-2">카테고리</div>
                    <div className="w-2/5 px-2">가격</div>
                  </div>
                  {facility.priceInfo.items.filter((p: any) => {
                    if (facility.type === 'funeral') {
                      // 용품 제외, 빈소/접객실만 포함
                      if (p.item.includes('용품') || p.category.includes('용품')) return false;
                      return p.item.includes('빈소') || p.item.includes('접객실');
                    }
                    return true;
                  }).map((p: any, idx: number) => {
                    // 가격 표시 로직 수정: price 필드의 숫자를 만원 단위로 변환
                    let displayPrice = '-';
                    const priceNum = parseInt(String(p.price).replace(/[^0-9]/g, ''));

                    // 모든 추모시설은 최소 100만원 이상이어야 유효한 가격
                    const minPriceThreshold = 1000000;

                    if (!isNaN(priceNum) && priceNum >= minPriceThreshold) {
                      const manwon = Math.round(priceNum / 10000);
                      displayPrice = `${manwon.toLocaleString()}만원`;
                    } else if (String(p.price).includes('만원')) {
                      // 이미 '만원'이 포함된 문자열이면 검증 후 표시
                      const manwonMatch = String(p.price).match(/(\d+)/);
                      if (manwonMatch) {
                        const manwonValue = parseInt(manwonMatch[1]) * 10000;
                        if (manwonValue < 1000000) {
                          displayPrice = '-';
                        } else {
                          displayPrice = p.price;
                        }
                      } else {
                        displayPrice = p.price;
                      }
                    } else if (String(p.price).includes('문의') || String(p.price).includes('상담')) {
                      displayPrice = '상담 문의';
                    } else {
                      // 그 외(최소 금액 미만 숫자 등)는 표시하지 않음
                      displayPrice = '-';
                    }

                    return (
                      <div key={idx} className="flex items-center py-3 border-b last:border-0 hover:bg-gray-50">
                        <div className="w-2/5 px-2 text-gray-800 font-medium text-center break-keep text-xs">{p.item}</div>
                        <div className="w-1/5 px-2 text-gray-400 text-[10px] text-center break-all">{(p.category === '1위 기준' ? '기본형' : p.category) || '-'}</div>
                        <div className="w-2/5 px-2 text-blue-600 text-sm text-center font-bold">
                          {displayPrice}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Legacy Prices Rendering
                facility.prices && facility.prices.length > 0 ? (
                  <div className="border rounded-xl overflow-hidden text-sm">
                    <div className="bg-gray-50 flex font-bold py-2 border-b text-gray-500 text-xs text-center">
                      <div className="w-1/3 px-2">품목</div>
                      <div className="w-1/3 px-2">상세</div>
                      <div className="w-1/3 px-2">가격</div>
                    </div>
                    {facility.prices.map((p: any, idx: number) => {
                      let displayPrice = p.price || '상담 문의';
                      // 레거시 가격 데이터도 검증 (100만원 미만 필터링)
                      const priceNum = p.price ? parseInt(String(p.price).replace(/[^0-9]/g, '')) : 0;
                      const minPriceThreshold = 1000000;

                      if (!isNaN(priceNum) && priceNum > 0 && priceNum < minPriceThreshold && !String(p.price).includes('만원')) {
                        displayPrice = '-';
                      } else if (String(p.price).includes('만원')) {
                        const manwonMatch = String(p.price).match(/(\d+)/);
                        if (manwonMatch && parseInt(manwonMatch[1]) < 100) {
                          displayPrice = '-';
                        }
                      }

                      return (
                        <div key={idx} className="flex items-center py-3 border-b last:border-0 hover:bg-gray-50">
                          <div className="w-1/3 px-2 text-gray-800 font-medium text-center text-xs">{p.item || p.type || '-'}</div>
                          <div className="w-1/3 px-2 text-gray-400 text-[10px] text-center">{(p.detail === '1위 기준' ? '기본형' : p.detail) || '-'}</div>
                          <div className="w-1/3 px-2 text-blue-600 text-sm text-center font-bold">{displayPrice}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    가격 정보가 없습니다. 상담 문의를 이용해주세요.
                  </div>
                )
              )}

              <div className="bg-yellow-50 p-3 rounded-lg text-xs text-gray-600 mt-4 leading-relaxed">
                * 상세 견적은 <strong>AI 상담</strong>을 통해 확인하실 수 있습니다.<br />
                * 실제 비용은 사용 시간과 선택 옵션에 따라 달라집니다.
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA (Hide if in AI tab to focus on chat, OR keep it?) 
            User might want to book after asking questions. Let's keep it but make it minimal or stick to standard.
            For now, keeping standard footer for all tabs.
        */}
        <div className="p-4 border-t bg-white safe-area-pb flex gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20">
          <button
            onClick={() => window.open(`https://map.naver.com/v5/search/${facility.name}`, '_blank')}
            className="flex flex-col items-center justify-center min-w-[60px] text-gray-500 hover:text-primary transition-colors"
          >
            <Navigation size={20} />
            <span className="text-[10px] mt-1 font-medium">길찾기</span>
          </button>

          {facility.naverBookingUrl && facility.naverBookingUrl.length > 10 && String(facility.id) !== '3' && (
            <button
              onClick={() => window.open(facility.naverBookingUrl, '_blank')}
              className="flex-1 bg-[#03C75A] text-white py-3 rounded-xl font-bold shadow-lg shadow-green-600/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <span className="bg-white text-[#03C75A] w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-black">N</span>
              네이버 예약
            </button>
          )}

          <button
            onClick={onBook}
            className="flex-1 bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform"
          >
            {facility.naverBookingUrl && facility.naverBookingUrl.length > 10 ? '방문 예약' : '방문 예약하기'}
          </button>
        </div>
      </div>
    </>
  );
};