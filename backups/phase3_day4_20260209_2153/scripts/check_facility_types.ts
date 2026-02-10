import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
// Note: In a script, we might need to load .env, but for now I'll hardcode or assume process.env is set if using dotenv
// Or I can copy the keys from supabaseClient.ts for this temporary script.

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTypes() {
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('type, name');

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    const counts: Record<string, number> = {};
    const parks: string[] = [];

    data.forEach((item: any) => {
        const type = item.type || 'undefined';
        counts[type] = (counts[type] || 0) + 1;
        if (type === 'park' || type === 'complex') {
            parks.push(item.name);
        }
    });

    console.log('--- Facility Type Counts ---');
    console.table(counts);
    console.log('--- Park/Complex List ---');
    console.log(parks);
}

checkTypes();
