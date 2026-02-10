
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDuplicates() {
    console.log('Fetching all facilities...');
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, created_at, image_url, type');

    if (error) {
        console.error('Error fetching facilities:', error);
        return;
    }

    console.log(`Total facilities: ${facilities.length}`);

    const nameMap = new Map<string, any[]>();

    facilities.forEach(f => {
        // Normalize name: remove spaces, lowercase
        const normalized = f.name.replace(/\s+/g, '').toLowerCase();
        if (!nameMap.has(normalized)) {
            nameMap.set(normalized, []);
        }
        nameMap.get(normalized)?.push(f);
    });

    const duplicates: any[] = [];
    const reportLines: string[] = [];

    reportLines.push('# Duplicate Analysis Report');
    reportLines.push(`Total Facilities Scanned: ${facilities.length}`);

    let duplicateGroups = 0;
    let totalDuplicateRecords = 0;

    for (const [key, group] of nameMap.entries()) {
        if (group.length > 1) {
            duplicates.push(group);
            duplicateGroups++;
            totalDuplicateRecords += group.length;

            reportLines.push(`\n## Group: ${group[0].name} (Count: ${group.length})`);
            group.forEach(f => {
                reportLines.push(`- ID: ${f.id} | Type: ${f.type} | Created: ${f.created_at} | Image: ${f.image_url ? 'Yes' : 'No'} | Addr: ${f.address}`);
            });
        }
    }

    reportLines.push(`\nTotal Duplicate Groups: ${duplicateGroups}`);
    reportLines.push(`Total Records involved in duplicates: ${totalDuplicateRecords}`);

    console.log(`Found ${duplicateGroups} groups of duplicates.`);

    const reportPath = path.resolve(process.cwd(), 'duplicate_analysis_report.md');
    fs.writeFileSync(reportPath, reportLines.join('\n'));
    console.log(`Report saved to ${reportPath}`);
}

analyzeDuplicates();
