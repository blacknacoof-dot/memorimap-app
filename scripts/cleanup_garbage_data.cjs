
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

const GARBAGE_TYPES = ['수의', '관', '입관용품', '기타', '봉안함', '횡대'];
const SUSPICIOUS_NAMES = ['저마', '오동나무', '명정', '관포(보)', '습신(꽃신)', '염포(보)', '결관포(보)', '베게', '기타류'];

async function cleanup() {
    console.log('Starting cleanup...');

    // 1. Check by Type
    const { data: byType, error: typeError } = await supabase
        .from('memorial_spaces')
        .select('id, name, type')
        .in('type', GARBAGE_TYPES);

    if (typeError) console.error('Error checking types:', typeError);
    else {
        console.log(`Found ${byType?.length} rows by TYPE match.`);
        if (byType?.length > 0) {
            console.log('Sample:', byType.slice(0, 3).map(r => `${r.name} (${r.type})`));

            const { error: delError } = await supabase
                .from('memorial_spaces')
                .delete()
                .in('type', GARBAGE_TYPES);

            if (delError) console.error('Error deleting by type:', delError);
            else console.log('Successfully deleted garbage rows by type.');
        }
    }

    // 2. Check by Name
    const { data: byName, error: nameError } = await supabase
        .from('memorial_spaces')
        .select('id, name, type')
        .in('name', SUSPICIOUS_NAMES);

    if (nameError) console.error('Error checking names:', nameError);
    else {
        console.log(`Found ${byName?.length} rows by NAME match.`);
        if (byName?.length > 0) {
            const { error: delError } = await supabase
                .from('memorial_spaces')
                .delete()
                .in('name', SUSPICIOUS_NAMES);
            if (delError) console.error('Error deleting by name:', delError);
            else console.log('Successfully deleted garbage rows by name.');
        }
    }

    // 3. Double Check: ILIKE for specific keywords if above failed
    const { data: likeData } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .ilike('name', '%오동나무%');

    if (likeData && likeData.length > 0) {
        console.log(`Found ${likeData.length} rows with '오동나무' in name.`);
        const ids = likeData.map(d => d.id);
        const { error: delLike } = await supabase.from('memorial_spaces').delete().in('id', ids);
        if (!delLike) console.log('Deleted rows with 오동나무.');
    }
}

cleanup();
