
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// 설정 (Paths Adjusted for Project Structure)
const CONFIG = {
    csvBackupPath: path.join(__dirname, '../backups'),
    outputPath: path.join(__dirname, '../backups/data_analysis'),
    logFile: 'data_analysis_log.txt'
};

// 로그 함수
const log = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());

    const logPath = path.join(CONFIG.outputPath, CONFIG.logFile);
    fs.appendFileSync(logPath, logMessage);
};

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// CSV 파일 찾기
const findCSVFiles = () => {
    log('=== CSV 파일 검색 시작 ===');

    const csvFiles = [];
    const searchDirs = [
        CONFIG.csvBackupPath
    ];

    const scanDir = (dir) => {
        try {
            if (!fs.existsSync(dir)) return;

            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    scanDir(fullPath);
                } else if (item.endsWith('.csv')) {
                    csvFiles.push({
                        name: item,
                        path: fullPath,
                        size: stat.size
                    });
                    log(`발견: ${item} (${(stat.size / 1024).toFixed(2)} KB)`);
                }
            });
        } catch (error) {
            log(`디렉토리 스캔 오류 (${dir}): ${error.message}`);
        }
    };

    searchDirs.forEach(dir => scanDir(dir));

    log(`총 ${csvFiles.length}개 CSV 파일 발견`);
    return csvFiles;
};

// CSV 파싱
const parseCSV = (filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = Papa.parse(content, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false // 모든 값을 문자열로 유지
        });

        return result.data;
    } catch (error) {
        log(`CSV 파싱 오류 (${filePath}): ${error.message}`);
        return null;
    }
};

// 시설 데이터 분석
const analyzeFacilities = (data, filename) => {
    log(`\n=== ${filename} 분석 시작 ===`);

    const analysis = {
        totalRows: data.length,
        columns: Object.keys(data[0] || {}),
        categories: {},
        types: {},
        samples: []
    };

    // 컬럼 이름 변형들 체크
    const categoryColumns = ['category', 'type', 'facilityType', 'facility_type', 'categories'];
    const nameColumns = ['name', 'facilityName', 'facility_name', 'title'];

    // 실제 존재하는 컬럼 찾기
    const categoryCol = categoryColumns.find(col => analysis.columns.includes(col));
    const nameCol = nameColumns.find(col => analysis.columns.includes(col));

    log(`사용 가능한 컬럼: ${analysis.columns.join(', ')}`);
    log(`카테고리 컬럼: ${categoryCol || '없음'}`);
    log(`이름 컬럼: ${nameCol || '없음'}`);

    // 데이터 분석
    data.forEach((row, index) => {
        // 카테고리 분석
        if (categoryCol && row[categoryCol]) {
            const category = row[categoryCol].trim();
            if (!analysis.categories[category]) {
                analysis.categories[category] = {
                    count: 0,
                    samples: []
                };
            }
            analysis.categories[category].count++;

            // 샘플 데이터 저장 (처음 3개만)
            if (analysis.categories[category].samples.length < 3 && nameCol) {
                analysis.categories[category].samples.push({
                    name: row[nameCol],
                    index: index
                });
            }
        }

        // type 컬럼도 체크
        if (row.type && row.type !== row[categoryCol]) {
            const type = row.type.trim();
            if (!analysis.types[type]) {
                analysis.types[type] = { count: 0 };
            }
            analysis.types[type].count++;
        }

        // 전체 샘플 (처음 5개)
        if (analysis.samples.length < 5) {
            analysis.samples.push(row);
        }
    });

    return analysis;
};

// 매핑 제안 생성
const generateMappingSuggestion = (analysis) => {
    log('\n=== 매핑 제안 생성 ===');

    const suggestions = {
        categoryMapping: {},
        enumDefinition: [],
        typescriptType: []
    };

    // 기존 카테고리 목록
    const categories = Object.keys(analysis.categories);

    log(`발견된 카테고리: ${categories.join(', ')}`);

    // 자동 매핑 추론
    const autoMapping = {
        '봉안시설': 'charnel_house',
        '장례식장': 'funeral_home',
        '자연장': 'natural_burial',
        '수목장': 'tree_burial',
        '반려동물': 'pet_memorial',
        '반려동물 추모': 'pet_memorial',
        '상조': 'sangjo',
        '해양장': 'sea_burial',
        '공원묘지': 'park_cemetery',
        '복합': 'complex'
    };

    categories.forEach(category => {
        // 자동 매핑 시도
        let suggestion = autoMapping[category];

        // 부분 매칭 시도
        if (!suggestion) {
            for (const [key, value] of Object.entries(autoMapping)) {
                if (category.includes(key) || key.includes(category)) {
                    suggestion = value;
                    break;
                }
            }
        }

        // 기본값
        if (!suggestion) {
            suggestion = category.toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '');
        }

        suggestions.categoryMapping[category] = suggestion;

        if (!suggestions.enumDefinition.includes(suggestion)) {
            suggestions.enumDefinition.push(suggestion);
            suggestions.typescriptType.push(suggestion);
        }
    });

    return suggestions;
};

// 마이그레이션 스크립트 생성
const generateMigrationSQL = (analysis, suggestions) => {
    log('\n=== 마이그레이션 SQL 생성 ===');

    const enumValues = suggestions.enumDefinition.join("', '");

    const sql = `
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 실제 데이터 기반 마이그레이션 스크립트
-- 생성일: ${new Date().toISOString()}
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- [1] ENUM 타입 생성 (실제 데이터 기반)
DROP TYPE IF EXISTS facility_type CASCADE;
CREATE TYPE facility_type AS ENUM ('${enumValues}');

COMMENT ON TYPE facility_type IS '실제 데이터에서 발견된 카테고리: ${Object.keys(analysis.categories).join(', ')}';

-- [2] 카테고리 매핑 참조 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS category_mapping (
  old_category TEXT PRIMARY KEY,
  new_category facility_type NOT NULL,
  display_name TEXT NOT NULL
);

-- [3] 매핑 데이터 삽입
${Object.entries(suggestions.categoryMapping).map(([old, new_]) =>
        `INSERT INTO category_mapping (old_category, new_category, display_name) 
   VALUES ('${old}', '${new_}', '${old}') 
   ON CONFLICT (old_category) DO UPDATE SET new_category = '${new_}';`
    ).join('\n')}

-- [4] 기존 데이터 마이그레이션 (memorial_spaces → facilities)
-- 주의: 실제 실행 전에 백업 필수!

-- 4-1. 임시 백업 테이블 생성
CREATE TABLE IF NOT EXISTS memorial_spaces_backup AS 
SELECT * FROM memorial_spaces;

-- 4-2. 카테고리 변환
UPDATE memorial_spaces ms
SET category = (
  SELECT new_category 
  FROM category_mapping cm 
  WHERE cm.old_category = ms.category
)
WHERE category IN (SELECT old_category FROM category_mapping);

-- 4-3. facilities 테이블로 데이터 복사 (컬럼명 매핑)
INSERT INTO facilities (
  id, 
  name, 
  category, 
  address, 
  description,
  location,
  created_at,
  updated_at
)
SELECT 
  id,
  name,
  category::facility_type, -- 타입 캐스팅
  address,
  description,
  location,
  created_at,
  updated_at
FROM memorial_spaces
ON CONFLICT (id) DO NOTHING;

-- [5] 검증 쿼리
SELECT 
  category,
  COUNT(*) as count
FROM facilities
GROUP BY category
ORDER BY count DESC;

COMMENT ON TABLE facilities IS '마이그레이션 완료: ${new Date().toISOString()}';
`;

    return sql;
};

// TypeScript 타입 생성
const generateTypeScriptTypes = (analysis, suggestions) => {
    log('\n=== TypeScript 타입 정의 생성 ===');

    const enumValues = suggestions.typescriptType.map(v => `  | '${v}'`).join('\n');

    const categoryLabels = Object.entries(suggestions.categoryMapping)
        .map(([old, new_]) => `  '${new_}': '${old}'`)
        .join(',\n');

    const typescript = `
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 실제 데이터 기반 타입 정의
// 생성일: ${new Date().toISOString()}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// [1] Facility 타입 (DB ENUM과 일치)
export type FacilityType = 
${enumValues};

// [2] 카테고리 한글 라벨
export const CATEGORY_LABELS: Record<FacilityType, string> = {
${categoryLabels}
};

// [3] 역방향 매핑 (한글 → 영문)
export const CATEGORY_VALUES: Record<string, FacilityType> = {
${Object.entries(suggestions.categoryMapping).map(([old, new_]) =>
        `  '${old}': '${new_}'`
    ).join(',\n')}
};

// [4] 헬퍼 함수
export function getCategoryLabel(category: FacilityType): string {
  return CATEGORY_LABELS[category] || category;
}

export function getCategoryValue(label: string): FacilityType {
  return CATEGORY_VALUES[label] || 'charnel_house';
}

// [5] Facility 인터페이스 (업데이트)
export interface Facility {
  id: string;
  name: string;
  category: FacilityType; // ← 수정됨!
  address: string;
  description?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  images?: string[];
  priceRange?: string;
  rating?: number;
  reviewCount?: number;
  features?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

// [6] 통계 정보 (참고용)
/*
실제 데이터 분포:
${Object.entries(analysis.categories).map(([cat, info]) =>
        `  ${cat}: ${info.count}개`
    ).join('\n')}

총 시설 수: ${analysis.totalRows}
*/
`;

    return typescript;
};

// 상세 리포트 생성
const generateDetailedReport = (allAnalysis, suggestions) => {
    log('\n=== 상세 리포트 생성 ===');

    const report = `
╔════════════════════════════════════════════════════════════╗
║           데이터 분석 및 마이그레이션 리포트              ║
╚════════════════════════════════════════════════════════════╝

생성일시: ${new Date().toISOString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 분석된 CSV 파일
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${Object.entries(allAnalysis).map(([filename, analysis]) => `
파일: ${filename}
- 총 행 수: ${analysis.totalRows}
- 컬럼: ${analysis.columns.join(', ')}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 발견된 카테고리 분석
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${Object.entries(allAnalysis).map(([filename, analysis]) => {
        if (Object.keys(analysis.categories).length > 0) {
            return `
${filename}:
${Object.entries(analysis.categories).map(([cat, info]) => `
  "${cat}"
    개수: ${info.count}
    샘플: ${info.samples.map(s => s.name).join(', ')}
`).join('\n')}`;
        }
        return '';
    }).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 제안된 카테고리 매핑
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${Object.entries(suggestions.categoryMapping).map(([old, new_]) =>
        `"${old}" → "${new_}"`
    ).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 생성된 파일
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. migration.sql          - 데이터베이스 마이그레이션 스크립트
2. types.ts              - TypeScript 타입 정의
3. category-mapper.ts    - 카테고리 변환 유틸리티
4. data_analysis.json    - 상세 분석 데이터 (JSON)
5. MIGRATION_GUIDE.txt   - 마이그레이션 가이드

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  다음 단계
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 카테고리 매핑 검토
   → 제안된 매핑이 정확한지 확인
   → 필요시 수동으로 수정

2. TypeScript 타입 적용
   → types.ts를 프로젝트에 복사
   → 기존 타입 정의 교체

3. 마이그레이션 테스트
   → 개발 환경에서 먼저 테스트
   → migration.sql 단계별 실행

4. 프론트엔드 코드 수정
   → category-mapper.ts 사용
   → 모든 'type' 참조를 'category'로 변경

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    return report;
};

// 카테고리 매퍼 유틸리티 생성
const generateCategoryMapper = (suggestions) => {
    const mapper = `
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 카테고리 변환 유틸리티
// 생성일: ${new Date().toISOString()}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { FacilityType, CATEGORY_LABELS, CATEGORY_VALUES } from './types';

/**
 * DB 카테고리 값을 한글 라벨로 변환
 */
export function getCategoryLabel(category: FacilityType): string {
  return CATEGORY_LABELS[category] || category;
}

/**
 * 한글 라벨을 DB 카테고리 값으로 변환
 */
export function getCategoryValue(label: string): FacilityType {
  return CATEGORY_VALUES[label] || 'charnel_house';
}

/**
 * 모든 카테고리 목록 (한글)
 */
export function getAllCategoryLabels(): string[] {
  return Object.values(CATEGORY_LABELS);
}

/**
 * 모든 카테고리 값 (영문)
 */
export function getAllCategoryValues(): FacilityType[] {
  return Object.keys(CATEGORY_LABELS) as FacilityType[];
}

/**
 * 카테고리 선택 옵션 생성
 */
export function getCategoryOptions() {
  return getAllCategoryValues().map(value => ({
    value,
    label: getCategoryLabel(value)
  }));
}

/**
 * 레거시 데이터 변환 (마이그레이션용)
 */
export function migrateLegacyCategory(oldCategory: string): FacilityType {
  // 기존 한글 카테고리를 새 영문 값으로 변환
  return getCategoryValue(oldCategory);
}
`;

    return mapper;
};

// 메인 함수
const main = () => {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         CSV 데이터 분석 & 마이그레이션 생성               ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n');

    try {
        ensureDir(CONFIG.outputPath);

        // 1. CSV 파일 찾기
        const csvFiles = findCSVFiles();

        if (csvFiles.length === 0) {
            console.log('\n❌ CSV 파일을 찾을 수 없습니다!');
            console.log('백업 경로를 확인하세요: ' + CONFIG.csvBackupPath);
            return;
        }

        // 2. 시설 관련 CSV 분석
        const facilityFiles = csvFiles.filter(f =>
            f.name.includes('memorial_spaces') ||
            f.name.includes('facilities') ||
            f.name.includes('facility')
        );

        if (facilityFiles.length === 0) {
            console.log('\n⚠️  시설 관련 CSV를 찾을 수 없습니다.');
            console.log('발견된 파일:', csvFiles.map(f => f.name).join(', '));
            console.log('\n모든 CSV를 분석합니다...');
        }

        const allAnalysis = {};
        const filesToAnalyze = facilityFiles.length > 0 ? facilityFiles : csvFiles.slice(0, 5);

        filesToAnalyze.forEach(file => {
            const data = parseCSV(file.path);
            if (data && data.length > 0) {
                allAnalysis[file.name] = analyzeFacilities(data, file.name);
            }
        });

        // 3. 매핑 제안 생성
        const mainAnalysis = Object.values(allAnalysis)[0];
        if (!mainAnalysis) {
            console.log('\n❌ 분석할 데이터가 없습니다.');
            return;
        }

        const suggestions = generateMappingSuggestion(mainAnalysis);

        // 4. 파일 생성
        console.log('\n파일 생성 중...\n');

        // SQL
        const sql = generateMigrationSQL(mainAnalysis, suggestions);
        fs.writeFileSync(path.join(CONFIG.outputPath, 'migration.sql'), sql);
        log('✓ migration.sql 생성');

        // TypeScript
        const typescript = generateTypeScriptTypes(mainAnalysis, suggestions);
        fs.writeFileSync(path.join(CONFIG.outputPath, 'types.ts'), typescript);
        log('✓ types.ts 생성');

        // Mapper
        const mapper = generateCategoryMapper(suggestions);
        fs.writeFileSync(path.join(CONFIG.outputPath, 'category-mapper.ts'), mapper);
        log('✓ category-mapper.ts 생성');

        // JSON
        const jsonData = {
            timestamp: new Date().toISOString(),
            analysis: allAnalysis,
            suggestions: suggestions
        };
        fs.writeFileSync(
            path.join(CONFIG.outputPath, 'data_analysis.json'),
            JSON.stringify(jsonData, null, 2)
        );
        log('✓ data_analysis.json 생성');

        // 리포트
        const report = generateDetailedReport(allAnalysis, suggestions);
        fs.writeFileSync(path.join(CONFIG.outputPath, 'MIGRATION_REPORT.txt'), report);
        log('✓ MIGRATION_REPORT.txt 생성');

        // 5. 결과 출력
        console.log('\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✓ 분석 완료!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\n📁 결과 위치: ${CONFIG.outputPath}`);
        console.log('\n생성된 파일:');
        console.log('  1. MIGRATION_REPORT.txt  ← 먼저 이것을 확인하세요!');
        console.log('  2. migration.sql');
        console.log('  3. types.ts');
        console.log('  4. category-mapper.ts');
        console.log('  5. data_analysis.json');
        console.log('\n');

        // 카테고리 요약 출력
        console.log('발견된 카테고리:');
        Object.entries(mainAnalysis.categories).forEach(([cat, info]) => {
            console.log(`  "${cat}" → "${suggestions.categoryMapping[cat]}" (${info.count}개)`);
        });
        console.log('\n');

    } catch (error) {
        log(`치명적 오류: ${error.message}`);
        console.error('\n❌ 오류 발생:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

// 실행
if (require.main === module) {
    main();
}

module.exports = { main, analyzeFacilities, generateMappingSuggestion };
