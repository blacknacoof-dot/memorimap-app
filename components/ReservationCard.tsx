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
        <div className="bg-white border rounded-xl p-3 hover:shadow-md transition-shadow overflow-hidden">
            <div className="flex justify-between items-center mb-2 gap-2">
                <h3 className="font-bold text-xs text-gray-900 truncate">{reservation.facility_name}</h3>
                {getStatusBadge(reservation.status)}
            </div>

            <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-primary flex-shrink-0" />
                    <span>{new Date(reservation.visit_date).toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-primary flex-shrink-0" />
                    <span>{reservation.time_slot}</span>
                </div>
                {reservation.visitor_name && (
                    <div className="flex items-center gap-1.5">
                        <Users size={13} className="text-primary flex-shrink-0" />
                        <span>{reservation.visitor_name} · {reservation.visitor_count}명</span>
                    </div>
                )}
                {reservation.purpose && (
                    <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-primary flex-shrink-0" />
                        <span className="truncate">
                            {reservation.purpose === 'funeral' ? '장례' :
                             reservation.purpose === 'pet' ? '반려동물' :
                             reservation.purpose === 'memorial' ? '추모' : reservation.purpose}
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-2.5 pt-2.5 border-t flex gap-1.5">
                <button
                    onClick={() => onViewDetails(reservation)}
                    className="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
                >
                    상세보기
                </button>

                {(reservation.status === 'pending' || reservation.status === 'urgent') && onCancel && (
                    <button
                        onClick={() => reservation.id && onCancel(reservation.id)}
                        className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors"
                    >
                        취소
                    </button>
                )}

                {reservation.status === 'confirmed' && onWriteReview && (
                    <button
                        onClick={() => onWriteReview(String(reservation.facility_id))}
                        className="py-1.5 px-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-medium transition-colors"
                    >
                        리뷰
                    </button>
                )}
            </div>
        </div>
    );
};
