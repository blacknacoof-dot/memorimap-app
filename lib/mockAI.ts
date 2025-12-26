// Mock AI Responses for Memorial Consultation
// This provides pre-written answers without requiring API keys

import { Facility } from "../types";

interface MockResponse {
    keywords: string[];
    response: string;
}

const getMockResponses = (facility: Facility) => {
    const isFuneralHome = facility.type === 'funeral';
    const isPetFuneral = facility.type === 'pet'; // Add Pet Logic


    return [
        {
            keywords: ["가격", "비용", "얼마", "요금"],
            response: isPetFuneral
                ? `안녕하세요. **${facility.name}** 장례 비용 안내입니다.
                
**기본 장례 비용**
- 5kg 미만: 기본 화장비 20~25만원
- 5kg~10kg: 30만원 내외
- 10kg 이상: 무게별 추가 비용 발생

기본 유골함은 포함되어 있으며, 수의나 관 등 선택사항에 따라 비용이 달라질 수 있습니다.`
                : isFuneralHome
                    ? `안녕하세요. ${facility.name} 장례 비용 안내입니다.

**기본 비용 안내**
- 빈소 사용료(1일): 평수/크기에 따라 상이 (평균 50~150만원)
- 안치실/입관실: 1회 사용 기준 약 30~50만원
- 식사/음료: 조문객 1인당 약 1.5만원 ~ 2만원 내외

정확한 견적은 빈소 크기와 장례 규모에 따라 달라지므로, **'바로 예약하기'**를 통해 상담을 접수해주시면 상세 견적서를 보내드립니다.`
                    : `안녕하세요. ${facility.name} 분양 가격 안내입니다.

**기본 가격 정보**
- 납골당(봉안당): 개인단 300~800만원 / 부부단 600~1,500만원
- 자연장(수목장/잔디장): 200만원 ~ 1,000만원 (위치/크기별 상이)
- 관리비: 1년 약 5~10만원 (5년/10년 선납 가능)

정확한 가격은 자리 위치에 따라 다르므로, 상담원 연결을 통해 자세한 안내를 받으실 수 있습니다.`
        },
        {
            keywords: ["절차", "방법", "어떻게", "진행"],
            response: isPetFuneral
                ? `반려동물 장례 절차를 안내해 드립니다.

1. **예약/방문**: 전화 또는 온라인 예약 후 방문
2. **추모/염습**: 아이를 깨끗이 닦고 마지막 인사를 나눕니다.
3. **화장**: 개별 화로에서 단독 화장으로 진행됩니다. (약 40분~1시간 소요)
4. **유골 수습**: 화장 후 유골을 수습하여 분골합니다.
5. **인도**: 유골함에 담아 보호자님께 전달 드립니다.`
                : isFuneralHome
                    ? `장례 절차에 대해 안내해 드립니다.

**3일장 기본 절차**
1. **임종 직후**: 운구차 요청 및 고인 이송 (본 장례식장으로 이동)
2. **1일차**: 빈소 차림, 부고 알림, 상복 착용
3. **2일차**: 성복제/입관식 (고인과 마지막 인사)
4. **3일차**: 발인 및 화장장/장지 이동

지금 바로 운구차가 필요하시다면 채팅창 하단의 **[운구 요청]** 버튼을 눌러주세요.`
                    : `안치 절차에 대해 안내해 드립니다.

**기본 절차**
1. 시설 방문 답사 및 자리 선정
2. 계약서 작성 (화장증명서 등 서류 준비)
3. 안치 일정 예약
4. 안장/봉안 진행 (당일 유골함 모시고 방문)

방문하여 둘러보시려면 **[오시는 길]** 버튼을 통해 위치를 확인해 주세요.`
        },
        {
            keywords: ["위치", "주소", "찾아가는", "교통"],
            response: `시설 위치 정보를 안내해 드립니다.

- **주소**: ${facility.address}
- **대표전화**: ${facility.phone}

[오시는 길] 버튼을 누르시면 지도로 정확한 위치를 확인하실 수 있습니다.`
        },
        {
            keywords: ["예약", "방문", "상담"],
            response: isPetFuneral
                ? `장례 예약 안내입니다.
                
24시간 언제든 장례 진행이 가능합니다.
상단의 **[바로 예약하기]** 버튼을 눌러 방문 예정 시간을 남겨주시면 담당 장례지도사가 확인 후 바로 연락드립니다.`
                : isFuneralHome
                    ? `빈소 예약 절차입니다.

현재 장례 발생으로 인해 빈소를 알아보고 계신가요?
상단의 **[바로 예약하기]** 버튼을 누르시면, 담당자가 실시간으로 빈소 현황을 확인하여 5분 내로 연락드립니다.

*24시간 긴급 접수 가능합니다.*`
                    : `사전 상담 및 답사 예약 안내입니다.
 
 원하시는 날짜와 시간에 맞춰 방문 상담을 예약하실 수 있습니다.
 상단의 **[바로 예약하기]** 버튼을 눌러주시면 담당자가 일정을 조율해 드립니다.`
        },
        // New Responses for Funeral Homes
        {
            keywords: ["운구", "엠뷸런스", "이송"],
            response: isPetFuneral
                ? `반려동물 이송(픽업) 서비스를 안내해 드립니다.
                
직접 이동이 어려우신 경우 왕복 픽업 서비스를 이용하실 수 있습니다. (거리에 따라 비용 발생)
전화 상담 시 픽업 요청을 해주시면 차량을 배차해 드립니다.`
                : isFuneralHome
                    ? `운구차(엠뷸런스) 긴급 배차를 도와드리겠습니다.
 
 1. 고인명과 현재 위치(병원/자택)를 알려주시면 즉시 출발합니다.
 2. 관내 무료 이송이 원칙이나 타 지역일 경우 추가 비용이 발생할 수 있습니다.
 
 🚨 **지금 바로 배차가 필요하신가요?**
 하단의 **[바로 예약하기]**를 눌러 **'긴급 접수'**를 해주시면 담당자가 확인 후 빠른 연락 드리겠습니다.`
                    : `죄송합니다. 추모시설은 운구 서비스를 직접 제공하지 않습니다. 제휴 장례식장을 안내해 드릴까요?`
        },
        {
            keywords: ["서류", "진단서", "준비물"],
            response: isPetFuneral
                ? `장례 진행 시 별도의 복잡한 서류는 필요하지 않습니다.
                
동물등록 말소 신고(장례확인서 발급)는 장례 후 안내해 드립니다. 아이가 평소 좋아하던 간식이나 장난감을 챙겨오셔도 좋습니다.`
                : isFuneralHome
                    ? `장례 접수 시 필요한 서류를 안내해 드립니다.
 
 ✅ **필수 서류**
 1. **사망진단서(시체검안서)** 7부 이상 (관공서 제출용)
 2. 고인 신분증, 상주님 신분증
 3. 영정사진 (없으신 경우 제작 가능)
 
 미리 준비해주시면 행정 절차가 훨씬 빨라집니다.`
                    : `안치 시 필요한 서류입니다.
 
 1. 화장증명서 (화장장 발급)
 2. 사망진단서 원본
 3. 가족관계증명서 (계약자 기준)
 4. 신분증 (계약자)`
        },
        {
            keywords: ["주차", "무료"],
            response: `주차 안내입니다.
 
 - **주차장 위치**: 본관 지상/지하 주차장 이용 가능
 - **유족 무료 주차**: 상주 차량 5대 무료 등록
 - **조문객 주차**: 무료
 
 *만차 시 인근 공영주차장 이용을 안내해 드립니다.*`
        },
        {
            keywords: ["통화", "전화", "연결", "담당자"],
            response: `네, 담당자와 바로 연결해 드리겠습니다.
 
 잠시만 기다려주세요, 전화 연결을 시도합니다... 📞
 
 <ACTION:CALL_MANAGER>`
        }
    ];
};

export async function* getMockAIResponse(
    facility: Facility,
    userMessage: string,
    topic: string
): AsyncGenerator<string, void, unknown> {
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get dynamic responses based on facility type
    const mockResponses = getMockResponses(facility);

    // Find matching response
    const lowerMessage = userMessage.toLowerCase();
    const matchedResponse = mockResponses.find(mock =>
        mock.keywords.some(keyword => lowerMessage.includes(keyword))
    );

    let response = "";

    if (matchedResponse) {
        response = matchedResponse.response;
    } else {
        // Default response context-aware
        const isFuneralHome = facility.type === 'funeral';
        const isPetFuneral = facility.type === 'pet';

        if (isPetFuneral) {
            response = `안녕하세요. **${facility.name}** 상담사입니다.
소중한 아이와의 이별을 함께 준비하겠습니다.

- **주소**: ${facility.address}
- **전화**: ${facility.phone}

비용, 절차, 픽업 서비스 등 궁금하신 점을 물어봐 주세요. 24시간 상담 가능합니다.`;
        } else if (isFuneralHome) {
            response = `안녕하세요. **${facility.name}** 의전 매니저입니다.
삼가 고인의 명복을 빕니다.

- **주소**: ${facility.address}
- **전화**: ${facility.phone}

장례 접수, 빈소 확인, 운구차 요청 등 급한 용무는 **[바로 예약하기]** 또는 하단 버튼을 이용해주시면 신속히 도와드리겠습니다.`;
        } else {
            response = `안녕하세요. **${facility.name}** 추모 상담사입니다.

- **유형**: ${facility.type === 'charnel' ? '납골당' : facility.type === 'natural' ? '자연장' : '공원묘원'}
- **주소**: ${facility.address}
- **가격대**: ${facility.priceRange}

더 자세한 상담이나 방문 예약을 원하시면 말씀해 주세요. 친절히 안내해 드리겠습니다.`;
        }
    }

    // Stream response character by character for realistic effect
    for (let i = 0; i < response.length; i += 3) {
        yield response.slice(i, i + 3);
        await new Promise(resolve => setTimeout(resolve, 20));
    }
}
