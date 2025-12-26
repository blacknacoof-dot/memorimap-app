import React from 'react';
import { Reservation } from '../types';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';

interface Props {
    reservation: Reservation;
    onViewDetails: (reservation: Reservation) => void;
    onCancel?: (reservationId: string) => void;
    onWriteReview?: (facilityId: string) => void;
}

export const ReservationCard: React.FC<Props> = ({
    reservation,
    onViewDetails,
    onCancel,
    onWriteReview
}) => {
    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-green-100 text-green-800',
            cancelled: 'bg-gray-100 text-gray-600',
            urgent: 'bg-red-100 text-red-800 animate-pulse border border-red-200 shadow-sm'
        };
        const labels = {
            pending: '예정중',
            confirmed: '확정',
            cancelled: '취소됨',
            urgent: '🚨 긴급접수'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status as keyof typeof styles]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    return (
        <div className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-gray-900">{reservation.facilityName}</h3>
                {getStatusBadge(reservation.status)}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-primary" />
                    <span>{reservation.date.toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-primary" />
                    <span>{reservation.timeSlot}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Users size={16} className="text-primary" />
                    <span>{reservation.visitorCount}명</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t flex gap-2">
                <button
                    onClick={() => onViewDetails(reservation)}
                    className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                    상세보기
                </button>

                {(reservation.status === 'pending' || reservation.status === 'urgent') && onCancel && (
                    <button
                        onClick={() => onCancel(reservation.id)}
                        className="py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                    >
                        취소하기
                    </button>
                )}

                {reservation.status === 'confirmed' && onWriteReview && (
                    <button
                        onClick={() => onWriteReview(reservation.facilityId)}
                        className="py-2 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                    >
                        리뷰 작성
                    </button>
                )}
            </div>
        </div>
    );
};
