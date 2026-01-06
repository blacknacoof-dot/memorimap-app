const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('Starting data cleanup...');

    // 1. Nullify coordinates for clustered data around Seoul City Hall
    // Target: lat between 37.566 and 37.567, lng between 126.977 and 126.979
    const { error: updateError, count: updatedCount } = await supabase
        .from('memorial_spaces')
        .update({ lat: null, lng: null })
        .gte('lat', 37.566)
        .lte('lat', 37.567)
        .gte('lng', 126.977)
        .lte('lng', 126.979)
        .select('id', { count: 'exact' });

    if (updateError) console.error('Error nullifying coords:', updateError);
    console.log(`Coords nullified for ${updatedCount || '?'} facilities (Cluster cleanup).`);

    // 2. Delete garbage data: '해양병원'
    const { error: delError1, count: delCount1 } = await supabase
        .from('memorial_spaces')
        .delete({ count: 'exact' })
        .ilike('name', '%해양병원%');

    if (delError1) console.error('Error deleting 해양병원:', delError1);
    console.log(`Deleted '해양병원': ${delCount1 || 0} rows.`);

    // 3. Delete garbage data: Name contains '테스트'
    const { error: delError2, count: delCount2 } = await supabase
        .from('memorial_spaces')
        .delete({ count: 'exact' })
        .ilike('name', '%테스트%');

    if (delError2) console.error('Error deleting test data:', delError2);
    console.log(`Deleted 'Test' data: ${delCount2 || 0} rows.`);


    // 4. Delete empty name or address (Safety check: only really empty)
    // Check empty name
    const { error: delError3, count: delCount3 } = await supabase
        .from('memorial_spaces')
        .delete({ count: 'exact' })
        .or('name.is.null,name.eq.""');

    if (delError3) console.error('Error deleting empty names:', delError3);
    console.log(`Deleted empty names: ${delCount3 || 0} rows.`);

    // Check empty address? (Maybe keep if valid name exists, but for now user said delete)
    // Safer to leave address empty if name is valid? 
    // User prompt: "DELETE FROM facilities WHERE address IS NULL OR address = '';"
    // Let's do it but log it.

    // const { error: delError4, count: delCount4 } = await supabase
    //   .from('memorial_spaces')
    //   .delete({ count: 'exact' })
    //   .or('address.is.null,address.eq.""');

    // console.log(`Deleted empty addresses: ${delCount4 || 0} rows.`);
    // Re-reading user request: "또는 주소가 아예 없는 껍데기 데이터 삭제"
    // Okay, I will enable it.

    const { error: delError4, count: delCount4 } = await supabase
        .from('memorial_spaces')
        .delete({ count: 'exact' })
        .or('address.is.null,address.eq.""');

    if (delError4) console.error('Error deleting empty addresses:', delError4);
    console.log(`Deleted empty addresses: ${delCount4 || 0} rows.`);

    console.log('Cleanup completed.');
}

cleanup();
