const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function updateConstants() {
    console.log('Reading funeral_companies from DB...');
    const { data: fcData, error } = await supabase.from('funeral_companies').select('id, name');
    if (error) throw error;

    const constantsPath = 'c:/Users/black/Desktop/memorimap/constants.ts';
    let content = fs.readFileSync(constantsPath, 'utf8');

    for (const fc of fcData) {
        // Find existing record in constants.ts by name and replace its ID
        const nameEscaped = fc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Regex to find: id: 'anything', \s* name: 'FCName'
        const regex = new RegExp(`id:\\s*['"](.*?)['"],\\s*name:\\s*['"]${nameEscaped}['"]`, 'g');

        content = content.replace(regex, (match, oldId) => {
            console.log(`Replacing ${oldId} with ${fc.id} for ${fc.name}`);
            return `id: '${fc.id}',\n    name: '${fc.name}'`;
        });
    }

    fs.writeFileSync(constantsPath, content);
    console.log('constants.ts updated.');
}

// DO NOT RUN YET - RUN AFTER sync_sangjo_ids.cjs
// updateConstants();
