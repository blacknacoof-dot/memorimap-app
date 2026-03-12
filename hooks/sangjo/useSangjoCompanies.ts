/**
 * DB-First 상조 업체 로딩 훅
 * 1차: funeral_companies DB 조회
 * 2차 폴백: FUNERAL_COMPANIES 상수
 */
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FUNERAL_COMPANIES } from '../../data/sangjoCompanyDefaults';
import { generateDefaultReviews } from '../../types/sangjo';
import type { FuneralCompany, Review } from '../../types';
import { toast } from 'sonner';

// 갤러리 이미지 풀
const ALL_SANGJO_GALLERY = Array.from({ length: 19 }, (_, i) =>
  `/images/sangjo/gallery/sangjo_gallery_${i + 1}.jpg`
);

function pickRandomGallery(companyIndex: number): string[] {
  const shuffled = [...ALL_SANGJO_GALLERY].sort((a, b) => {
    const ha = (companyIndex * 7 + a.charCodeAt(a.length - 5)) % 19;
    const hb = (companyIndex * 7 + b.charCodeAt(b.length - 5)) % 19;
    return ha - hb;
  });
  return shuffled.slice(0, 4);
}

function buildProducts(min: number, max: number) {
  const mid = Math.round((min + max) / 2 / 10000) * 10000;
  return [
    {
      id: '1', name: `실속형 (${min / 10000}만)`, price: min,
      description: '합리적인 가격으로 꼭 필요한 서비스만 담은 실속 상품',
      tagline: '합리적인 선택',
      serviceDetails: [
        { category: '인력', items: ['의전관리사 4명', '장례지도사 1명'] },
        { category: '용품', items: ['오동나무 1단 관', '기본 수의'] },
        { category: '차량', items: ['운구차량 200km'] }
      ],
      includedServices: ['의전관리사 4명', '장례지도사 1명', '오동나무 1단 관', '기본 수의', '운구차량 200km'],
      optionalServices: [],
    },
    {
      id: '2', name: `표준형 (${mid / 10000}만)`, price: mid,
      description: '가장 많은 고객님이 선택하시는 표준 의전 프로그램',
      tagline: '격조 높은 의전',
      serviceDetails: [
        { category: '인력', items: ['의전관리사 6명', '장례지도사 2명'] },
        { category: '용품', items: ['솔송나무 2단 관', '특수 면수의'] },
        { category: '차량', items: ['리무진 및 버스 왕복 400km'] }
      ],
      includedServices: ['의전관리사 6명', '장례지도사 2명', '솔송나무 2단 관', '특수 면수의', '리무진 및 버스 왕복 400km'],
      optionalServices: [],
    },
    {
      id: '3', name: `고급형 (${max / 10000}만)`, price: max,
      description: '최고급 의전과 프리미엄 서비스를 제공하는 VIP 상품',
      tagline: '최상의 품격',
      serviceDetails: [
        { category: '인력', items: ['의전관리사 8명', '장례지도사 3명', '전담 코디네이터'] },
        { category: '용품', items: ['프리미엄 편백관', '최고급 실크수의'] },
        { category: '차량', items: ['VIP 리무진 및 대형버스 전국'] }
      ],
      includedServices: ['의전관리사 8명', '장례지도사 3명', '전담 코디네이터', '프리미엄 편백관', '최고급 실크수의', 'VIP 리무진 및 대형버스 전국'],
      optionalServices: [],
    }
  ];
}

function parseProducts(item: Record<string, unknown>, staticMatch: FuneralCompany | undefined) {
  const range = (item.price_range as string) || staticMatch?.priceRange || '';
  const match = range.match(/(\d+)~(\d+,?\d*)/);
  const singleMatch = !match && range.match(/(\d+)만?원?~/);

  if (match) {
    return buildProducts(parseInt(match[1].replace(/,/g, '')) * 10000, parseInt(match[2].replace(/,/g, '')) * 10000);
  }
  if (singleMatch) {
    const minPrice = parseInt(singleMatch[1]) * 10000;
    return buildProducts(minPrice, minPrice * 3);
  }
  return buildProducts(2000000, 8000000);
}

interface DbRow {
  id: string;
  name: string;
  rating?: number;
  review_count?: number;
  image_url?: string;
  description?: string;
  features?: string[];
  phone?: string;
  contact?: string;
  priceRange?: string;
  price_range?: string;
  benefits?: string[];
  gallery_images?: string[];
  images?: string[];
  [key: string]: unknown;
}

export function useSangjoCompanies() {
  const [companies, setCompanies] = useState<FuneralCompany[]>(FUNERAL_COMPANIES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('funeral_companies')
          .select('*')
          .order('id', { ascending: true });

        if (dbError) throw dbError;
        if (!data || data.length === 0) {
          setCompanies(FUNERAL_COMPANIES);
          return;
        }

        // 전체 리뷰 일괄 조회
        const companyIds = data.map((item: DbRow) => item.id);
        const staticIds = data.map((item: DbRow) => {
          const match = FUNERAL_COMPANIES.find(c => c.name.replace(/\s/g, '') === item.name.replace(/\s/g, ''));
          return match?.id;
        }).filter(Boolean) as string[];
        const allTargetIds = Array.from(new Set([...companyIds, ...staticIds]));

        const { data: allReviews } = await supabase
          .from('facility_reviews')
          .select('*')
          .in('facility_id', allTargetIds)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        // 리뷰 그룹핑
        const reviewsByCompany = new Map<string, Array<Record<string, unknown>>>();
        allReviews?.forEach((review: Record<string, unknown>) => {
          const cid = String(review.facility_id ?? '').trim();
          if (cid) {
            if (!reviewsByCompany.has(cid)) reviewsByCompany.set(cid, []);
            reviewsByCompany.get(cid)!.push(review);
          }
        });

        const mapped: FuneralCompany[] = data.map((item: DbRow, idx: number) => {
          const staticMatch = FUNERAL_COMPANIES.find(c => c.name.replace(/\s/g, '') === item.name.replace(/\s/g, ''));
          const dbId = item.id.toString().trim();
          const staticId = staticMatch?.id?.toString().trim();
          const reviews = [
            ...(reviewsByCompany.get(dbId) || []),
            ...(staticId ? (reviewsByCompany.get(staticId) || []) : [])
          ];
          const uniqueReviews = Array.from(new Map(reviews.map(r => [r.id, r])).values());

          const products = (staticMatch?.products && staticMatch.products.length > 0)
            ? staticMatch.products
            : parseProducts(item as Record<string, unknown>, staticMatch);

          const galleryImages = (item.gallery_images && item.gallery_images.length > 0)
            ? item.gallery_images
            : (item.images && item.images.length > 0)
              ? item.images
              : [staticMatch?.imageUrl || item.image_url || '/images/default_sangjo.png', ...pickRandomGallery(idx)];

          const dbReviews: Review[] = uniqueReviews.map(r => ({
            id: String(r.id),
            userId: String(r.user_id || ''),
            user_id: String(r.user_id || ''),
            userName: String(r.user_name || r.userName || '익명'),
            facility_id: r.facility_id as string,
            rating: (r.rating as number) || 5,
            content: String(r.content || ''),
            images: (r.images as string[]) || [],
            created_at: r.created_at as string,
            date: (() => {
              try {
                if (r.created_at) {
                  const d = new Date(r.created_at as string);
                  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
                }
              } catch { /* ignore */ }
              return '최근';
            })(),
          }));

          return {
            id: item.id.toString(),
            name: item.name,
            rating: item.rating || 4.8,
            reviewCount: item.review_count || uniqueReviews.length || 5,
            imageUrl: staticMatch?.imageUrl || item.image_url || '/images/default_sangjo.png',
            description: item.description || staticMatch?.description || `${item.name}의 프리미엄 상조 서비스입니다.`,
            features: (item.features && item.features.length > 0) ? item.features : (staticMatch?.features || ['전국 의전망', '24시간 상담']),
            phone: item.phone || item.contact || '1588-0000',
            priceRange: item.priceRange || '문의',
            benefits: item.benefits || ['회원 전용 혜택'],
            galleryImages,
            products,
            reviews: dbReviews.length > 0 ? dbReviews : generateDefaultReviews(item.id.toString()),
          };
        });

        // FUNERAL_COMPANIES 순서 유지
        mapped.sort((a, b) => {
          const idxA = FUNERAL_COMPANIES.findIndex(fc => fc.name.replace(/\s/g, '') === a.name.replace(/\s/g, ''));
          const idxB = FUNERAL_COMPANIES.findIndex(fc => fc.name.replace(/\s/g, '') === b.name.replace(/\s/g, ''));
          return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        });

        setCompanies(mapped);
      } catch (_err) {
        setError('상조 업체 목록을 불러오지 못했습니다.');
        toast.error('상조 업체 목록을 불러오지 못했습니다.');
        setCompanies(FUNERAL_COMPANIES);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  return { companies, isLoading, error };
}
