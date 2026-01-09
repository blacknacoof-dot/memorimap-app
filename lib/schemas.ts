import { z } from 'zod';

// [Step 1] Validation Logic matching types/db.ts
export const ReservationSchema = z.object({
    // System fields (Optional in form, required in DB)
    id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    facility_id: z.string().uuid().optional(),

    // Core Info
    visit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)"),
    visit_time: z.string().min(1, "방문 시간을 선택해주세요"),
    visitor_name: z.string().min(2, "신청자 성함은 2글자 이상이어야 합니다"),
    visitor_count: z.number().min(1, "최소 1명 이상이어야 합니다"),
    contact_number: z.string().regex(/^010-\d{4}-\d{4}$/, "휴대폰 번호 형식이 올바르지 않습니다 (010-XXXX-XXXX)"),

    // Metadata
    purpose: z.string().min(1, "방문 목적을 선택해주세요"),
    request_note: z.string().optional(),

    // System
    status: z.enum(['pending', 'confirmed', 'cancelled', 'rejected', 'urgent']).default('pending'),
    payment_amount: z.number().default(0),
    // Urgent / Funeral Specific (Optional)
    deceased_name: z.string().optional(),
    deceased_gender: z.enum(['male', 'female']).optional(),
    deceased_age: z.string().optional(),
    cause_of_death: z.string().optional(),

    relation: z.string().optional(), // '자녀', '배우자' etc.
    transport_needs: z.enum(['yes', 'no']).optional(),
    departure_location: z.string().optional(), // 고인 계신 곳

    religion: z.string().optional(),
    burial_method: z.string().optional(), // 'cremation', 'burial'
    emergency_contact: z.string().regex(/^010-\d{4}-\d{4}$/, "휴대폰 번호 형식이 올바르지 않습니다").optional().or(z.literal('')),
});

// [Step 2] Facility Edit Schema
export const MemorialSpaceSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "시설명을 입력해주세요"),
    address: z.string().min(1, "주소를 입력해주세요"),
    type: z.enum(['charnel_house', 'natural_burial', 'funeral_home', 'complex', 'pet']),
    ai_context: z.string().optional(),
    ai_features: z.array(z.string()).optional(),
    is_verified: z.boolean(),
});

// [Step 3] Partner Inquiry Schema
export const PartnerInquirySchema = z.object({
    id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    company_name: z.string().min(1, "업체명을 입력해주세요"),
    business_type: z.enum(['funeral_home', 'sangjo', 'memorial_park', 'pet_funeral']),
    contact_person: z.string().min(1, "담당자명을 입력해주세요"), // Renamed
    contact_number: z.string().regex(/^010-\d{4}-\d{4}$/, "휴대폰 번호 형식이 올바르지 않습니다"),
    email: z.string().email("이메일 형식이 아닙니다").optional(),
    message: z.string().optional(), // New
    status: z.enum(['pending', 'approved', 'rejected']),
});

export type ReservationFormValues = z.infer<typeof ReservationSchema>;
export type MemorialSpaceFormValues = z.infer<typeof MemorialSpaceSchema>;
export type PartnerInquiryFormValues = z.infer<typeof PartnerInquirySchema>;
