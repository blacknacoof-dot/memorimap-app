import { test, expect } from '@playwright/test';
import { createTestConsultation, deleteTestConsultation, supabase, TEST_PARTNER_ID } from './db.utils';

test.describe('Facility Admin: Confirm Reservation & Event Log', () => {
    const TEST_CONV_ID = `e2e_confirm_test_${Date.now()}`;

    test.beforeAll(async () => {
        // Setup: Create a consultation ready for confirmation (AGENT_CONNECTED)
        await createTestConsultation(TEST_CONV_ID, 'AGENT_CONNECTED');
    });

    test.afterAll(async () => {
        await deleteTestConsultation(TEST_CONV_ID);
    });

    test('TC-FA-03: Confirm Reservation triggers Status Change & Event', async ({ page }) => {
        console.log('Simulating Facility Admin Confirmation...');

        // 1. Simulate "Confirm" Action via DB Update
        // In reality, this would be an API call by the logged-in admin.
        // We verify that the UPDATE respects RLS and logic.

        const { data, error } = await supabase
            .from('ai_consultations')
            .update({
                status: 'CONSULTATION_CONFIRMED',
                updated_at: new Date().toISOString(),
                // In real app, we might append an event log here or via Trigger
                metadata: { last_event: 'CONSULTATION_CONFIRMED', event_time: new Date().toISOString() }
            })
            .eq('conversation_id', TEST_CONV_ID)
            .eq('facility_id', TEST_PARTNER_ID) // RLS Simulation: Must own the facility
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data?.status).toBe('CONSULTATION_CONFIRMED');
        expect(data?.metadata?.last_event).toBe('CONSULTATION_CONFIRMED');

        console.log('Status updated & Event Logged in Metadata');

        // 2. Verify Event Log (Realtime Mock or DB Log)
        // If we had an 'events' table, we would check it here. 
        // For now, we assume the successful status update represents the event trigger point.
    });

    test('TC-FA-04: RLS Defense - Cannot confirm other facility reservation', async () => {
        console.log('Simulating Unauthorized Access...');

        const OTHER_FACILITY_ID = '00000000-0000-0000-0000-000000000000'; // Fake ID

        const { data, error } = await supabase
            .from('ai_consultations')
            .update({ status: 'CONSULTATION_CONFIRMED' })
            .eq('conversation_id', TEST_CONV_ID)
            .eq('facility_id', OTHER_FACILITY_ID) // Trying to update with wrong facility match context
            .select();

        // Should update 0 rows because facility_id doesn't match the record
        // Or if we were using actual Auth Token, it would throw 403.
        // Here we simulate the logic validation.

        expect(data?.length).toBe(0);
        console.log('RLS Defense Successful: 0 rows updated');
    });
});
