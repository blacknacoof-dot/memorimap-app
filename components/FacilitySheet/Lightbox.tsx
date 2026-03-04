import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const Lightbox: React.FC<Props> = ({ images, index, onClose, onPrev, onNext }) => (
  <div
    className="fixed inset-0 z-[220] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 select-none"
    onClick={onClose}
  >
    <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors z-20">
      <X size={28} />
    </button>

    {index > 0 && (
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors z-20"
      >
        <ChevronLeft size={40} />
      </button>
    )}

    <img
      src={images[index]}
      alt={`Gallery ${index + 1}`}
      className="max-w-full max-h-[85dvh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    />

    {index < images.length - 1 && (
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors z-20"
      >
        <ChevronRight size={40} />
      </button>
    )}

    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md">
      {index + 1} / {images.length}
    </div>
  </div>
);
