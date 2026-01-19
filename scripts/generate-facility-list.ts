/**
 * Generate a clean, readable list of the 169 facilities with location issues
 */

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ValidationIssue {
    facility_id: string;
    facility_name: string;
    category: string;
    address: string;
    lat: number;
    lng: number;
    issue_type: string;
    description: string;
    severity: string;
}

async function generateFacilityList() {
    console.log('📋 Generating clean facility list from validation report...\n');

    // Read the JSON report
    const reportPath = 'location_validation_report_2026-01-19T05-47-27-916Z.json';
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    const issues: ValidationIssue[] = reportData.issues;

    console.log(`Found ${issues.length} facilities with issues\n`);

    // Group by issue description pattern
    const grouped: Record<string, ValidationIssue[]> = {};

    issues.forEach(issue => {
        const key = issue.description; // e.g., "Address says 광주 but coordinates are in 경기"
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(issue);
    });

    // Generate markdown report
    let markdown = '# 위치 불일치 시설 목록 (169개)\n\n';
    markdown += `생성일시: ${new Date().toLocaleString('ko-KR')}\n\n`;
    markdown += '## 요약\n\n';
    markdown += `- **총 시설 수**: ${reportData.summary.total_facilities}개\n`;
    markdown += `- **정상 시설**: ${reportData.summary.valid_facilities}개\n`;
    markdown += `- **문제 시설**: ${reportData.summary.total_issues}개\n\n`;
    markdown += '---\n\n';

    // Sort groups by count
    const sortedGroups = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

    sortedGroups.forEach(([description, facilities], groupIndex) => {
        markdown += `## 그룹 ${groupIndex + 1}: ${description}\n\n`;
        markdown += `**시설 수**: ${facilities.length}개\n\n`;

        // Create table
        markdown += '| 번호 | 시설명 | 카테고리 | 주소 | 좌표 | ID |\n';
        markdown += '|------|--------|----------|------|------|----|\n';

        facilities.forEach((facility, index) => {
            const categoryMap: Record<string, string> = {
                'funeral_home': '장례식장',
                'columbarium': '봉안시설',
                'cemetery': '공원묘지',
                'natural_burial': '자연장',
                'sea_burial': '해양장',
                'pet_funeral': '반려동물'
            };

            const categoryKr = categoryMap[facility.category] || facility.category;
            const coords = `(${facility.lat.toFixed(4)}, ${facility.lng.toFixed(4)})`;

            markdown += `| ${index + 1} | ${facility.facility_name} | ${categoryKr} | ${facility.address} | ${coords} | \`${facility.facility_id.slice(0, 8)}...\` |\n`;
        });

        markdown += '\n---\n\n';
    });

    // Add quick reference section
    markdown += '## 빠른 참조\n\n';
    markdown += '### 카테고리별 분포\n\n';

    const categoryCount: Record<string, number> = {};
    issues.forEach(issue => {
        categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
    });

    const categoryMap: Record<string, string> = {
        'funeral_home': '장례식장',
        'columbarium': '봉안시설',
        'cemetery': '공원묘지',
        'natural_burial': '자연장',
        'sea_burial': '해양장',
        'pet_funeral': '반려동물'
    };

    Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
            const categoryKr = categoryMap[category] || category;
            markdown += `- **${categoryKr}**: ${count}개\n`;
        });

    // Save to file
    const outputPath = 'location_issues_facility_list.md';
    fs.writeFileSync(outputPath, markdown);

    console.log(`✅ Markdown report saved to: ${outputPath}`);

    // Also create a simple CSV with just the essentials
    const simpleCSV = [
        '번호,시설명,카테고리,주소,위도,경도,문제설명,ID',
        ...issues.map((issue, index) => {
            const categoryKr = categoryMap[issue.category] || issue.category;
            return `${index + 1},"${issue.facility_name}","${categoryKr}","${issue.address}",${issue.lat},${issue.lng},"${issue.description}","${issue.facility_id}"`;
        })
    ].join('\n');

    const simpleCSVPath = 'location_issues_simple.csv';
    fs.writeFileSync(simpleCSVPath, '\uFEFF' + simpleCSV, 'utf-8'); // Add BOM for Excel Korean support

    console.log(`✅ Simple CSV saved to: ${simpleCSVPath}`);

    // Print summary to console
    console.log('\n📊 Summary by Issue Type:\n');
    sortedGroups.forEach(([description, facilities]) => {
        console.log(`${facilities.length.toString().padStart(3)}개 - ${description}`);
    });
}

generateFacilityList()
    .then(() => {
        console.log('\n✅ Complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
