/**
 * Pre-commit 커스텀 검사 스크립트
 * CLAUDE.md 규칙을 자동으로 검증합니다.
 *
 * 검사 항목:
 * 1. 시크릿/API 키 하드코딩
 * 2. 하드코딩된 이메일
 * 3. anon supabase client로 write 작업
 * 4. console.log (production 코드)
 * 5. 금지 파일 커밋 (.env, *.csv, 루트 *.sql, debug_*.json)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let errors = [];
let warnings = [];

// 스테이징된 파일 목록
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

// 스테이징된 파일 내용 가져오기
function getStagedContent(filePath) {
  try {
    return execSync(`git show :${filePath}`, { encoding: 'utf-8' });
  } catch {
    return '';
  }
}

const stagedFiles = getStagedFiles();

if (stagedFiles.length === 0) {
  console.log(`${GREEN}No staged files to check.${RESET}`);
  process.exit(0);
}

// =========================================
// 검사 1: 금지 파일 패턴
// =========================================
const FORBIDDEN_PATTERNS = [
  { pattern: /^\.env($|\.local|\..*\.temp)/, desc: '.env 파일' },
  { pattern: /\.csv$/, desc: 'CSV 데이터 파일' },
  { pattern: /^debug_.*\.json$/, desc: '디버그 JSON 파일' },
  { pattern: /^[^/]+\.sql$/, desc: '루트 SQL 파일 (migrations/ 폴더에서만 허용)' },
];

for (const file of stagedFiles) {
  const basename = path.basename(file);
  for (const { pattern, desc } of FORBIDDEN_PATTERNS) {
    // 루트 SQL: 파일이 루트에 있는 경우만 (경로에 / 없음)
    if (desc.includes('루트 SQL')) {
      if (!file.includes('/') && pattern.test(basename)) {
        errors.push(`[금지파일] ${file} — ${desc}`);
      }
    } else if (pattern.test(basename)) {
      errors.push(`[금지파일] ${file} — ${desc}`);
    }
  }
}

// =========================================
// 검사 2~5: 코드 내용 검사 (TS/TSX만)
// =========================================
const tsFiles = stagedFiles.filter(f => /\.(ts|tsx)$/.test(f) && !f.includes('node_modules'));

for (const file of tsFiles) {
  const content = getStagedContent(file);
  if (!content) continue;

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const loc = `${file}:${lineNum}`;

    // 검사 2: 시크릿/API 키 패턴
    if (/(?:sk-|sk_live_|sk_test_|eyJhbGciOi|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36})/i.test(line)) {
      if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        errors.push(`[시크릿] ${loc} — API 키 또는 토큰이 하드코딩되어 있습니다`);
      }
    }

    // 검사 3: 하드코딩 이메일 (테스트/주석 제외)
    if (/['"`][a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}['"`]/.test(line)) {
      if (!line.trim().startsWith('//') && !line.trim().startsWith('*') && !file.includes('test')) {
        // placeholder 이메일은 허용
        if (!/example\.com|placeholder|test@/.test(line)) {
          warnings.push(`[하드코딩 이메일] ${loc} — 이메일 주소를 환경변수 또는 DB에서 로드하세요`);
        }
      }
    }

    // 검사 4: console.log (console.error, console.warn은 허용)
    if (/\bconsole\.log\b/.test(line)) {
      if (!line.trim().startsWith('//') && !file.includes('test') && !file.includes('scripts/')) {
        warnings.push(`[console.log] ${loc} — 프로덕션 코드에서 console.log 사용 금지 (console.error/warn 사용)`);
      }
    }
  }

  // 검사 5: anon supabase client write 패턴
  // import { supabase } 또는 import supabase 후 .insert/.update/.upsert/.delete 사용
  const hasAnonImport = /import\s+\{[^}]*\bsupabase\b[^}]*\}\s+from\s+['"].*supabaseClient/.test(content);
  if (hasAnonImport) {
    // 허용 파일 (supabaseClient.ts 자체, 공개 읽기 전용 유틸)
    const allowedFiles = ['lib/supabaseClient.ts', 'lib/supabaseClient.js'];
    if (!allowedFiles.some(af => file.endsWith(af))) {
      const writePatterns = /supabase\s*\.\s*from\s*\([^)]+\)\s*\.\s*(insert|update|upsert|delete)\b/g;
      let match;
      while ((match = writePatterns.exec(content)) !== null) {
        const beforeMatch = content.substring(0, match.index);
        const matchLine = beforeMatch.split('\n').length;
        errors.push(`[anon write] ${file}:${matchLine} — anon supabase client로 쓰기 작업 금지. getAuthClient() 사용 필요`);
      }
    }
  }

  // 검사 6: fallback 패턴 (client || supabase, client ? authClient : supabase)
  if (/\bclient\s*\|\|\s*supabase\b/.test(content) || /\btoken\s*\?\s*\w+\s*:\s*supabase\b/.test(content)) {
    warnings.push(`[fallback 패턴] ${file} — client || supabase / token ? x : supabase 패턴 금지 (CLAUDE.md 규칙 1)`);
  }
}

// =========================================
// 결과 출력
// =========================================
console.log(`\n${BOLD}=== Memorimap Pre-commit 검사 ===${RESET}\n`);
console.log(`검사 파일: ${stagedFiles.length}개 (TS/TSX: ${tsFiles.length}개)\n`);

if (warnings.length > 0) {
  console.log(`${YELLOW}${BOLD}경고 (${warnings.length}건):${RESET}`);
  warnings.forEach(w => console.log(`  ${YELLOW}⚠ ${w}${RESET}`));
  console.log('');
}

if (errors.length > 0) {
  console.log(`${RED}${BOLD}오류 (${errors.length}건):${RESET}`);
  errors.forEach(e => console.log(`  ${RED}✖ ${e}${RESET}`));
  console.log(`\n${RED}커밋이 차단되었습니다. 위 오류를 수정 후 다시 시도하세요.${RESET}\n`);
  process.exit(1);
} else {
  console.log(`${GREEN}${BOLD}✔ 모든 검사 통과${RESET}\n`);
  process.exit(0);
}
