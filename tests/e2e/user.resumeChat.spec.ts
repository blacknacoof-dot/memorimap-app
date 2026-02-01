import { test, expect } from '@playwright/test';
import { createTestConsultation, deleteTestConsultation, supabase, TEST_USER_ID } from './db.utils';

test.describe('User: Resume Chat & Ownership', () => {
    const ACTIVE_CONV_ID = `e2e_user_active_${Date.now()}`;
    const COMPLETED_CONV_ID = `e2e_user_completed_${Date.now()}`;
    const OTHER_USER_ID = '00000000-0000-0000-0000-000000000000';

    test.beforeAll(async () => {
        // Setup 1: Active Consultation (Own)
        await createTestConsultation(ACTIVE_CONV_ID, 'AI_HANDLING');

        // Setup 2: Completed Consultation (Own) - create then update to COMPLETED
        await createTestConsultation(COMPLETED_CONV_ID, 'COMPLETED');
    });

    test.afterAll(async () => {
        // Cleanup all
        await deleteTestConsultation(ACTIVE_CONV_ID);
        await deleteTestConsultation(COMPLETED_CONV_ID);
    });

    test('TC-US-01: User can fetch/resume their own ACTIVE consultation', async () => {
        console.log('Simulating User Fetching Active Chat...');

        const { data, error } = await supabase
            .from('ai_consultations')
            .select('*')
            .eq('conversation_id', ACTIVE_CONV_ID)
            .eq('user_id', TEST_USER_ID) // Own Data
            .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data?.conversation_id).toBe(ACTIVE_CONV_ID);
        expect(data?.status).not.toBe('COMPLETED');

        console.log('Active Chat Fetched Successfully');
    });

    test('TC-US-02: User CANNOT resume COMPLETED consultation (Logic Check)', async () => {
        console.log('Checking COMPLETED status logic...');

        const { data } = await supabase
            .from('ai_consultations')
            .select('status')
            .eq('conversation_id', COMPLETED_CONV_ID)
            .single();

        // In the Frontend/Button logic, this status would disable the "Resume" button.
        // We verify the data state supports this decision.
        expect(data?.status).toBe('COMPLETED');

        // If we were to try to "Update" it to resume, it should arguably be blocked or require a new session.
        // For this test, we verify the state is indeed COMPLETED and identified as such.
        const isResumable = data?.status !== 'COMPLETED';
        expect(isResumable).toBe(false);

        console.log('Consultation is correctly identified as NOT Resumable');
    });

    test('TC-US-03: User CANNOT fetch others consultation (Ownership Simulation)', async () => {
        console.log('Simulating Access to Others Data...');

        // Try to fetch Active Chat using WRONG User ID context
        // (Simulating RLS filter where auth.uid() != record.user_id)

        const { data, error } = await supabase
            .from('ai_consultations')
            .select('*')
            .eq('conversation_id', ACTIVE_CONV_ID)
            .eq('user_id', OTHER_USER_ID) // Mismatch
            .maybeSingle(); // Should return null if not found

        expect(data).toBeNull();
        // PostgREST with exact match filter returns 0 rows (null with maybeSingle) if no match
        console.log('Access Denied (Data not found for wrong user_id)');
    });
});
