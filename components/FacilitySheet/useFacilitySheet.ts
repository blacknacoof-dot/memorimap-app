import { useState, useEffect } from 'react';
import { Facility } from '../../types';
import { favoriteService } from '../../services/favoriteService';
import { supabase, getAuthClient } from '../../lib/supabaseClient';
import { useSession } from '../../lib/auth';
import { toast } from 'sonner';
import { logger } from '../../utils/logger';
import { useQuotaGate } from '../../hooks/useQuotaGate';

export type ActiveSheetTab = 'info' | 'photos' | 'reviews' | 'price' | 'ai';

export interface DbPackage {
  id: string;
  name: string;
  price: number;
  items?: string[];
  description?: string;
  sort_order?: number;
  is_active?: boolean;
  category?: string;
  price_label?: string;
  included_items?: string[];
}

interface UseFacilitySheetProps {
  facility: Facility;
  isLoggedIn: boolean;
  currentUser: { id: string; name: string } | null;
  onLoginRequired: () => void;
}

export function useFacilitySheet({ facility, isLoggedIn, currentUser, onLoginRequired }: UseFacilitySheetProps) {
  const [activeTab, setActiveTab] = useState<ActiveSheetTab>('info');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [dbPackages, setDbPackages] = useState<DbPackage[]>([]);
  const { session } = useSession();
  const { checkQuota, decrementFavorite } = useQuotaGate();
  const isFacilityUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facility.id);

  // Load facility_packages from DB
  useEffect(() => {
    const loadPackages = async () => {
      if (!isFacilityUuid) {
        setDbPackages([]);
        return;
      }

      const { data } = await supabase
        .from('facility_packages')
        .select('*')
        .eq('facility_id', facility.id)
        .eq('is_active', true)
        .order('sort_order');
      if (data && data.length > 0) setDbPackages(data);
    };
    loadPackages();
  }, [facility.id, isFacilityUuid]);

  // Check Favorite Status
  useEffect(() => {
    const checkFav = async () => {
      if (!isFacilityUuid) {
        setIsFavorite(false);
        return;
      }

      if (isLoggedIn && currentUser?.id && session) {
        try {
          const client = await getAuthClient(session, { strict: true });
          const status = await favoriteService.checkFavorite(currentUser.id, facility.id, client);
          setIsFavorite(status);
        } catch (error: unknown) {
          logger.error('Failed to check favorite status in facility detail', {
            facilityId: facility.id,
            userId: currentUser.id,
            error,
          });
          toast.error('利먭꺼李얘린 ?곹깭瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲?? ?좎떆 ???ㅼ떆 ?쒕룄?섍퀬, 諛섎났?섎㈃ 怨좉컼?쇳꽣濡?臾몄쓽??二쇱꽭??');
          setIsFavorite(false);
        }
      } else {
        setIsFavorite(false);
      }
    };
    checkFav();
  }, [facility.id, isFacilityUuid, isLoggedIn, currentUser, session]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') { setLightboxIndex(null); }
      else if (e.key === 'ArrowRight' && facility.galleryImages && lightboxIndex < facility.galleryImages.length - 1) {
        setLightboxIndex(lightboxIndex + 1);
      } else if (e.key === 'ArrowLeft' && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, facility.galleryImages]);

  const handleToggleFavorite = async () => {
    if (!isLoggedIn || !currentUser) { onLoginRequired(); return; }
    if (!isFacilityUuid) {
      toast.error('시설 상세 정보가 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    let quotaIncremented = false;
    try {
      const newStatus = !isFavorite;
      setIsFavorite(newStatus);
      if (newStatus) {
        const quota = await checkQuota('favorite', 'facility');
        if (!quota.allowed) {
          toast.error('즐겨찾기 한도에 도달했습니다.');
          setIsFavorite(false);
          return;
        }
        quotaIncremented = true;
      }
      const client = await getAuthClient(session, { strict: true });
      const result = await favoriteService.toggleFavorite(currentUser.id, facility.id, client);
      if (!result) {
        await decrementFavorite(false);
      }
      if (result !== newStatus) setIsFavorite(result);
    } catch (error: unknown) {
      if (quotaIncremented) {
        await decrementFavorite(false);
      }
      logger.error('Failed to toggle favorite in facility detail', {
        facilityId: facility.id,
        userId: currentUser.id,
        error,
      });
      toast.error('利먭꺼李얘린 蹂寃쎌뿉 ?ㅽ뙣?덉뒿?덈떎.');
      setIsFavorite(!isFavorite);
    }
  };

  return {
    activeTab, setActiveTab,
    lightboxIndex, setLightboxIndex,
    reviewRefreshTrigger, setReviewRefreshTrigger,
    isFavorite,
    dbPackages,
    handleToggleFavorite,
  };
}
