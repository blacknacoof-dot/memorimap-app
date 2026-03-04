import React from 'react';
import { format } from 'date-fns';
import type { FieldError } from 'react-hook-form';

interface Props {
  availableDates: Date[];
  selectedDate: string;
  onSelect: (date: Date) => void;
  error?: FieldError;
  isPetFacility: boolean;
}

export const StepDate: React.FC<Props> = ({ availableDates, selectedDate, onSelect, error, isPetFacility }) => (
  <div className="grid grid-cols-3 gap-3">
    {availableDates.map((d) => {
      const dateStr = format(d, 'yyyy-MM-dd');
      const isSelected = selectedDate === dateStr;
      return (
        <button
          key={dateStr}
          onClick={() => onSelect(d)}
          className={`p-3 rounded-xl border text-center transition-all ${
            isSelected
              ? (isPetFacility ? 'bg-purple-600 text-white' : 'bg-primary text-white')
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="text-sm font-bold">{format(d, 'M.d')}</div>
          <div className="text-xs">{d.toLocaleDateString('ko-KR', { weekday: 'long' })}</div>
        </button>
      );
    })}
    {error && <p className="col-span-3 text-red-500 text-xs text-center">{error.message}</p>}
  </div>
);
