
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function cleanMorePetJunk() {
    console.log("🧹 Starting Deep Clean of Pet Facilities...");

    // 1. Fetch all pet facilities
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .eq('type', 'pet');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Checking ${facilities.length} pet facilities...`);

    // Define Keywords
    const hardJunkKeywords = [
        '협회', '3D', '3디', '제조', '용품', '미용', '분양', '의류', '유통',
        '개발', '연구', '학원', '공방', '비누', '캔들', '스튜디오', '사진관',
        '코리아', '인터내셔널', '글로벌', '시스템', '기획', '디자인'
    ]; // 이름에 있으면 무조건 삭제

    const softJunkKeywords = [
        '서비스', '케어', '토탈', '지원', '컨설팅', '대행'
    ]; // 장례 관련 단어가 없으면 삭제

    const funeralKeywords = ['장례', '화장', '추모', '봉안', '메모리얼', '스톤', '납골'];

    const toDelete: { id: string, name: string, reason: string }[] = [];

    for (const f of facilities) {
        const name = f.name;

        // 1. Hard Check
        const hardMatch = hardJunkKeywords.find(k => name.includes(k));
        if (hardMatch) {
            toDelete.push({ id: f.id, name, reason: `Hard Keyword: ${hardMatch}` });
            continue;
        }

        // 2. Soft Check
        const softMatch = softJunkKeywords.find(k => name.includes(k));
        if (softMatch) {
            // Check for funeral keywords
            const isFuneral = funeralKeywords.some(k => name.includes(k));
            if (!isFuneral) {
                toDelete.push({ id: f.id, name, reason: `Soft Keyword: ${softMatch} (No funeral term)` });
            }
        }
    }

    if (toDelete.length === 0) {
        console.log("✅ No junk facilities found.");
        return;
    }

    console.log("--- Records to Delete ---");
    toDelete.forEach(d => console.log(`[${d.name}] -> Reason: ${d.reason}`));
    console.log("-------------------------");

    // Perform Delete
    const ids = toDelete.map(d => d.id);
    const { error: deleteError } = await supabase
        .from('memorial_spaces')
        .delete()
        .in('id', ids);

    if (deleteError) {
        console.error("❌ Delete Failed:", deleteError);
    } else {
        console.log(`🗑️  Successfully deleted ${ids.length} records.`);
    }
}

cleanMorePetJunk();
