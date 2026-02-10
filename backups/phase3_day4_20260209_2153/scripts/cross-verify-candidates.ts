import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

// CSV 파싱 함수
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// 주소 정규화 함수
function normalizeAddress(addr: string): string {
    if (!addr) return '';
    return addr
        .replace(/\s+/g, '')
        .replace(/부산광역시/g, '부산')
        .replace(/서울특별시/g, '서울')
        .replace(/대구광역시/g, '대구')
        .replace(/인천광역시/g, '인천')
        .replace(/광주광역시/g, '광주')
        .replace(/대전광역시/g, '대전')
        .replace(/울산광역시/g, '울산')
        .replace(/세종특별자치시/g, '세종')
        .replace(/경기도/g, '경기')
        .replace(/강원특별자치도|강원도/g, '강원')
        .replace(/충청북도/g, '충북')
        .replace(/충청남도/g, '충남')
        .replace(/전북특별자치도|전라북도/g, '전북')
        .replace(/전라남도/g, '전남')
        .replace(/경상북도/g, '경북')
        .replace(/경상남도/g, '경남')
        .replace(/제주특별자치도|제주도/g, '제주')
        .replace(/\(.*\)/g, '')
        .replace(/장례식장/g, '')
        .split(',')[0].trim();
}

function normalizeName(name: string): string {
    return name
        .replace(/\s+/g, '')
        .replace(/\(주\)|\(유\)|주식회사|유한회사/g, '')
        .replace(/학교법인|사회복지법인|의료법인/g, '')
        .replace(/한림대학교|인제대학교|계명대학교|순천향대학교|가톨릭대학교|고려대학교|한양대학교|연세대학교|건양대학교|원광대학교|대구대학교|경상대학교|경북대학교|부산대학교|충남대학교|충북대학교|전남대학교|전북대학교|강원대학교|제주대학교/g, '')
        .replace(/대학교|부속|의료원|문화원|장례문화원|장례예식장|장례식장|장례원|예지원|국화원/g, '')
        .toLowerCase();
}

function normalizePhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
}

async function crossVerify() {
    console.log("🔍 신규 후보 교차 검증 시작...\n");

    // 1. DB 데이터 로드
    let dbFacilities: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, phone, type, lat, lng, data_source')
            .eq('type', 'funeral')
            .range(from, from + step - 1);

        if (error) {
            console.error(`❌ Supabase Error:`, error);
            break;
        }
        if (data) {
            dbFacilities = [...dbFacilities, ...data];
            if (data.length < step) hasMore = false;
            else from += step;
        } else hasMore = false;
    }

    console.log(`📦 DB에서 ${dbFacilities.length}개 시설 로드 완료`);

    const dbItems = dbFacilities.map(f => ({
        ...f,
        normName: normalizeName(f.name),
        normAddr: normalizeAddress(f.address),
        normPhone: normalizePhone(f.phone)
    }));

    // 2. 후보 CSV 로드
    const candidateFile = path.resolve(process.cwd(), '신규_장례식장_등록후보_186.csv');
    const content = fs.readFileSync(candidateFile, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    const candidates: any[] = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 3) continue;

        const name = cols[0]?.replace(/"/g, '').trim();
        const address = cols[1]?.replace(/"/g, '').trim();
        const phone = cols[2]?.replace(/"/g, '').trim();

        if (!name || !address) continue;

        candidates.push({
            name,
            address,
            phone,
            normName: normalizeName(name),
            normAddr: normalizeAddress(address),
            normPhone: normalizePhone(phone)
        });
    }

    console.log(`📋 후보 ${candidates.length}개 로드 완료\n`);

    // 3. 교차 검증
    const results = {
        exactNameMatch: [] as any[],
        exactAddressMatch: [] as any[],
        exactPhoneMatch: [] as any[],
        sameAddressDifferentName: [] as any[],
        similarNameSameAddress: [] as any[],
        trulyNew: [] as any[]
    };

    for (const candidate of candidates) {
        let matched = false;
        let matchType = '';
        let matchedFacility: any = null;

        // 이름 완전 일치
        const nameMatch = dbItems.find(db => db.normName === candidate.normName);
        if (nameMatch) {
            results.exactNameMatch.push({ candidate, db: nameMatch });
            matched = true;
            matchType = '이름 일치';
            matchedFacility = nameMatch;
        }

        // 주소 완전 일치
        const addrMatch = dbItems.find(db =>
            db.normAddr === candidate.normAddr && candidate.normAddr.length > 10
        );
        if (addrMatch && !matched) {
            if (addrMatch.normName !== candidate.normName) {
                results.sameAddressDifferentName.push({ candidate, db: addrMatch });
            } else {
                results.exactAddressMatch.push({ candidate, db: addrMatch });
            }
            matched = true;
            matchType = '주소 일치';
            matchedFacility = addrMatch;
        }

        // 전화번호 일치
        if (candidate.normPhone && candidate.normPhone.length >= 9) {
            const phoneMatch = dbItems.find(db =>
                db.normPhone === candidate.normPhone && candidate.normPhone.length >= 9
            );
            if (phoneMatch && !matched) {
                results.exactPhoneMatch.push({ candidate, db: phoneMatch });
                matched = true;
                matchType = '전화번호 일치';
                matchedFacility = phoneMatch;
            }
        }

        // 유사 이름 + 주소 부분 일치
        if (!matched) {
            const similarMatch = dbItems.find(db => {
                const nameSimilar = db.normName.includes(candidate.normName) ||
                    candidate.normName.includes(db.normName);
                const addrSimilar = db.normAddr.startsWith(candidate.normAddr.substring(0, 15)) ||
                    candidate.normAddr.startsWith(db.normAddr.substring(0, 15));
                return nameSimilar && addrSimilar && candidate.normAddr.length > 10;
            });

            if (similarMatch) {
                results.similarNameSameAddress.push({ candidate, db: similarMatch });
                matched = true;
                matchType = '유사 매칭';
                matchedFacility = similarMatch;
            }
        }

        if (!matched) {
            results.trulyNew.push(candidate);
        }
    }

    // 4. 보고서 생성
    console.log(`\n📊 교차 검증 결과:`);
    console.log(`   - 이름 완전 일치: ${results.exactNameMatch.length}개`);
    console.log(`   - 주소 완전 일치: ${results.exactAddressMatch.length}개`);
    console.log(`   - 전화번호 일치: ${results.exactPhoneMatch.length}개`);
    console.log(`   - 같은 주소, 다른 이름: ${results.sameAddressDifferentName.length}개`);
    console.log(`   - 유사 이름 + 주소: ${results.similarNameSameAddress.length}개`);
    console.log(`   - 진짜 신규: ${results.trulyNew.length}개\n`);

    let report = `# 신규 후보 교차 검증 보고서\n\n`;
    report += `**생성일시**: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `## 📊 요약\n\n`;
    report += `| 구분 | 개수 |\n`;
    report += `|------|------|\n`;
    report += `| 후보 총 개수 | ${candidates.length} |\n`;
    report += `| 이름 완전 일치 | ${results.exactNameMatch.length} |\n`;
    report += `| 주소 완전 일치 | ${results.exactAddressMatch.length} |\n`;
    report += `| 전화번호 일치 | ${results.exactPhoneMatch.length} |\n`;
    report += `| 같은 주소, 다른 이름 | ${results.sameAddressDifferentName.length} |\n`;
    report += `| 유사 이름 + 주소 | ${results.similarNameSameAddress.length} |\n`;
    report += `| 진짜 신규 | ${results.trulyNew.length} |\n\n`;

    // 이름 완전 일치
    if (results.exactNameMatch.length > 0) {
        report += `## ⚠️ 이름 완전 일치 (${results.exactNameMatch.length}개)\n\n`;
        report += `| 후보 시설명 | 후보 주소 | DB 시설명 | DB 주소 | DB ID | 좌표 | 데이터 출처 |\n`;
        report += `|------------|----------|-----------|---------|-------|------|------------|\n`;
        results.exactNameMatch.forEach(({ candidate, db }) => {
            report += `| ${candidate.name} | ${candidate.address} | ${db.name} | ${db.address} | ${db.id} | ${db.latitude},${db.longitude} | ${db.data_source || 'N/A'} |\n`;
        });
        report += `\n`;
    }

    // 같은 주소, 다른 이름
    if (results.sameAddressDifferentName.length > 0) {
        report += `## 🔍 같은 주소, 다른 이름 (${results.sameAddressDifferentName.length}개)\n\n`;
        report += `| 후보 시설명 | 후보 주소 | DB 시설명 | DB 주소 | DB ID | 좌표 | 데이터 출처 |\n`;
        report += `|------------|----------|-----------|---------|-------|------|------------|\n`;
        results.sameAddressDifferentName.forEach(({ candidate, db }) => {
            report += `| ${candidate.name} | ${candidate.address} | ${db.name} | ${db.address} | ${db.id} | ${db.latitude},${db.longitude} | ${db.data_source || 'N/A'} |\n`;
        });
        report += `\n`;
    }

    // 전화번호 일치
    if (results.exactPhoneMatch.length > 0) {
        report += `## 📞 전화번호 일치 (${results.exactPhoneMatch.length}개)\n\n`;
        report += `| 후보 시설명 | 후보 전화 | DB 시설명 | DB 전화 | DB ID | 좌표 | 데이터 출처 |\n`;
        report += `|------------|----------|-----------|---------|-------|------|------------|\n`;
        results.exactPhoneMatch.forEach(({ candidate, db }) => {
            report += `| ${candidate.name} | ${candidate.phone} | ${db.name} | ${db.phone} | ${db.id} | ${db.latitude},${db.longitude} | ${db.data_source || 'N/A'} |\n`;
        });
        report += `\n`;
    }

    // 진짜 신규
    if (results.trulyNew.length > 0) {
        report += `## ✨ 진짜 신규 시설 (${results.trulyNew.length}개)\n\n`;
        report += `| 시설명 | 주소 | 전화번호 |\n`;
        report += `|--------|------|----------|\n`;
        results.trulyNew.forEach(c => {
            report += `| ${c.name} | ${c.address} | ${c.phone} |\n`;
        });
        report += `\n`;
    }

    const reportPath = path.resolve(process.cwd(), 'cross_verification_report.md');
    fs.writeFileSync(reportPath, report, 'utf-8');

    console.log(`✅ 보고서 생성 완료: ${reportPath}`);
}

crossVerify();
