import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Setup Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTypes() {
    console.log('🔍 Checking facility types in facilities table...\n');

    const { data, error } = await supabase
        .from('facilities')
        .select('type, name');

    if (error) {
        console.error('Error fetching types:', error);
        return;
    }

    if (!data) {
        console.log("No data found");
        return;
    }

    // Count per type
    const counts: Record<string, number> = {};
    const facilitiesByType: Record<string, string[]> = {};
    
    data.forEach((item: any) => {
        const t = item.type || 'NULL';
        counts[t] = (counts[t] || 0) + 1;
        
        if (!facilitiesByType[t]) {
            facilitiesByType[t] = [];
        }
        facilitiesByType[t].push(item.name);
    });

    console.log('📊 Type Distribution:\n');
    console.table(counts);
    
    console.log('\n🏷️ Unique Types:', Object.keys(counts).sort().join(', '));
    
    // Check suspicious types
    console.log('\n⚠️ Checking for suspicious classifications...\n');
    
    const funeralTypes = ['funeral', 'funeral_home', '장례식장', 'funeral_service'];
    const columbariumTypes = ['columbarium', '봉안시설', 'char'];
    const cemeteryTypes = ['cemetery', '공원묘지', 'park'];
    const naturalTypes = ['natural', 'natural_burial', '수목장', '자연장'];
    const petTypes = ['pet', '동물장례'];
    const sangjoTypes = ['sangjo', 'prepaid_funeral', '상조'];
    
    Object.entries(counts).forEach(([type, count]) => {
        const isKnownType = 
            funeralTypes.some(t => type.includes(t)) ||
            columbariumTypes.some(t => type.includes(t)) ||
            cemeteryTypes.some(t => type.includes(t)) ||
            naturalTypes.some(t => type.includes(t)) ||
            petTypes.some(t => type.includes(t)) ||
            sangjoTypes.some(t => type.includes(t));
            
        if (!isKnownType) {
            console.log(`⚠️ UNKNOWN type: "${type}" (${count}개)`);
            console.log(`   Examples: ${facilitiesByType[type].slice(0, 3).join(', ')}...`);
        }
    });
    
    // Show facilities with matching names to their types
    console.log('\n🎯 Sample facilities by type:\n');
    Object.entries(facilitiesByType).forEach(([type, names]) => {
        console.log(`\n[${type}] (${names.length}개):`);
        names.slice(0, 5).forEach((name, i) => {
            console.log(`  ${i + 1}. ${name}`);
        });
        if (names.length > 5) {
            console.log(`  ... 외 ${names.length - 5}개`);
        }
    });
}

checkTypes();
