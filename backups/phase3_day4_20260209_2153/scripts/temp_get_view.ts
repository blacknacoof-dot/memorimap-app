import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { data, error } = await supabase
        .from('pg_views')
        .select('definition')
        .eq('viewname', 'admin_subscriptions_with_facility')
        .eq('schemaname', 'public')
        .single();

    if (error) {
        console.error('Error:', error);
        process.exit(1);
    }

    console.log(JSON.stringify(data, null, 2));
}

main();
