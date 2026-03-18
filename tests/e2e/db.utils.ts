import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error('[E2E env] Missing VITE_SUPABASE_URL in .env.local');
}

if (!serviceRoleKey) {
    throw new Error('[E2E env] Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[E2E env] Using legacy VITE_SUPABASE_SERVICE_ROLE_KEY fallback; migrate to SUPABASE_SERVICE_ROLE_KEY');
}

// Service Role Key is required for cleanup and setup.
export const supabase = createClient(supabaseUrl, serviceRoleKey);

export const TEST_USER_ID = 'd767424d-4abe-47f1-ab44-7c3160f572e5'; // Super Admin Profile ID (Existing)
export const TEST_PARTNER_ID = '7fd43013-842d-4cbb-94ca-8ca0dc3ac785'; // Reference Facility

export async function createTestConsultation(conversationId: string, status = 'AI_HANDLING') {
    const { data, error } = await supabase.from('ai_consultations').upsert({
        conversation_id: conversationId,
        user_id: TEST_USER_ID,
        facility_id: TEST_PARTNER_ID,
        facility_name: 'E2E Test Facility',
        status: status,
        messages: [{ role: 'user', content: 'E2E Test Message' }],
        category: 'funeral',
        // Legacy fields to satisfy constraints
        space_id: 'legacy-test-id',
        topic: 'general'
    }).select().single();

    if (error) throw new Error(`Failed to create test consultation: ${error.message}`);
    return data;
}

export async function deleteTestConsultation(conversationId: string) {
    const { error } = await supabase.from('ai_consultations').delete().eq('conversation_id', conversationId);
    if (error) console.error(`Cleanup failed for ${conversationId}:`, error);
}

export async function getConsultationStatus(conversationId: string) {
    const { data } = await supabase.from('ai_consultations').select('status').eq('conversation_id', conversationId).single();
    return data?.status;
}

// ─────────────────────────────────────────────────────────
// Review E2E Test Helpers: Reservation Fixture
// ─────────────────────────────────────────────────────────

export const TEST_FACILITY_ID_FREEDLIFE = 'fc_freedlife_001'; // 프리드라이프 ID (실제 ID로 교체 필요)

/**
 * Creates a test reservation with 'confirmed' status for review E2E testing.
 * This allows the user to pass the contract check in ReviewForm.tsx.
 */
export async function createTestReservation(userId: string, facilityId: string) {
    // Use proper UUID format for the reservation ID
    const reservationId = crypto.randomUUID();

    const { data, error } = await supabase.from('reservations').upsert({
        id: reservationId,
        user_id: userId,
        facility_id: facilityId,
        visit_date: new Date().toISOString(),
        time_slot: '10:00',
        visitor_name: 'E2E Test User',
        visitor_count: 1,
        message: 'E2E Test Reservation for Review',
        status: 'confirmed',
        contact_number: '010-0000-0000',
    }, { onConflict: 'id' }).select().single();

    if (error) {
        console.error('Failed to create test reservation:', error);
        throw new Error(`Failed to create test reservation: ${error.message}`);
    }

    console.log(`✅ Test reservation created: ${reservationId}`);
    return { ...data, reservationId };
}

/**
 * Deletes all test reservations for a given user.
 */
export async function deleteTestReservations(userId: string) {
    const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('user_id', userId)
        .like('id', 'test-reservation-%');

    if (error) {
        console.error(`Cleanup failed for reservations:`, error);
    } else {
        console.log(`✅ Test reservations cleaned up for user: ${userId}`);
    }
}
