
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyLinks() {
    const sourcePath = path.resolve(__dirname, '장사시설현황_크로스체크.md');
    const reportPath = path.resolve(__dirname, '장사시설_링크_검증_리포트.md');

    if (!fs.existsSync(sourcePath)) {
        console.error(`Source file not found: ${sourcePath}`);
        return;
    }

    const content = fs.readFileSync(sourcePath, 'utf-8');
    const lines = content.split('\n');

    const facilitiesToVerify: string[] = [];
    let isTargetSection = false;

    console.log('Parsing source file...');

    for (const line of lines) {
        if (line.includes('## 1. 매칭된 업체')) {
            isTargetSection = true;
            continue;
        }
        if (isTargetSection && line.trim().startsWith('##')) {
            isTargetSection = false;
            break;
        }

        if (isTargetSection && line.trim().startsWith('|')) {
            // Skip header and separator
            if (line.includes('DB 업체명') || line.includes('---')) continue;

            const parts = line.split('|').map(p => p.trim());
            // parts[0] is empty, parts[1] is #, parts[2] is DB 업체명
            if (parts.length > 2) {
                const name = parts[2];
                if (name && name !== '') {
                    facilitiesToVerify.push(name);
                }
            }
        }
    }

    console.log(`Found ${facilitiesToVerify.length} facilities to verify.`);

    // Prepare report content
    let reportContent = `# 장사시설 링크 검증 리포트\n\n`;
    reportContent += `생성일: ${new Date().toLocaleString()}\n\n`;
    reportContent += `## 검증 결과\n\n`;
    reportContent += `| # | 시설명 | DB ID | 검증 상태 | 비고 |\n`;
    reportContent += `|---|--------|-------|-----------|------|\n`;

    // Verify in batches
    const BATCH_SIZE = 50;
    let verifiedCount = 0;
    let missingCount = 0;

    for (let i = 0; i < facilitiesToVerify.length; i += BATCH_SIZE) {
        const batch = facilitiesToVerify.slice(i, i + BATCH_SIZE);

        const { data: facilities, error } = await supabase
            .from('facilities')
            .select('id, name')
            .in('name', batch);

        if (error) {
            console.error('Error fetching batch:', error);
            continue;
        }

        // Create a map for quick lookup
        const facilityMap = new Map(facilities?.map(f => [f.name, f.id]));

        for (let j = 0; j < batch.length; j++) {
            const name = batch[j];
            const id = facilityMap.get(name);

            const status = id ? '✅ 확인됨' : '❌ 실패';
            const note = id ? '' : 'DB 미발견';
            const idDisplay = id || '-';

            if (id) verifiedCount++;
            else missingCount++;

            reportContent += `| ${i + j + 1} | ${name} | ${idDisplay} | ${status} | ${note} |\n`;
        }
    }

    reportContent += `\n## 요약\n`;
    reportContent += `- 총 대상: ${facilitiesToVerify.length}개\n`;
    reportContent += `- 확인됨: ${verifiedCount}개\n`;
    reportContent += `- 실패: ${missingCount}개\n`;

    fs.writeFileSync(reportPath, reportContent);
    console.log(`Report generated at: ${reportPath}`);
}

verifyLinks();
