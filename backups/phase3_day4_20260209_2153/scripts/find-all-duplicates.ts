
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findAllDuplicates() {
    console.log('Fetching all facilities...');
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, type, created_at')
        .order('id');

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    console.log(`fetched ${facilities.length} facilities.`);

    const map = new Map<string, any[]>();

    // Helper to normalize strings for comparison
    const normalize = (s: string) => (s || '').replace(/\s+/g, '').trim();

    facilities.forEach(f => {
        // Key: Normalized Name + Normalized Address (first 15 chars of address to avoid minor discrepancies?)
        // User requested "Same Name, Same Address".
        // Let's use full normalized address for now.
        const key = `${normalize(f.name)}|${normalize(f.address)}`;
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key)!.push(f);
    });

    const duplicates: any[] = [];
    map.forEach((list, key) => {
        if (list.length > 1) {
            duplicates.push({ key, items: list });
        }
    });

    console.log(`Found ${duplicates.length} groups of duplicates.`);

    if (duplicates.length === 0) {
        console.log('No duplicates found.');
        return;
    }

    // Generate Report
    let report = '# Duplicate Facilities Report\n\n';
    report += `Found ${duplicates.length} duplicate groups (Same Name + Same Address).\n\n`;

    duplicates.forEach((group, idx) => {
        report += `## Group ${idx + 1}\n`;
        group.items.forEach((item: any) => {
            report += `- **ID**: ${item.id}\n`;
            report += `  - Name: ${item.name}\n`;
            report += `  - Address: ${item.address}\n`;
            report += `  - Type: ${item.type}\n`;
            report += `  - Created At: ${item.created_at || 'Unknown'}\n`;
        });
        report += '\n';
    });

    const reportPath = path.resolve(process.cwd(), 'scripts', 'duplicate_report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`Report saved to ${reportPath}`);
}

findAllDuplicates();
