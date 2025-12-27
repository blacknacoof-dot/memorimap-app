export interface PetPartnerData {
    id: string;
    description: string;
    prices: {
        basic_5kg: string;
        basic_10kg: string;
        large_kg: string;
        shroud: string;
        stone: string;
        pickup_basic: string;
        pickup_long: string;
        [key: string]: string;
    };
    stoneInfo: {
        price: string;
        process: string;
        images?: string[];
    };
    images: {
        facility: string[];
        ceremony: string[];
    };
    pickupInfo: string;
}

export const PET_PARTNER_DATA: Record<string, PetPartnerData> = {
    'pet_fc_6': { // 펫바라기
        id: 'pet_fc_6',
        description: "펫바라기는 아이와의 마지막 인사를 가장 따뜻하게 준비하는 프리미엄 장례식장입니다.",
        prices: {
            basic_5kg: "22만원",
            basic_10kg: "27만원",
            large_kg: "45만원 부터",
            shroud: "11만원 (고급 삼베)",
            stone: "22만원 (순수 100%)",
            pickup_basic: "3만원 (10km 이내)",
            pickup_long: "5만원~"
        },
        stoneInfo: {
            price: "22만원",
            process: "유골 수습(10분) -> 고온 용융(40분) -> 스톤 완성",
            images: ["/images/stone_sample_1.jpg"]
        },
        images: {
            facility: ["https://images.unsplash.com/photo-1596627848624-94b6113b299e?q=80&w=600&auto=format&fit=crop"],
            ceremony: ["https://images.unsplash.com/photo-1605218427360-644b94e339e1?q=80&w=600&auto=format&fit=crop"]
        },
        pickupInfo: "서울/경기 전 지역 1시간 이내 긴급 출동 가능합니다."
    },
    'pet_fc_7': { // 모두펫상조
        id: 'pet_fc_7',
        description: "합리적인 가격으로 정성을 다하는 모두펫상조입니다.",
        prices: {
            basic_5kg: "18만원",
            basic_10kg: "23만원",
            large_kg: "35만원 부터",
            shroud: "8만원 (기본)",
            stone: "18만원 (이벤트가)",
            pickup_basic: "무료 (5km 이내)",
            pickup_long: "1km당 1,000원"
        },
        stoneInfo: {
            price: "18만원",
            process: "1시간 이내 제작 완료, 참관 가능",
        },
        images: {
            facility: ["https://images.unsplash.com/photo-1445052344078-7b9668383a8b?q=80&w=600&auto=format&fit=crop"],
            ceremony: []
        },
        pickupInfo: "수도권 전역 픽업 서비스 운영 중입니다."
    }
    // 필요한 다른 업체들도 여기에 추가하면 됩니다.
};
