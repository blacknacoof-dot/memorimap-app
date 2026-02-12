/**
 * useCompanySelect - App.tsx에서 추출한 상조 회사 선택 Hook
 * Phase 4-3: selectedFuneralCompany, showSangjoAIConsult, showSangjoContract, handleCompanySelect
 */
import React, { useState, useCallback } from 'react';
import { Facility, FuneralCompany } from '../types';
import { supabase } from '../lib/supabaseClient';

interface UseCompanySelectParams {
  facilities: Facility[];
}

export function useCompanySelect({ facilities }: UseCompanySelectParams) {
  const [selectedFuneralCompany, setSelectedFuneralCompany] = useState<FuneralCompany | null>(null);
  const [showSangjoAIConsult, setShowSangjoAIConsult] = useState(false);
  const [showSangjoContract, setShowSangjoContract] = useState(false);

  const handleCompanySelect = useCallback(async (company: FuneralCompany, startChat?: boolean) => {
    let productData = company.products;
    let reviewData: any[] = [];

    const relatedFacility = facilities.find(f => f.name === company.name && f.type === 'sangjo');
    let searchId: string | number | null = null;

    if (relatedFacility && relatedFacility.id) {
      searchId = relatedFacility.id;
    } else if (company.id && !company.id.startsWith('fc_')) {
      searchId = company.id;
    }

    if (searchId) {
      const searchIdStr = searchId.toString();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchIdStr);

      let uuid: string | null = null;
      let legacyId: number | null = null;

      if (isUuid) {
        uuid = searchIdStr;
        const { data: facData } = await supabase
          .from('facilities')
          .select('legacy_id')
          .eq('id', uuid)
          .maybeSingle();

        if (facData && facData.legacy_id) {
          const parsed = parseInt(facData.legacy_id, 10);
          if (!isNaN(parsed)) legacyId = parsed;
        }
      } else {
        const parsed = parseInt(searchIdStr, 10);
        if (!isNaN(parsed)) {
          legacyId = parsed;
          const { data: facData } = await supabase
            .from('facilities')
            .select('id')
            .eq('legacy_id', searchIdStr)
            .maybeSingle();
          if (facData) uuid = facData.id;
        }
      }

      // 1. Fetch Products from 'memorial_spaces' (Requires Integer ID)
      if (legacyId) {
        const { data } = await supabase
          .from('memorial_spaces')
          .select('price_info')
          .eq('id', legacyId)
          .maybeSingle();

        if (data && data.price_info && data.price_info.products) {
          productData = data.price_info.products;
        }
      }

      // 2. Fetch Reviews from 'facility_reviews' (Requires UUID)
      if (uuid) {
        const { data: reviews } = await supabase
          .from('facility_reviews')
          .select('*')
          .eq('facility_id', uuid)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (reviews) {
          reviewData = reviews;
        }
      }
    } else {
      // Fallback: Fetch ID by name to get reviews
      try {
        const { data } = await supabase
          .from('memorial_spaces')
          .select('id, price_info')
          .eq('name', company.name)
          .maybeSingle();

        if (data) {
          if (data.price_info && data.price_info.products) {
            productData = data.price_info.products;
          }
          const { data: reviews } = await supabase
            .from('facility_reviews')
            .select('*')
            .eq('facility_id', data.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (reviews) reviewData = reviews;
        }
      } catch (e) {
        console.error('Name fallback failed', e);
      }
    }

    const mergedCompany = {
      ...company,
      products: productData,
      reviews: reviewData.map((r: any) => ({
        ...r,
        userName: r.user_name || '익명',
        userId: r.user_id,
        date: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : ''
      }))
    };

    setSelectedFuneralCompany(mergedCompany);
    if (startChat) {
      setShowSangjoAIConsult(true);
    }
  }, [facilities]);

  return {
    selectedFuneralCompany,
    setSelectedFuneralCompany,
    showSangjoAIConsult,
    setShowSangjoAIConsult,
    showSangjoContract,
    setShowSangjoContract,
    handleCompanySelect,
  };
}
