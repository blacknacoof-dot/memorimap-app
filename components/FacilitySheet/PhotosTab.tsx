import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface Props {
  images?: string[];
  onLightboxOpen: (index: number) => void;
}

export const PhotosTab: React.FC<Props> = ({ images, onLightboxOpen }) => (
  <div className="space-y-4">
    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
      <ImageIcon size={20} className="text-primary" />
      시설 갤러리
    </h3>
    {images && images.length > 0 ? (
      <div className="grid grid-cols-2 gap-2">
        {images.map((img, idx) => (
          <img
            key={idx} src={img} alt={`gallery-${idx}`}
            className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer border"
            onClick={() => onLightboxOpen(idx)}
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
);
