import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTriggers() {
    const { data, error } = await supabase.rpc('get_table_triggers', {
        t_name: 'facility_reviews'
    });

    if (error) {
        // If RPC doesn't exist, try common queries through rpc('exec_sql') if exists
        console.error('Error fetching triggers:', error);

        // Let's try to query pg_trigger directly if we have permission
        const { data: triggerData, error: triggerError } = await supabase
            .from('pg_trigger')
            .select(`
                tgname,
                tgrelid(relname),
                tgtype,
                tgfoid(proname)
            `)
            .eq('tgrelid::regclass::text', 'public.facility_reviews');

        if (triggerError) {
            console.error('Direct pg_trigger query failed:', triggerError);
        } else {
            console.log('Triggers on facility_reviews:', triggerData);
        }
    } else {
        console.log('Triggers on facility_reviews:', data);
    }
}

listTriggers();
