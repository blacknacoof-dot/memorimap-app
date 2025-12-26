import React from 'react';
import { Reservation, Facility } from '../types';
import { X, Calendar, Clock, Users, MapPin, CreditCard } from 'lucide-react';

interface Props {
    reservation: Reservation;
    facility?: Facility;
    onClose: () => void;
    onCancel?: () => void;
}

export const ReservationDetailModal: React.FC<Props> = ({
    reservation,
    facility,
    onClose,
    onCancel
}) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="relative">
                    {facility?.imageUrl && (
                        <img
                            src={facility.imageUrl}
                            alt={facility.name}
                            className="w-full h-48 object-cover"
                        />
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{reservation.facilityName}</h2>
                    {facility && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <MapPin size={16} />
                            <span>{facility.address}</span>
                        </div>
                    )}

                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <h3 className="font-bold text-gray-900 mb-3">예약 정보</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-3">
                                <Calendar size={18} className="text-primary" />
                                <span className="font-medium">방문 날짜:</span>
                                <span>{reservation.date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock size={18} className="text-primary" />
                                <span className="font-medium">방문 시간:</span>
                                <span>{reservation.timeSlot}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Users size={18} className="text-primary" />
                                <span className="font-medium">방문 인원:</span>
                                <span>{reservation.visitorCount}명</span>
                            </div>
                        </div>
                    </div>

                    {reservation.paymentAmount > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <h3 className="font-bold text-gray-900 mb-3">결제 정보</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-3">
                                    <CreditCard size={18} className="text-primary" />
                                    <span className="font-medium">결제 금액:</span>
                                    <span className="font-bold text-primary">{reservation.paymentAmount.toLocaleString()}원</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar size={18} className="text-primary" />
                                    <span className="font-medium">결제일:</span>
                                    <span>{reservation.paidAt.toLocaleDateString('ko-KR')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {reservation.specialRequests && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <h3 className="font-bold text-gray-900 mb-2">특별 요청사항</h3>
                            <p className="text-sm text-gray-700">{reservation.specialRequests}</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                        >
                            닫기
                        </button>
                        {reservation.status === 'pending' && onCancel && (
                            <button
                                onClick={onCancel}
                                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                            >
                                예약 취소
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
