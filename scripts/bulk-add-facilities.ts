
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';
const KAKAO_API_KEY = process.env.VITE_KAKAO_REST_API_KEY || '';

const RAW_TEXT = `봉안시설
대한불교정음사원
충청북도 청주시 서원구 3순환로644번길 33 (죽림동, 대한불교정음사원)
★ 0
(0)

파주추모공원 봉안당
봉안시설
파주추모공원 봉안당
경기도 파주시 파주읍 약수골길 67 (연풍리)
★ 0
(0)

만인산 만인사 봉안당
봉안시설
만인산 만인사 봉안당
충청남도 금산군 복수면 다복로 525-35 (용진리, 만인사)
★ 0
(0)

약사사지장전추모관
봉안시설
약사사지장전추모관
인천광역시 남동구 풀무로 48 (간석동)
★ 0
(0)

천주교 금상동성당 하늘자리
봉안시설
천주교 금상동성당 하늘자리
전라북도 전주시 덕진구 전진로 107-13 (금상동)
★ 0
(0)

관음사추모관
봉안시설
관음사추모관
전라남도 담양군 담양읍 깊은실길 35 (학동리)
★ 0
(0)

상월사 봉안당
봉안시설
상월사 봉안당
경기도 안성시 양성면 천덕산로 919 (동항리)
★ 0
(0)

구미시공설숭조당 제2관
봉안시설
구미시공설숭조당 제2관
경상북도 구미시 옥성면 선상동로 419-1 (초곡리)
★ 0
(0)

광천사 봉안당
봉안시설
광천사 봉안당
경상남도 양산시 하북면 백록로 116 (백록리)
★ 0
(0)

경신하늘뜰공원 봉안당
봉안시설
경신하늘뜰공원 봉안당
경기도 양주시 남면 화합로430번길 98(경신리, 경신하늘뜰공원)
★ 0
(0)

(주)광림공원 동산공원묘원(봉안)
봉안시설
(주)광림공원 동산공원묘원(봉안)
강원특별자치도 춘천시 동산면 종자리로 331-50 (군자리, 춘천시공설묘원)
★ 0
(0)

수암사 영혼의쉼터
봉안시설
수암사 영혼의쉼터
경상남도 의령군 의령읍 수암로 267 (하리)
★ 0
(0)

오향중흥교회 봉안당
봉안시설
오향중흥교회 봉안당
경기도 광주시 곤지암읍 가마을길 83-19 (오향리)
★ 0
(0)

정선하늘원
봉안시설
정선하늘원
강원특별자치도 정선군 여량면 서동로 3867-26 (남곡리, 정선하늘공원)
★ 0
(0)

상상추모공원
봉안시설
상상추모공원
전라남도 함평군 함평읍 함장로 933-43 (수호리)
★ 0
(0)

서대산추모공원 봉안당
봉안시설
서대산추모공원 봉안당
충청남도 금산군 추부면 서대동기길 100 (서대리)
★ 0
(0)

지장정사 연화대
봉안시설
지장정사 연화대
충청남도 논산시 노성면 화곡안길 103 (화곡리, 지장정사,템플스테이,연화대,법륜종재단)
★ 0
(0)

밀양성당 천상낙원
봉안시설
밀양성당 천상낙원
경상남도 밀양시 밀양대공원로 74 (교동)
★ 0
(0)

김포연화사추모관
봉안시설
김포연화사추모관
경기도 김포시 하성면 연화봉로 233 (후평리)
★ 0
(0)

동탄납골추모관
봉안시설
동탄납골추모관
경기도 화성시 동탄기흥로 64-42 (송동, 법왕청)
★ 0
(0)

순천시립추모공원 1봉안당
봉안시설
순천시립추모공원 1봉안당
전라남도 순천시 양율길 132 (야흥동)
★ 0
(0)

봉은사 봉안당
봉안시설
봉은사 봉안당
충청북도 충주시 소태면 주치길 135-45 (오량리, 봉은사)
★ 0
(0)

성불사 봉안당
봉안시설
성불사 봉안당
충청남도 논산시 상월면 상월로486번길 81 (대명리)
★ 0
(0)

연꽃피우는 행복도량 용문사
봉안시설
연꽃피우는 행복도량 용문사
경기도 김포시 월곶면 대곶로 570 (갈산리, 용문사)
★ 0
(0)

천주사 영탑공원
봉안시설
천주사 영탑공원
경상북도 문경시 동로면 천주사길 108 (간송리, 천주사)
★ 0
(0)

창원시립마산영생원
봉안시설
창원시립마산영생원
경상남도 창원시 마산합포구 진동면 공원묘원로 136-106 (인곡리, 영생원)
★ 0
(0)

안흥동공설묘지(봉안시설)
봉안시설
안흥동공설묘지(봉안시설)
경기도 동두천시 안흥동 산62
★ 0
(0)

울릉하늘섬공원
봉안시설
울릉하늘섬공원
경상북도 울릉군 서면 태하령길 314 (남서리)
★ 0
(0)

화천공원묘원 봉안당
봉안시설
화천공원묘원 봉안당
강원특별자치도 화천군 하남면 원천리 9-13
★ 0
(0)

합천추모공원 봉안당
봉안시설
합천추모공원 봉안당
경상남도 합천군 합천읍 합천호수로 1633 (합천리)
★ 0
(0)

광릉추모공원 봉안묘
봉안시설
광릉추모공원 봉안묘
경기도 포천시 내촌면 부마로 341 (마명리)
★ 0
(0)

하늘문 봉안당
봉안시설
하늘문 봉안당
경기도 안성시 양성면 미리내성지로 386-27 (미산리, 미리내실버타운)
★ 0
(0)

추모관 천상의집
봉안시설
추모관 천상의집
전라남도 해남군 해남읍 해남로 160-83 (신안리, 선각사)
★ 0
(0)

천주교 대구교구 죽도성당
봉안시설
천주교 대구교구 죽도성당
경상북도 포항시 북구 죽도로 20 (죽도동)
★ 0
(0)

국원하늘정원
봉안시설
국원하늘정원
경상남도 사천시 곤명면 막골길 267-195 (마곡리, 은적납골공원)
★ 0
(0)

진주내동공원묘원 봉안당
봉안시설
진주내동공원묘원 봉안당
경상남도 진주시 내동면 유수길75번길 8-214 (유수리, 진주내동공동묘원)
★ 0
(0)

불조사 휴안추모관
봉안시설
불조사 휴안추모관
경상남도 김해시 상동면 상동로 178-54 (우계리, 불조사)
★ 0
(0)

극락사추모원 하늘정원
봉안시설
극락사추모원 하늘정원
경상북도 칠곡군 지천면 창평로 415 (창평리)
★ 0
(0)

개원추모공원 봉안탑
봉안시설
개원추모공원 봉안탑
경상북도 영천시 신녕면 장수로 2238-28 (화남리)
★ 0
(0)

안정사 납골당
봉안시설
안정사 납골당
경상남도 통영시 광도면 안정1길 363 (안정리)
★ 0
(0)

지장사 봉안당
봉안시설
지장사 봉안당
전라남도 나주시 왕곡면 신포내동길 14-29 (신포리)
★ 0
(0)

혜명사 봉안당
봉안시설
혜명사 봉안당
충청남도 아산시 염치읍 쌍죽길 133-7 (쌍죽리)
★ 0
(0)

용봉사 납골당
봉안시설
용봉사 납골당
경상남도 통영시 광도면 향교옆길 71-26 (죽림리)
★ 0
(0)

정통불교조계종 총본산 세원사
봉안시설
정통불교조계종 총본산 세원사
경상남도 의령군 칠곡면 칠곡로1길 56세원사 (도산리)
★ 0
(0)

무량사추모관
봉안시설
무량사추모관
경상북도 포항시 북구 흥해읍 동해대로1393번길 111-99 (초곡리)
★ 0
(0)

광주영락공원 봉안담
봉안시설
광주영락공원 봉안담
광주광역시 북구 효령동 100-2
★ 0
(0)

대한불교조계종 무일선원
봉안시설
대한불교조계종 무일선원
경상북도 경주시 감포읍 회곡길 127(대본리, 관음사)
★ 0
(0)

광주영락공원 봉안묘
봉안시설
광주영락공원 봉안묘
광주광역시 북구 효령동 산47-1
★ 0
(0)

관음사 추모관
봉안시설
관음사 추모관
강원특별자치도 원주시 행구로 533-3 (행구동, 관음사)
★ 0
(0)

우도면 봉안당
봉안시설
우도면 봉안당
제주특별자치도 제주시 우도면 영일길 80-10 (연평리, 우도장례식장)
★ 0
(0)

영월군 봉안당
봉안시설
영월군 봉안당
강원특별자치도 영월군 주천면 솔치로 240-120 (신일리)
★ 0
(0)

장수암 자연장지
자연장
장수암 자연장지
경상남도 창원시 마산합포구 구산면 원전1길 141 (심리, 장수암)
★ 0
(0)

포포즈 반려동물장례식장 김포점
동물장묘
포포즈 반려동물장례식장 김포점
경기도 김포시 월곶면 애기봉로 262 포포즈 김포점
★ 0
(0)

펫바라기 일산점
동물장묘
펫바라기 일산점
경기도 고양시 일산동구 은마길63번길 25-2 펫바라기
★ 0
(0)

우리펫
동물장묘
우리펫
대구광역시 서구 새방로27길 39 3층
★ 0
(0)

서울성모장례식장
장례식장
서울성모장례식장
서울특별시 서초구 반포대로 222 (반포동, 가톨릭대학교성의교정)
★ 4.78
(5)`;

async function getCoords(query: string) {
    if (!NAVER_CLIENT_ID) return null;
    try {
        const response = await axios.get('https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode', {
            params: { query: query },
            headers: { 'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID, 'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET }
        });
        if (response.data.addresses.length > 0) {
            const { x, y, roadAddress, jibunAddress } = response.data.addresses[0];
            return { lat: parseFloat(y), lng: parseFloat(x), address: roadAddress || jibunAddress };
        }
    } catch (e) { }

    // Fallback to Kakao
    if (!KAKAO_API_KEY) return null;
    try {
        const response = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
            params: { query: query },
            headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` }
        });
        if (response.data.documents.length > 0) {
            const { y, x, address_name } = response.data.documents[0];
            return { lat: parseFloat(y), lng: parseFloat(x), address: address_name };
        }
    } catch (e) { }

    return null;
}

function parseText(text: string) {
    const list = [];
    const blocks = text.split('\n\n');
    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 3) continue;

        // Pattern logic:
        // Case 1: Type / Name / Address ... (Starts with Type)
        // Case 2: Name / Type / Name / Address ...

        let rawType = '';
        let name = '';
        let address = '';

        // Simple heuristic: Line 2 is often type or name.
        if (lines[0].includes('봉안') || lines[0].includes('자연') || lines[0].includes('동물') || lines[0].includes('장례')) {
            // Line 1 is type? Very rare in this input.
            // Actually input starts with "봉안시설\n대한불교..."
            rawType = lines[0];
            name = lines[1];
            address = lines[2];
        } else if (lines[1].includes('봉안') || lines[1].includes('자연') || lines[1].includes('동물') || lines[1].includes('장례')) {
            // Line 1: Name, Line 2: Type, Line 3: Name(Repeat), Line 4: Address
            name = lines[0];
            rawType = lines[1];
            // Line 3 is repeat name
            address = lines[3];
        } else {
            // Maybe address is line 2?
            name = lines[0];
            // Try to find address in remaining lines
            address = lines.find(l => l.includes('시') && (l.includes('구') || l.includes('면') || l.includes('동'))) || lines[1];
        }

        // Fallback cleanup
        if (address.startsWith('★')) address = lines[lines.length - 3]; // Heuristic failure

        let dbType = 'charnel'; // Default
        if (rawType.includes('자연') || name.includes('수목') || name.includes('잔디')) dbType = 'natural';
        if (rawType.includes('동물') || rawType.includes('펫') || name.includes('포포즈') || name.includes('펫')) dbType = 'pet';
        if (rawType.includes('장례식장') || name.includes('장례식장')) dbType = 'funeral';
        if (rawType.includes('봉안')) dbType = 'charnel';

        list.push({ name, address, type: dbType });
    }
    return list;
}

async function main() {
    console.log("🚀 대규모 시설 추가 및 검증 시작...");

    const facilities = parseText(RAW_TEXT);
    console.log(`Parsed ${facilities.length} facilities.`);

    for (const fac of facilities) {
        console.log(`Processing [${fac.type}] ${fac.name}...`);

        const coords = await getCoords(fac.address);
        if (!coords) {
            console.log(`  ❌ Location not found: ${fac.address}`);
            continue;
        }

        console.log(`  📍 Found: ${coords.lat}, ${coords.lng} (${coords.address})`);

        // Check exist
        const { data: existing } = await supabase
            .from('memorial_spaces')
            .select('id, name')
            .like('name', `%${fac.name.split('(')[0].trim()}%`)
            .maybeSingle();

        const payload = {
            name: fac.name,
            type: fac.type,
            address: coords.address,
            lat: coords.lat,
            lng: coords.lng,
            is_verified: true,
            data_source: 'user_bulk_extension',
            description: fac.type === 'pet' ? '반려동물 장례식장' : (fac.type === 'funeral' ? '장례식장' : '추모시설'),
        };

        if (existing) {
            console.log(`  - Updating existing ID ${existing.id}`);
            await supabase.from('memorial_spaces').update(payload).eq('id', existing.id);
        } else {
            console.log(`  - Inserting new`);
            await supabase.from('memorial_spaces').insert(payload);
        }

        await new Promise(r => setTimeout(r, 100));
    }
}

main();
