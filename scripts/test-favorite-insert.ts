import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
    console.log('🧪 Testing Favorite Insert via ANON key...');

    // Get a valid facility ID
    const { data: facility } = await supabase.from('facilities').select('id').limit(1).single();

    if (!facility) {
        console.error('❌ No facilities found to test with.');
        return;
    }

    const testUserId = 'test-clerk-id-' + Math.random().toString(36).substring(7);

    console.log(`Inserting favorite for User: ${testUserId}, Facility: ${facility.id}`);

    const { data, error } = await supabase
        .from('favorites')
        .insert([{ user_id: testUserId, facility_id: facility.id }])
        .select();

    if (error) {
        console.error('❌ Insert FAILED:', error.message);
        if (error.code === '42501') console.log('💡 HINT: RLS Still blocking.');
    } else {
        console.log('✅ Insert SUCCESS!', data);

        // Cleanup
        await supabase.from('favorites').delete().match({ user_id: testUserId, facility_id: facility.id });
        console.log('🗑️ Test data cleaned up.');
    }
}

testInsert();
