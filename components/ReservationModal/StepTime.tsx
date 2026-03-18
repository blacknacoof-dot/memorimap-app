import React from 'react';
import { Clock } from 'lucide-react';
import type { FieldError } from 'react-hook-form';

const TIME_SLOTS = ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

interface Props {
  selectedTime: string;
  onSelect: (time: string) => void;
  error?: FieldError;
  isPetFacility: boolean;
}

export const StepTime: React.FC<Props> = ({ selectedTime, onSelect, error, isPetFacility }) => (
  <div className="grid grid-cols-2 gap-3">
    {TIME_SLOTS.map((t) => (
      <button
        key={t}
        onClick={() => onSelect(t)}
        data-testid={`reservation-time-${t.replace(':', '-')}`}
        className={`p-4 rounded-xl border flex items-center justify-center gap-2 ${
          selectedTime === t
            ? (isPetFacility ? 'bg-purple-600 text-white' : 'bg-primary text-white')
            : 'bg-white hover:bg-gray-50'
        }`}
      >
        <Clock size={16} /> <span>{t}</span>
      </button>
    ))}
    {error && <p className="col-span-2 text-red-500 text-xs text-center">{error.message}</p>}
  </div>
);
