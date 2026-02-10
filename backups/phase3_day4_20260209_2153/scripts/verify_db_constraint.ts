import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function verifyUpsertConstraint() {
    console.log('🚀 Verifying DB Unique Constraint for Upsert...');

    const TEST_CONV_ID = `verify_constraint_${Date.now()}`;
    const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000'; // Dummy UUID

    // 1. Initial Insert
    console.log(`\n1. Attempting Initial Insert (ID: ${TEST_CONV_ID})...`);

    // Note: providing legacy columns to satisfy NOT NULL constraints
    const { data: insertData, error: insertError } = await supabase.from('ai_consultations').insert({
        conversation_id: TEST_CONV_ID,
        facility_name: 'Constraint Test',
        messages: [{ role: 'system', content: 'Init' }],
        status: 'test_init',
        user_id: MOCK_USER_ID,
        space_id: 'legacy-id-mock',
        topic: 'general' // Added topic as per error message
    }).select().single();

    if (insertError) {
        console.error('❌ Insert Failed:', insertError);
        return;
    }
    console.log('✅ Insert Successful.');

    // 2. Attempt Upsert (Update based on conversation_id)
    console.log(`\n2. Attempting Upsert (Update status)...`);
    const { data: upsertData, error: upsertError } = await supabase.from('ai_consultations').upsert({
        conversation_id: TEST_CONV_ID,
        facility_name: 'Constraint Test',
        messages: [{ role: 'system', content: 'Updated' }],
        status: 'test_updated',
        user_id: MOCK_USER_ID,
        space_id: 'legacy-id-mock',
        topic: 'general'
    }, { onConflict: 'conversation_id' }).select().single();

    if (upsertError) {
        console.error('❌ Upsert Failed (Constraint might be missing):', upsertError);
        console.error('   Hint: Ensure the UNIQUE constraint on "conversation_id" exists.');
        return;
    }

    // 3. Validation
    if (upsertData.status === 'test_updated') {
        console.log('✅ Upsert Successful! Status updated correctly.');
        console.log('🎉 DB Constraint Verified: "conversation_id" is acting as a unique key.');
    } else {
        console.warn('⚠️ Upsert seemed to work but data check failed:', upsertData);
    }

    // Cleanup
    await supabase.from('ai_consultations').delete().eq('conversation_id', TEST_CONV_ID);
}

verifyUpsertConstraint().catch(console.error);
