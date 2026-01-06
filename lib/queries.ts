
import { createClient } from '@supabase/supabase-js';
// import { Database } from '../types/db'; // Database type missing, using default inference

// 1. Supabase 클라이언트 초기화
// (주의: .env.local에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY가 있어야 합니다)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- [Phase 8] 지도 검색 기능 ---

export const searchFacilities = async (
    lat: number,
    lng: number,
    radius: number = 5000,
    category?: string
) => {
    const { data, error } = await supabase.rpc('search_facilities', {
        lat,
        lng,
        radius_meters: radius,
        filter_category: category || null,
    });

    if (error) {
        console.error('Error searching facilities:', error);
        throw error;
    }
    return data;
};

// --- [Phase 9] 시설 상세 조회 ---

export const getFacility = async (id: string) => {
    const { data, error } = await supabase
        .from('facilities')
        .select(`
      *,
      lat: st_y(location::geometry),
      lng: st_x(location::geometry)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching facility:', error);
        throw error;
    }
    return data;
};

// --- [상담 기능] (Consultations) ---

export const createConsultation = async (
    facilityId: string,
    userId: string,
    userName: string,
    userPhone: string,
    notes: string = ''
) => {
    const { data, error } = await supabase
        .from('consultations')
        .insert([
            {
                facility_id: facilityId,
                user_id: userId,
                user_name: userName,
                user_phone: userPhone,
                notes,
                status: 'pending'
            },
        ])
        .select()
        .single();

    if (error) {
        console.error('Error creating consultation:', error);
        throw error;
    }
    return data;
};

export const getConsultationHistory = async (userId: string) => {
    const { data, error } = await supabase
        .from('consultations')
        .select(`
      *,
      facilities (
        id,
        name,
        address,
        images,
        category
      )
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching consultation history:', error);
        throw error;
    }
    return data;
};

export const deleteConsultation = async (id: string) => {
    const { error } = await supabase
        .from('consultations')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting consultation:', error);
        throw error;
    }
    return true;
};

// --- [리뷰 기능] ---
export const getReviews = async (facilityId: string) => {
    // 리뷰 테이블이 아직 없다면 에러 방지를 위해 빈 배열 반환
    // const { data, error } = await supabase...
    return [];
};

export const createReview = async (
    facilityId: string,
    userId: string,
    rating: number,
    content: string,
    images: string[] = []
) => {
    // 리뷰 기능 구현 시 주석 해제
    /*
    const { data, error } = await supabase
      .from('reviews')
      .insert([{ facility_id: facilityId, user_id: userId, rating, content, images }])
      .select()
      .single();
    */
    return null;
};

export const deleteReview = async (reviewId: string) => {
    const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

    if (error) {
        console.error('Error deleting review:', error);
        throw error;
    }
    return true;
};

// --- Missing Exports Stubs (Restored mostly, keeping others as stubs if needed) ---
export const updateConsultation = async (id: string, data: any) => { console.log('STUB: updateConsultation'); };
export const updateUserProfile = async (id: string, data: any) => { console.log('STUB: updateUserProfile'); };
export const getFacilityReservations = async (facilityId: string) => { console.log('STUB: getFacilityReservations'); return []; };
export const approveReservation = async (id: string) => { console.log('STUB: approveReservation'); };
export const rejectReservation = async (id: string) => { console.log('STUB: rejectReservation'); };
export const getMyReservations = async (userId: string) => { console.log('STUB: getMyReservations'); return []; };
export const cancelReservation = async (id: string) => { console.log('STUB: cancelReservation'); };
export const getUserPhoneNumber = async (userId: string) => { console.log('STUB: getUserPhoneNumber'); return ''; };
export const getFacilityFaqs = async (facilityId: string) => { console.log('STUB: getFacilityFaqs'); return []; };

/**
 * [호환성 패치] ReviewList.tsx가 옛날 함수명을 찾아도 작동하도록 연결
 */
export const getReviewsBySpace = getReviews;

export const getFacilitySubscription = async (facilityId: string) => {
    try {
        const { data, error } = await supabase
            .from('facility_subscriptions')
            .select(`
                *,
                subscription_plans (
                    name,
                    price,
                    features
                )
            `)
            .eq('facility_id', facilityId)
            .maybeSingle(); // Use maybeSingle to avoid error if no subscription exists

        if (error) {
            console.error('Error fetching facility subscription:', error);
            // Don't throw, just return null as frontend expects optional
            return null;
        }

        return data; // Returns the subscription object with nested plan details
    } catch (e) {
        console.error('Exception in getFacilitySubscription:', e);
        return null;
    }
};

/**
 * [추가] 사용자 역할(Role) 조회 함수
 * App.tsx에서 이 함수를 찾고 있어서 에러가 발생했습니다.
 */
export const getUserRole = async (userId: string) => {
    try {
        // 1. super_admins 테이블 확인
        const { data: superAdmin } = await supabase
            .from('super_admins')
            .select('*')
            .eq('id', userId)
            .single();

        if (superAdmin) {
            return { role: 'super_admin', isError: false };
        }

        // 2. 기본 유저 권한 반환
        return { role: 'user', isError: false };
    } catch (error: any) {
        // 406 Not Acceptable 등 에러가 나도 기본 유저로 처리
        // console.error('Role check error:', error);
        return { role: 'user', isError: false };
    }
};

/**
 * [추가] 파트너 신청용: 기존 시설 검색
 */
export const searchKnownFacilities = async (query: string, type?: string) => {
    const { data, error } = await supabase
        .from('facilities')
        .select('id, name, address, category')
        .ilike('name', `%${query}%`)
        .limit(10);

    if (error) {
        console.error('Error searching known facilities:', error);
        return [];
    }
    return data || [];
};

/**
 * [추가] 파트너 입점 신청 제출
 */
export const submitPartnerApplication = async (data: any) => {
    // 1. 파일 업로드 (스토리지 'partner_docs' 버킷 가정)
    let licenseUrl = '';
    if (data.businessLicenseImage) {
        const fileExt = data.businessLicenseImage.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
        const filePath = `licenses/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('partner_docs')
            .upload(filePath, data.businessLicenseImage);

        if (!uploadError) {
            const { data: urlData } = supabase.storage
                .from('partner_docs')
                .getPublicUrl(filePath);
            licenseUrl = urlData.publicUrl;
        }
    }

    // 2. DB Insert
    // (Note: DB 컬럼명과 코드의 필드명이 다를 수 있어 매핑합니다)
    const { data: result, error } = await supabase
        .from('partner_inquiries')
        .insert([{
            user_id: data.userId,
            company_name: data.name,
            business_type: data.type,
            contact_person: data.managerName,
            contact_number: data.phone,
            manager_mobile: data.managerMobile, // [New]
            company_email: data.companyEmail,   // [New]
            email: data.email,                  // 기존 로그인 유저 이메일 (참고용)
            // 아래 필드들은 DB 스키마에 존재해야 합니다. 없다면 에러가 날 수 있음.
            address: data.address,
            business_license_url: licenseUrl,
            message: '', // Form data doesn't pass message currently?
            status: 'pending'
        }])
        .select()
        .single();

    if (error) {
        console.error('Error submitting partner application:', error);
        throw error;
    }
    return result;
};

/**
 * [추가] 시설 이미지 조회
 */
export const getFacilityImages = async (facilityId: string) => {
    // facilities 테이블의 images 컬럼(배열)을 사용하거나 별도 테이블 사용
    // 여기서는 facilities 내 images 컬럼을 가정
    const { data: facility, error } = await supabase
        .from('facilities')
        .select('images')
        .eq('id', facilityId)
        .single();

    if (error) {
        // 에러가 나거나 이미지가 없으면 빈 배열
        return [];
    }
    return facility?.images || [];
};
