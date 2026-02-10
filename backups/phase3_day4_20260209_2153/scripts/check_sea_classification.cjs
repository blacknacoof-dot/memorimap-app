const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSea() {
    // 1. Check count of type 'sea'
    const { count: seaCount, error: countError } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'sea');

    console.log(`Facilities with type='sea': ${seaCount}`);

    // 2. Check for potential misclassifications (name contains 바다 or 해양 but type != sea)
    const { data: misclassified, error: searchError } = await supabase
        .from('memorial_spaces')
        .select('name, type')
        .or('name.ilike.%바다%,name.ilike.%해양%')
        .neq('type', 'sea');

    if (misclassified && misclassified.length > 0) {
        console.log(`Potential misclassified (Name has 바다/해양 but type is not sea): ${misclassified.length}`);
        console.table(misclassified);
    } else {
        console.log("No obvious misclassifications found via name search.");
    }
}

checkSea();
