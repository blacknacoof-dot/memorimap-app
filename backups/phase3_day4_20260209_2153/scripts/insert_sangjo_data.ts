
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

const products_TheK = [
    {
        name: "예다함 396",
        price: 3960000,
        description: "합리적인 가격의 실속형 상품",
        badges: ["표준형"],
        tagline: "실속과 품격을 동시에",
        serviceDetails: [
            { category: "인력", items: ["장례지도사 2명", "접객도우미 4명(10시간)"] },
            { category: "차량", items: ["버스/리무진 전국 무료 (왕복 200km)"] },
            { category: "수의/관", items: ["대마 기계직", "오동나무 1.0"] },
            { category: "상복", items: ["남여 상복 필요 수량 제공"] }
        ],
        faq: [{ q: "가입비가 있나요?", a: "가입비 없이 월 납입금만으로 이용 가능합니다." }]
    },
    {
        name: "예다함 530",
        price: 5300000,
        description: "최고의 예우를 갖춘 프리미엄 상품",
        badges: ["고급형", "BEST"],
        tagline: "VIP를 위한 고품격 서비스",
        serviceDetails: [
            { category: "인력", items: ["장례지도사 2명", "접객도우미 6명(10시간)"] },
            { category: "차량", items: ["링컨 리무진 등 최고급 리무진 제공"] },
            { category: "수의/관", items: ["대마 100% 수의", "매장/화장 겸용 고급 관"] },
            { category: "추가혜택", items: ["전국 유명 리조트 멤버십 혜택 제공"] }
        ],
        faq: [{ q: "양도 가능한가요?", a: "네, 가족 및 지인에게 양도 가능합니다." }]
    }
];

const products_Preed = [
    {
        name: "프리드 360",
        price: 3600000,
        description: "알뜰하고 스마트한 장례 준비",
        badges: ["기본형"],
        serviceDetails: [
            { category: "기본제공", items: ["장례지도사 1명", "도우미 2명"] }
        ]
    },
    {
        name: "프리드 450",
        price: 4500000,
        description: "가장 많이 선택하는 표준형 상품",
        badges: ["표준형"],
        serviceDetails: [
            { category: "기본제공", items: ["장례지도사 2명", "도우미 4명"] }
        ]
    }
];

async function run() {
    console.log("--- Inserting Sangjo Data ---");

    // 1. Insert The-K
    const theKData = {
        name: "더케이예다함",
        type: "sangjo",
        address: "서울 마포구",
        lat: 37.54,
        lng: 126.95,
        price_info: { products: products_TheK },
        is_verified: true
    };

    // Check if exists first to avoid dupes (by name)
    const { data: existingTheK } = await supabase.from('memorial_spaces').select('id').eq('name', '더케이예다함').maybeSingle();

    if (existingTheK) {
        console.log(`Updating existing The-K (ID: ${existingTheK.id})...`);
        const { error } = await supabase.from('memorial_spaces').update({
            price_info: { products: products_TheK }
        }).eq('id', existingTheK.id);
        if (error) console.error("Update failed:", error);
        else console.log("Update success!");
    } else {
        console.log("Inserting new The-K...");
        const { error } = await supabase.from('memorial_spaces').insert(theKData);
        if (error) console.error("Insert failed:", error);
        else console.log("Insert success!");
    }

    // 2. Insert Preed
    // Note: Preed name in DB might be '프리드라이프'
    const preedName = '프리드라이프';
    const { data: existingPreed } = await supabase.from('memorial_spaces').select('id').eq('name', preedName).maybeSingle();
    if (existingPreed) {
        console.log(`Updating existing Preed (ID: ${existingPreed.id})...`);
        const { error } = await supabase.from('memorial_spaces').update({
            price_info: { products: products_Preed }
        }).eq('id', existingPreed.id);
        if (error) console.error(error);
        else console.log("Preed updated.");
    } else {
        console.log("Inserting Preed...");
        await supabase.from('memorial_spaces').insert({
            name: preedName,
            type: 'sangjo',
            address: '서울',
            lat: 37.5, lng: 127.0,
            price_info: { products: products_Preed },
            is_verified: true
        });
        console.log("Preed inserted.");
    }
}

run();
