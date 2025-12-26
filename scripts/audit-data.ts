
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

// --- Environment Setup ---
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split(/\r?\n/).forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return;
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                if (value) process.env[key.trim()] = value;
            }
        });
    }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function auditData() {
    console.log("🕵️ Starting Data Audit...");

    // 1. Fetch All Data
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error || !data || data.length === 0) break;
        allData = [...allData, ...data];
        if (data.length < pageSize) break;
        page++;
    }

    // 2. Define Suspicious Keywords
    const suspiciousKeywords = [
        "본사", "사무실", "사무소", "영업소",
        "개발", "건설", "조경", "석재", "비석", "석물",
        "센터", "협회", "조합", "재단",
        "화원", "플라워", "꽃집", "농원",
        "유통", "산업", "기업", "상사", "주식회사",
        "카페", "식당", "매점", "슈퍼",
        "컨설팅", "후불", "상조", "장례토탈"
    ];

    const candidates: any[] = [];

    for (const record of allData) {
        const name = record.name;
        // Exclude known good types if needed, but names are dirty.
        const matched = suspiciousKeywords.find(k => name.includes(k));

        if (matched) {
            candidates.push({
                id: record.id,
                name: name,
                address: record.address,
                reason: matched
            });
        }
    }

    console.log(`🔎 Found ${candidates.length} suspicious candidates.`);

    // 3. Generate Markdown Report
    let mdContent = "# 🕵️ Suspicious Facility Report\n\n";
    mdContent += "The following facilities contain keywords often associated with non-funeral services. **Please review and tell me which ones to delete.**\n\n";
    mdContent += "| Name | Address | Suspicious Keyword |\n";
    mdContent += "|---|---|---|\n";

    candidates.forEach(c => {
        mdContent += `| **${c.name}** | ${c.address} | \`${c.reason}\` |\n`;
    });

    const reportPath = path.resolve(process.cwd(), 'suspicious_candidates.md');
    fs.writeFileSync(reportPath, mdContent);
    console.log(`📝 Report written to: ${reportPath}`);
}

auditData();
