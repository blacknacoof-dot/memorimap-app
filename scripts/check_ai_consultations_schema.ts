
import { supabase } from '../lib/supabaseClient';

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_table_info', { t_name: 'ai_consultations' });
    if (error) {
        // If RPC doesn't exist, try a simple query to see columns
        console.log("RPC get_table_info failed, trying select * limit 0");
        const { data: cols, error: colError } = await supabase.from('ai_consultations').select('*').limit(0);
        if (colError) {
            console.error("Error fetching ai_consultations:", colError);
        } else {
            console.log("Columns in ai_consultations:", Object.keys(cols?.[0] || {}));
        }
    } else {
        console.log("Table Info for ai_consultations:", data);
    }
}

checkSchema();
