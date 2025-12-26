import React, { useState } from 'react';
import { Facility, Reservation } from '../types';
import { RESERVATION_DEPOSIT } from '../constants';
// @ts-ignore
import { format, addDays, startOfToday } from 'date-fns';
// @ts-ignore
import { ko } from 'date-fns/locale';
import { Check, X, Clock, CreditCard, AlertCircle, Loader2, Landmark, Award, Gift, Phone, PawPrint } from 'lucide-react';
import { requestPayment, PORTONE_CONFIG } from '../lib/portone';
import { FUNERAL_COMPANIES } from '../constants';

interface Props {
  facility: Facility;
  onClose: () => void;
  onConfirm: (reservation: Reservation) => void;
  reservationMode?: 'STANDARD' | 'URGENT';
}

const STEPS_STANDARD = ['날짜', '시간', '정보', '결제', '완료'];
const STEPS_URGENT = ['긴급 접수', '정보 확인', '접수 완료'];

const TIME_SLOTS = ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
const PURPOSES = ['현장 답사', '기일 추모', '분양 상담', '기타'];
const PURPOSES_PET = ['기본 장례', '화장 진행', '봉안/스톤 상담', '기타 문의'];

export const ReservationModal: React.FC<Props> = ({ facility, onClose, onConfirm, reservationMode = 'STANDARD' }) => {
  const steps = reservationMode === 'URGENT' ? STEPS_URGENT : STEPS_STANDARD;
  const [step, setStep] = useState(0);

  const isPetFacility = facility.type === 'pet';

  // Standard State
  const [date, setDate] = useState<Date | null>(reservationMode === 'URGENT' ? new Date() : null);
  const [time, setTime] = useState<string>(reservationMode === 'URGENT' ? '긴급신청' : '');

  // Shared/Urgent State
  const [visitorName, setVisitorName] = useState('');
  const [visitorCount, setVisitorCount] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [deceasedName, setDeceasedName] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');

  // Pet Specific State
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState('');
  const [petWeight, setPetWeight] = useState('');

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'TRANSFER'>('CARD');
  const [reservationType, setReservationType] = useState<'BASIC' | 'VIP' | 'CONSULTATION'>('VIP');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [funeralCompanyId, setFuneralCompanyId] = useState<string | null>(null);

  const depositAmount = reservationType === 'CONSULTATION' ? 0 : (reservationType === 'BASIC' ? 10000 : 100000);

  // Generate next 14 days
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i + 1));

  const handleUrgentSubmit = async () => {
    setIsProcessingPayment(true);
    // Simulate API call
    setTimeout(() => {
      const finalSpecialRequest = isPetFacility
        ? `[펫 긴급] 아이이름: ${petName} / 종류: ${petSpecies} / 무게: ${petWeight}kg / 위치: ${currentLocation} / 요청: ${specialRequest}`
        : `[긴급 접수] 고인명: ${deceasedName} / 현재위치: ${currentLocation} / 요청사항: ${specialRequest}`;

      const newReservation: Reservation = {
        id: `URG-${Date.now()}`,
        facilityId: facility.id,
        facilityName: facility.name,
        date: new Date(),
        timeSlot: '긴급(즉시)',
        visitorName, // Requesting Person
        visitorCount: 1,
        purpose: isPetFacility ? '반려동물 긴급 장례' : '긴급 장례 접수',
        specialRequests: finalSpecialRequest,
        status: 'urgent', // New status for urgent
        paymentAmount: 0,
        paidAt: new Date(),
        paymentId: `URGENT-${Date.now()}`,
        funeralCompanyId: undefined, // Urgent usually doesn't select provider first
      };
      onConfirm(newReservation);
      setStep(2); // Success step for Urgent
      setIsProcessingPayment(false);
    }, 1000);
  };

  const handlePayment = async () => {
    // ... (Existing Logic)
    setIsProcessingPayment(true);
    setPaymentError(null);

    // Construct Special Request with Pet Info if applicable
    let finalSpecialRequests = specialRequest;
    if (isPetFacility) {
      finalSpecialRequests = `[반려동물 정보] 이름: ${petName}, 종류: ${petSpecies}, 무게: ${petWeight}kg\n[특이사항] ${specialRequest}`;
    }

    // If Manual Transfer or Free Consultation, skip PortOne
    if (paymentMethod === 'TRANSFER' || reservationType === 'CONSULTATION') {
      setTimeout(() => { // Simulate brief network delay
        const newReservation: Reservation = {
          id: `RES-${Date.now()}`,
          facilityId: facility.id,
          facilityName: facility.name,
          date: date!,
          timeSlot: time,
          visitorName,
          visitorCount,
          purpose,
          specialRequests: finalSpecialRequests,
          status: reservationType === 'CONSULTATION' ? 'confirmed' : 'pending',
          paymentAmount: depositAmount,
          paidAt: new Date(),
          paymentId: reservationType === 'CONSULTATION' ? `FREE-${Date.now()}` : `TRANSFER-${Date.now()}`,
          funeralCompanyId: funeralCompanyId || undefined,
          funeralCompanyName: funeralCompanyId ? FUNERAL_COMPANIES.find(c => c.id === funeralCompanyId)?.name : undefined
        };
        onConfirm(newReservation);
        setStep(4);
        setIsProcessingPayment(false);
      }, 1000);
      return;
    }

    try {
      const paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const response = await requestPayment({
        storeId: PORTONE_CONFIG.STORE_ID,
        channelKey: PORTONE_CONFIG.CHANNEL_KEY,
        paymentId: paymentId,
        orderName: `${facility.name} 방문 예약금`,
        totalAmount: depositAmount,
        currency: 'CURRENCY_KRW',
        payMethod: paymentMethod,
        customer: {
          fullName: visitorName,
        }
      });

      if (response.code != null) {
        throw new Error(response.message || 'Payment failed');
      }

      // Success
      const newReservation: Reservation = {
        id: `RES-${Date.now()}`,
        facilityId: facility.id,
        facilityName: facility.name,
        date: date!,
        timeSlot: time,
        visitorName,
        visitorCount,
        purpose,
        specialRequests: finalSpecialRequests,
        status: 'pending',
        paymentAmount: depositAmount,
        paidAt: new Date(),
        paymentId: response.paymentId || paymentId,
        funeralCompanyId: funeralCompanyId || undefined,
        funeralCompanyName: funeralCompanyId ? FUNERAL_COMPANIES.find(c => c.id === funeralCompanyId)?.name : undefined
      };

      onConfirm(newReservation);
      setStep(4);
    } catch (error: any) {
      console.error('Payment Error:', error);
      setPaymentError(error.message || '결제 진행 중 오류가 발생했습니다.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const isStepValid = () => {
    if (reservationMode === 'URGENT') {
      switch (step) {
        case 0:
          if (isPetFacility) {
            return visitorName.trim().length > 0 && petName.trim().length > 0 && currentLocation.trim().length > 0;
          }
          return visitorName.trim().length > 0 && deceasedName.trim().length > 0 && currentLocation.trim().length > 0;
        case 1: return true;
        default: return false;
      }
    }

    switch (step) {
      case 0: return !!date;
      case 1: return !!time;
      case 2:
        if (isPetFacility) {
          return visitorName.trim().length > 0 && purpose.length > 0 && petName.trim().length > 0 && petWeight.trim().length > 0;
        }
        return visitorName.trim().length > 0 && purpose.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-between mb-6 px-2 pt-2">
      {steps.map((s, i) => (
        <div key={i} className={`flex flex-col items-center ${i <= step ? (isPetFacility ? 'text-purple-600' : 'text-primary') : 'text-gray-300'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border transition-colors ${i <= step ? (isPetFacility ? 'bg-purple-600 text-white border-purple-600' : 'bg-primary text-white border-primary') : 'bg-white border-gray-300'}`}>
            {i + 1}
          </div>
          <span className="text-[10px] mt-1 font-medium">{s}</span>
        </div>
      ))}
    </div>
  );

  const renderUrgentContent = () => {
    switch (step) {
      case 0: // Urgent Form
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className={`border p-4 rounded-xl flex items-start gap-3 ${isPetFacility ? 'bg-purple-50 border-purple-100' : 'bg-red-50 border-red-100'}`}>
              <AlertCircle className={`${isPetFacility ? 'text-purple-600' : 'text-red-600'} shrink-0 mt-0.5`} />
              <div className={`text-sm ${isPetFacility ? 'text-purple-800' : 'text-red-800'}`}>
                <p className="font-bold mb-1">{isPetFacility ? '반려동물 긴급 장례 접수' : '긴급 장례 접수'}</p>
                <p>{isPetFacility ? '아이의 마지막 가는 길, 픽업부터 장례까지 도와드립니다.' : '운구차나 엠뷸런스가 필요하신 경우 즉시 배차를 도와드립니다.'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isPetFacility ? '보호자님 성함' : '신청자 성함'} <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={visitorName}
                onChange={e => setVisitorName(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white text-gray-900"
                placeholder="성함을 입력해주세요"
              />
            </div>

            {isPetFacility ? (
              // PET URGENT FIELDS
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">아이 이름 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={petName}
                      onChange={e => setPetName(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-900"
                      placeholder="예: 초코"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">종류 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={petSpecies}
                      onChange={e => setPetSpecies(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-900"
                      placeholder="예: 강아지/말티즈"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">몸무게 (kg) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={petWeight}
                    onChange={e => setPetWeight(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-900"
                    placeholder="예: 3.5"
                  />
                </div>
              </>
            ) : (
              // HUMAN URGENT FIELDS
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">고인 명 (또는 위독하신 분) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={deceasedName}
                  onChange={e => setDeceasedName(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white text-gray-900"
                  placeholder="고인 또는 환자분 성함"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isPetFacility ? '현재 계신 곳 (픽업 위치)' : '현재 계신 곳 (이송 위치)'} <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={currentLocation}
                onChange={e => setCurrentLocation(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white text-gray-900"
                placeholder="예: 자택 (서울 강남구...)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">요청 사항</label>
              <textarea
                value={specialRequest}
                onChange={e => setSpecialRequest(e.target.value)}
                className="w-full p-3 border rounded-lg h-20 resize-none outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-900"
                placeholder={isPetFacility ? "예: 이동장 유무, 아이 상태 등" : "예: 운구차 필요, 검시 필요 여부 등"}
              />
            </div>
          </div>
        );
      case 1: // Confirm
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-gray-900">입력하신 정보를 확인해주세요</h3>
              <p className="text-sm text-gray-500">접수 즉시 담당자에게 알림이 전송됩니다.</p>
            </div>

            <div className="bg-gray-50 p-5 rounded-xl space-y-3 text-sm text-gray-800">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">{isPetFacility ? '보호자' : '신청자'}</span>
                <span className="font-bold">{visitorName}</span>
              </div>
              {isPetFacility ? (
                <>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">반려동물</span>
                    <span className="font-bold">{petName} ({petSpecies}, {petWeight}kg)</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">고인 명</span>
                  <span className="font-bold">{deceasedName}</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">현재 위치</span>
                <span className="font-bold">{currentLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">시설</span>
                <span className="font-bold">{facility.name}</span>
              </div>
            </div>

            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 font-medium">
              <Clock size={16} />
              정보확인 담당자가 접수후 바로 전화 드리겠습니다.
            </div>
          </div>
        );
      case 2: // Success
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Phone size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">
              긴급 접수가 완료되었습니다.
            </h3>
            <p className="text-gray-600 mb-6">
              담당자가 확인 중이며, 잠시 후<br />
              <strong>010-XXXX-XXXX</strong> 번호로 연락드립니다.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700"
            >
              확인
            </button>
          </div>
        );
      default: return null;
    }
  };

  const renderContent = () => {
    if (reservationMode === 'URGENT') return renderUrgentContent();

    switch (step) {
      case 0: // Date
        return (
          <div className="grid grid-cols-3 gap-3">
            {availableDates.map((d) => (
              <button
                key={d.toISOString()}
                onClick={() => setDate(d)}
                className={`p-3 rounded-xl border text-center transition-all ${date?.toDateString() === d.toDateString()
                  ? (isPetFacility ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-primary text-white border-primary shadow-md')
                  : 'bg-white hover:bg-gray-50 text-gray-800'
                  }`}
              >
                <div className="text-sm font-bold">{format(d, 'M.d')}</div>
                <div className={`text-xs ${date?.toDateString() === d.toDateString() ? 'text-white/80' : 'text-gray-500'}`}>
                  {format(d, 'EEEE', { locale: ko })}
                </div>
              </button>
            ))}
          </div>
        );
      case 1: // Time
        return (
          <div className="grid grid-cols-2 gap-3 min-h-[200px] content-start">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                onClick={() => setTime(t)}
                className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${time === t
                  ? (isPetFacility ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-primary text-white border-primary shadow-md')
                  : 'bg-white text-gray-800 hover:bg-gray-50'
                  }`}
              >
                <Clock size={16} className={time === t ? 'text-white' : 'text-gray-400'} />
                <span className="font-bold">{t}</span>
              </button>
            ))}
          </div>
        );
      case 2: // Info
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isPetFacility ? '보호자님 성함' : '예약자 성함'} <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={visitorName}
                onChange={e => setVisitorName(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 outline-none bg-white text-gray-900 ${isPetFacility ? 'focus:ring-purple-600' : 'focus:ring-primary'}`}
                placeholder="이름을 입력해주세요"
              />
            </div>

            {isPetFacility ? (
              // Pet Info Fields
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">아이 이름 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={petName}
                      onChange={e => setPetName(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none bg-white text-gray-900"
                      placeholder="예: 보리"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">종류 (품종) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={petSpecies}
                      onChange={e => setPetSpecies(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none bg-white text-gray-900"
                      placeholder="예: 고양이/코숏"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">몸무게 (kg) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={petWeight}
                    onChange={e => setPetWeight(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none bg-white text-gray-900"
                    placeholder="예: 3.5"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">* 몸무게에 따라 화장 비용이 달라질 수 있습니다.</p>
                </div>
              </>
            ) : (
              // Human Info Fields
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">방문 인원</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setVisitorCount(Math.max(1, visitorCount - 1))}
                    className="w-10 h-10 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
                  >
                    -
                  </button>
                  <span className="font-bold text-gray-900">{visitorCount}명</span>
                  <button
                    onClick={() => setVisitorCount(visitorCount + 1)}
                    className="w-10 h-10 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">방문 목적 <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {(isPetFacility ? PURPOSES_PET : PURPOSES).map(p => (
                  <button
                    key={p}
                    onClick={() => setPurpose(p)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${purpose === p
                      ? (isPetFacility ? 'bg-purple-600 text-white border-purple-600' : 'bg-primary text-white border-primary')
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isPetFacility ? '특이사항 (아이 상태 등)' : '특별 요청사항'}
              </label>
              <textarea
                value={specialRequest}
                onChange={e => setSpecialRequest(e.target.value)}
                className={`w-full p-3 border rounded-lg h-20 resize-none outline-none focus:ring-2 bg-white text-gray-900 ${isPetFacility ? 'focus:ring-purple-600' : 'focus:ring-primary'}`}
                placeholder={isPetFacility ? "예: 사후경직 진행 여부, 이동장 필요 등" : "휠체어 대여 필요, 안내원 동행 등"}
              />
            </div>
          </div>
        );
      case 3: // Payment
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 border">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">시설</span>
                <span className="font-medium text-gray-900">{facility.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">일시</span>
                <span className="font-medium text-gray-900">{date ? format(date, 'yyyy.MM.dd') : ''} {time}</span>
              </div>
              {isPetFacility && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">반려동물</span>
                  <span className="font-medium text-gray-900">{petName} ({petWeight}kg)</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between items-center">
                <span className="font-bold text-gray-800">예약금 결제액</span>
                <span className={`font-bold text-xl ${isPetFacility ? 'text-purple-600' : 'text-primary'}`}>{depositAmount.toLocaleString()}원</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">예약상품 선택</div>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setReservationType('BASIC')}
                  className={`p-4 border rounded-xl flex items-center justify-between transition-all ${reservationType === 'BASIC' ? (isPetFacility ? 'border-purple-600 ring-1 ring-purple-600 bg-purple-50/30' : 'border-primary ring-1 ring-primary bg-blue-50/30') : 'bg-white'}`}
                >
                  <div className="text-left">
                    <span className="block font-bold text-gray-900">실속형 (1만원)</span>
                    <span className="text-xs text-gray-500">계약 시 5% 할인 쿠폰 제공</span>
                  </div>
                  {reservationType === 'BASIC' && <Check size={20} className={isPetFacility ? "text-purple-600" : "text-primary"} />}
                </button>
                <button
                  onClick={() => setReservationType('VIP')}
                  className={`p-4 border rounded-xl flex items-center justify-between transition-all ${reservationType === 'VIP' ? (isPetFacility ? 'border-purple-600 ring-1 ring-purple-600 bg-purple-50/30' : 'border-primary ring-1 ring-primary bg-blue-50/30') : 'bg-white'}`}
                >
                  <div className="text-left">
                    <span className="block font-bold text-gray-900">VIP 프리미엄 (10만원)</span>
                    <span className="text-xs text-gray-500">5% 할인 + 추모 꽃다발 + 2년 관리비 면제</span>
                  </div>
                  {reservationType === 'VIP' && <Check size={20} className={isPetFacility ? "text-purple-600" : "text-primary"} />}
                </button>
                <button
                  onClick={() => setReservationType('CONSULTATION')}
                  className={`p-4 border rounded-xl flex items-center justify-between transition-all ${reservationType === 'CONSULTATION' ? (isPetFacility ? 'border-purple-600 ring-1 ring-purple-600 bg-purple-50/30' : 'border-primary ring-1 ring-primary bg-blue-50/30') : 'bg-white'}`}
                >
                  <div className="text-left">
                    <span className="block font-bold text-gray-900">무료 믿음 상담 (0원)</span>
                    <span className="text-xs text-gray-500">전문 상담사가 직접 찾아뵙거나 유선 상담</span>
                  </div>
                  {reservationType === 'CONSULTATION' && <Check size={20} className={isPetFacility ? "text-purple-600" : "text-primary"} />}
                </button>
              </div>
            </div>

            {/* Payment Method & Info Omitted for brevity, logic follows same pattern */}
            {/* Keeping existing payment UI but updating color conditionally if I could, but for now functionality is key */}

            <div className={`p-4 rounded-xl border ${isPetFacility ? 'bg-purple-50 border-purple-100' : 'bg-blue-50 border-blue-100'}`}>
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle size={16} className={`${isPetFacility ? 'text-purple-600' : 'text-blue-600'} mt-0.5`} />
                <span className={`font-bold text-sm ${isPetFacility ? 'text-purple-800' : 'text-blue-800'} animate-pulse`}>
                  {reservationType === 'CONSULTATION' ? '무료 상담 안내' : (paymentMethod === 'CARD' ? '테스트 결제 안내' : (reservationType === 'BASIC' ? '실속형 안내' : 'VIP 프리미엄 안내'))}
                </span>
              </div>
              <ul className={`text-xs ${isPetFacility ? 'text-purple-700' : 'text-blue-700'} space-y-1.5 list-disc list-inside ml-1`}>
                {paymentMethod === 'CARD' ? (
                  <li>현재 테스트 모드입니다. 실제 비용이 청구되지 않습니다.</li>
                ) : (
                  <li>입금 확인 후 예약 확정 문자가 발송됩니다.</li>
                )}

                {reservationType === 'BASIC' ? (
                  <>
                    <li><strong>혜택:</strong> 계약 시 5% 할인 쿠폰 제공</li>
                    <li><strong>환불:</strong> 예약일 3일 전 취소 시 100% 환불</li>
                  </>
                ) : (
                  <>
                    <li><strong>VIP 혜택:</strong> 5% 할인 + 추모 꽃다발 + 2년 관리비 면제</li>
                    <li><strong>계약 시:</strong> 예약금 10만원 전액 공제</li>
                    <li><strong>미계약 시:</strong> 100% 환불 (서비스 이용료 없음)</li>
                  </>
                )}
                {reservationType === 'CONSULTATION' && (
                  <>
                    <li><strong>혜택:</strong> 장지 전문가 무료 1:1 상담 진행</li>
                    <li><strong>비용:</strong> 전액 무료 (부담 없이 상담하세요)</li>
                  </>
                )}
              </ul>
            </div>

            {reservationType !== 'CONSULTATION' && (
              <div className="space-y-3 mt-4">
                <div className="text-sm font-medium text-gray-700">결제 수단 선택</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-all ${paymentMethod === 'CARD' ? (isPetFacility ? 'border-purple-600 ring-1 ring-purple-600 bg-purple-50/30' : 'border-primary ring-1 ring-primary bg-blue-50/30') : 'bg-white'}`}
                  >
                    <CreditCard className={paymentMethod === 'CARD' ? (isPetFacility ? "text-purple-600" : "text-primary") : "text-gray-400"} />
                    <span className={`text-sm font-bold ${paymentMethod === 'CARD' ? (isPetFacility ? "text-purple-600" : "text-primary") : "text-gray-600"}`}>신용/체크카드</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('TRANSFER')}
                    className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-all ${paymentMethod === 'TRANSFER' ? (isPetFacility ? 'border-purple-600 ring-1 ring-purple-600 bg-purple-50/30' : 'border-primary ring-1 ring-primary bg-blue-50/30') : 'bg-white'}`}
                  >
                    <Landmark className={paymentMethod === 'TRANSFER' ? (isPetFacility ? "text-purple-600" : "text-primary") : "text-gray-400"} />
                    <span className={`text-sm font-bold ${paymentMethod === 'TRANSFER' ? (isPetFacility ? "text-purple-600" : "text-primary") : "text-gray-600"}`}>무통장 입금</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bank Transfer Info */}
            {paymentMethod === 'TRANSFER' && reservationType !== 'CONSULTATION' && (
              <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2 mt-4">
                <h4 className="text-sm font-bold text-gray-700 mb-2">입금 계좌 안내</h4>
                <div className="flex flex-col gap-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>은행명</span>
                    <span className="font-medium text-gray-900">농협은행</span>
                  </div>
                  <div className="flex justify-between">
                    <span>계좌번호</span>
                    <span className="font-family-mono font-medium text-gray-900 tracking-wider">301-3323-2232</span>
                  </div>
                  <div className="flex justify-between">
                    <span>예금주</span>
                    <span className="font-medium text-gray-900">추모맵 (김하늘)</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-red-500 bg-red-50 p-2 rounded">
                  * 예약자명과 입금자명이 동일해야 확인이 가능합니다.
                </div>
              </div>
            )}

            {paymentError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 mt-4">
                <AlertCircle size={16} />
                {paymentError}
              </div>
            )}

          </div>
        );
      case 4: // Success
        return (
          <div className="text-center py-8">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isPetFacility ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
              {isPetFacility ? <PawPrint size={32} /> : <Check size={32} />}
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">
              {reservationType === 'CONSULTATION' ? '무료 상담 신청이 완료되었습니다!' : '예약 신청이 완료되었습니다!'}
            </h3>
            <p className="text-gray-600 mb-6">
              {reservationType === 'CONSULTATION'
                ? '담당자가 곧 연락드리겠습니다.'
                : '시설 관리자 승인 후 예약이 확정됩니다.'}
            </p>
            <button
              onClick={onClose}
              className={`w-full text-white py-3 rounded-xl font-bold hover:bg-opacity-90 ${isPetFacility ? 'bg-purple-600' : 'bg-primary'}`}
            >
              확인
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  if (step === 4) {
    return (
      <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90dvh] h-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {isPetFacility && <PawPrint size={18} className="text-purple-600" />}
            <h2 className="text-lg font-bold text-gray-900">
              {reservationMode === 'URGENT'
                ? (isPetFacility ? '반려동물 긴급 장례 접수' : '긴급 예약 접수')
                : (isPetFacility ? '반려동물 장례 예약' : '방문 예약')}
            </h2>
          </div>
          <button onClick={onClose} disabled={isProcessingPayment} className="p-1 hover:bg-gray-100 rounded-full">
            <X className={`text-gray-500 ${isProcessingPayment ? 'opacity-50' : ''}`} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 relative bg-white">
          {isProcessingPayment && (
            <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
              {/* Overlay loader */}
            </div>
          )}
          {renderStepIndicator()}
          {renderContent()}
        </div>

        {/* Footer Actions */}
        <div className="p-4 pb-8 sm:pb-4 border-t bg-white z-50 sticky bottom-0">
          {isProcessingPayment ? (
            <button disabled className="w-full bg-gray-400 text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 cursor-not-allowed">
              <Loader2 className="animate-spin" size={20} />
              결제 처리 중...
            </button>
          ) : (
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                >
                  이전
                </button>
              )}
              <button
                onClick={() => {
                  if (reservationMode === 'URGENT') {
                    if (step === 1) handleUrgentSubmit();
                    else setStep(step + 1);
                  } else {
                    if (step === 3) handlePayment();
                    else setStep(step + 1);
                  }
                }}
                disabled={!isStepValid()}
                className={`flex-1 py-3.5 rounded-xl font-bold transition-all transform active:scale-[0.98] ${isStepValid()
                  ? (reservationMode === 'URGENT'
                    ? (isPetFacility ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-red-600 text-white shadow-lg shadow-red-600/30')
                    : (isPetFacility ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-primary text-white shadow-lg shadow-primary/30'))
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {reservationMode === 'URGENT'
                  ? (step === 1 ? '긴급 접수 완료' : '다음')
                  : (step === 3
                    ? (reservationType === 'CONSULTATION' ? '무료 상담 신청하기' : (paymentMethod === 'TRANSFER' ? '입금 확인 요청' : `${depositAmount.toLocaleString()}원 결제하기`))
                    : '다음')
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};