import React from 'react';
import { ImageIcon } from 'lucide-react';
import {
  getSangjoRepresentativeImage,
  SANGJO_REPRESENTATIVE_PLACEHOLDER,
} from '../../lib/sangjoImage';

interface SangjoImageProps {
  imageUrl?: string | null;
  alt: string;
  companyName?: string;
  wrapperClassName: string;
  imgClassName?: string;
}

export const SangjoImage: React.FC<SangjoImageProps> = ({
  imageUrl,
  alt,
  companyName,
  wrapperClassName,
  imgClassName = 'w-full h-full object-cover',
}) => {
  const representativeSrc = getSangjoRepresentativeImage({ companyName: companyName || alt, imageUrl });
  const [currentSrc, setCurrentSrc] = React.useState(representativeSrc);
  const [showPlaceholder, setShowPlaceholder] = React.useState(false);

  React.useEffect(() => {
    setCurrentSrc(representativeSrc);
    setShowPlaceholder(false);
  }, [representativeSrc]);

  const handleError = () => {
    if (currentSrc !== SANGJO_REPRESENTATIVE_PLACEHOLDER) {
      setCurrentSrc(SANGJO_REPRESENTATIVE_PLACEHOLDER);
      return;
    }
    setShowPlaceholder(true);
  };

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${wrapperClassName}`} aria-label={alt}>
      {!showPlaceholder ? (
        <img
          src={currentSrc}
          alt=""
          className={imgClassName}
          onError={handleError}
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-300">
          <ImageIcon size={20} aria-hidden="true" />
        </div>
      )}
    </div>
  );
};
