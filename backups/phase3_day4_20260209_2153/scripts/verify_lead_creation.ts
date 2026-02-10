
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Dynamic import to ensure env vars are loaded first
const verifyLeadCreation = async () => {
    const { createLead } = await import('../lib/queries');
    const { supabase } = await import('../lib/supabaseClient');

    console.log('--- Starting RLS Verification ---');
    console.log('Attempting to create a test lead...');

    try {
        const testLead = {
            category: 'funeral', // Use valid category
            urgency: 'immediate', // Use valid urgency
            scale: 'small', // Use valid scale (guess)
            context_data: { test: 'data' },
            priorities: ['test_priority']
        };

        const result = await createLead(testLead);

        // @ts-ignore
        if (result && result.success) {
            console.log('✅ Lead created successfully!');
            console.log('Result:', result);
            console.log('--- RLS Verification Passed ---');
            console.log('(Note: Cleanup skipped as ID is not returned to secure RLS)');
        } else {
            throw new Error('Create lead returned failure or unexpected format');
        }

    } catch (error: any) {
        console.error('❌ Lead creation failed.');
        console.error('Error:', error);
        console.error('--- RLS Verification Failed ---');
        if (String(error).includes('42501')) {
            console.error('The RLS policy violation error (42501) persists. Please run the fix_leads_rls.sql script in your Supabase dashboard.');
        }
        process.exit(1);
    }
};

verifyLeadCreation();
