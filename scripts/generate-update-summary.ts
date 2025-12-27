import * as fs from 'fs';
import * as path from 'path';

const logPath = path.resolve(process.cwd(), 'scripts/google_db_update_log.json');
const log = JSON.parse(fs.readFileSync(logPath, 'utf-8'));

// 스킵된 시설 찾기
const enrichmentPath = path.resolve(process.cwd(), 'scripts/google_enrichment_candidates_2025-12-27T14-50-54-891Z.json');
const candidates = JSON.parse(fs.readFileSync(enrichmentPath, 'utf-8'));

// 업데이트된 ID 목록
const updatedIds = new Set(log.updates.map((u: any) => u.id));

// 스킵된 시설 (mismatch 또는 데이터 없음)
const skipped = candidates.filter((c: any) => !updatedIds.has(c.db_id));

let output = `# 구글 데이터 DB 업데이트 결과\n\n`;
output += `**생성일시**: ${log.timestamp}\n\n`;
output += `---\n\n`;

output += `## ✅ 업데이트된 시설 (${log.updates.length}개)\n\n`;
output += `| # | 시설명 | 업데이트 항목 |\n`;
output += `|---|--------|---------------|\n`;
log.updates.forEach((u: any, i: number) => {
    output += `| ${i + 1} | ${u.name} | ${u.updates.join(', ')} |\n`;
});

output += `\n---\n\n`;

output += `## ⏭️ 스킵된 시설 (${skipped.length}개)\n\n`;
output += `| # | 시설명 | 상태 | 유사도 |\n`;
output += `|---|--------|------|--------|\n`;
skipped.forEach((s: any, i: number) => {
    output += `| ${i + 1} | ${s.original_name} | ${s.status} | ${(s.similarity_score * 100).toFixed(0)}% |\n`;
});

const outputPath = path.resolve(process.cwd(), 'scripts/update_result_summary.md');
fs.writeFileSync(outputPath, output, 'utf-8');
console.log(`✅ 저장 완료: ${outputPath}`);
console.log(`   업데이트: ${log.updates.length}개`);
console.log(`   스킵: ${skipped.length}개`);
