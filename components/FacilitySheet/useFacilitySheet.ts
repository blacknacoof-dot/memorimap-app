import { useState, useEffect } from 'react';
import { Facility } from '../../types';
import { favoriteService } from '../../services/favoriteService';
import { supabase, getAuthClient } from '../../lib/supabaseClient';
import { useSession } from '../../lib/auth';
import { toast } from 'sonner';

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

  // Load facility_packages from DB
  useEffect(() => {
    const loadPackages = async () => {
      const { data } = await supabase
        .from('facility_packages')
        .select('*')
        .eq('facility_id', facility.id)
        .eq('is_active', true)
        .order('sort_order');
      if (data && data.length > 0) setDbPackages(data);
    };
    loadPackages();
  }, [facility.id]);

  // Check Favorite Status
  useEffect(() => {
    const checkFav = async () => {
      if (isLoggedIn && currentUser?.id && session) {
        try {
          const client = await getAuthClient(session, { strict: true });
          const status = await favoriteService.checkFavorite(currentUser.id, facility.id, client);
          setIsFavorite(status);
        } catch (e) {
          // silent
        }
      } else {
        setIsFavorite(false);
      }
    };
    checkFav();
  }, [facility.id, isLoggedIn, currentUser, session]);

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
    try {
      const newStatus = !isFavorite;
      setIsFavorite(newStatus);
      const client = await getAuthClient(session, { strict: true });
      const result = await favoriteService.toggleFavorite(currentUser.id, facility.id, client);
      if (result !== newStatus) setIsFavorite(result);
    } catch {
      toast.error('즐겨찾기 변경에 실패했습니다.');
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
