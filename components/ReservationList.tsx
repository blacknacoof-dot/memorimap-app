import React from 'react';
import { Reservation } from '../types';
import { ReservationCard } from './ReservationCard';

interface Props {
    reservations: Reservation[];
    onViewDetails: (reservation: Reservation) => void;
    onCancel?: (reservationId: string) => void;
    onWriteReview?: (facilityId: string) => void;
    emptyMessage?: string;
    emptyIcon?: React.ReactNode;
}

export const ReservationList: React.FC<Props> = ({
    reservations,
    onViewDetails,
    onCancel,
    onWriteReview,
    emptyMessage = '예약 내역이 없습니다.',
    emptyIcon,
}) => {
    if (reservations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-xl border border-dashed">
                {emptyIcon}
                <p className="text-sm">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {reservations.map(reservation => (
                <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    onViewDetails={onViewDetails}
                    onCancel={onCancel}
                    onWriteReview={onWriteReview}
                />
            ))}
        </div>
    );
};
