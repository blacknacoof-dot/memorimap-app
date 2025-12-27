import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';
const supabase = createClient(supabaseUrl, supabaseKey);

async function countExact() {
    // 정확한 개수 조회 (count 사용)
    const { count: funeralCount, error: e1 } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'funeral');

    const { count: totalCount, error: e2 } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true });

    console.log('=== 정확한 시설 개수 ===\n');
    console.log(`장례식장 (funeral): ${funeralCount}개`);
    console.log(`전체 시설: ${totalCount}개`);

    // 타입별 개수
    const types = ['funeral', 'charnel', 'natural', 'park', 'pet', 'complex', 'sea'];
    console.log('\n=== 타입별 개수 ===\n');

    for (const type of types) {
        const { count } = await supabase
            .from('memorial_spaces')
            .select('*', { count: 'exact', head: true })
            .eq('type', type);
        console.log(`${type}: ${count}개`);
    }
}

countExact().catch(console.error);
