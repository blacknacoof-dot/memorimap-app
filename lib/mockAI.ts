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
            // [Scenario 1] Price Inquiry
            keywords: ["가격", "비용", "얼마", "요금", "견적"],
            response: isPetFuneral
                ? `반려동물 장례 비용 안내입니다. **(부가세 포함)**
                
**기본 장례 비용**
- 5kg 미만: 200,000원 ~ 250,000원
- 5kg ~ 10kg: 300,000원 내외
- 10kg 이상: 1kg당 1만원 추가

*기본 유골함이 포함된 가격입니다. 수의나 관 등 용품은 선택 사항입니다.*`
                : isFuneralHome
                    ? `장례식장 이용 예상 비용입니다.

**평형별 빈소 사용료 (1일 기준)**
- 소형 (30평형): 약 450,000원
- 중형 (50평형): 약 850,000원
- 대형 (VIP/특실): 약 1,500,000원~

*안치실/입관실 사용료 및 식대는 별도입니다. 정확한 견적은 '바로 예약하기'를 통해 받으실 수 있습니다.*`
                    : `추모시설 분양/안치 가격 안내입니다.

**기본 가격 정보**
- 개인단: 300~500만원
- 부부단: 600~900만원
- 관리비: 1년 약 5만원 (5년 선납 가능)

*정확한 가격은 안치단의 위치(높이)에 따라 다릅니다.*`
        },
        {
            // [Scenario 2] Procedure Inquiry
            keywords: ["절차", "방법", "어떻게", "진행", "순서"],
            response: isPetFuneral
                ? `반려동물 장례 절차는 다음과 같습니다.

1. **예약/방문**: 전화 또는 온라인 예약
2. **염습/추모**: 아이를 깨끗이 닦고 마지막 인사를 나눕니다.
3. **개별 화장**: 단독 화로에서 약 40분간 진행됩니다.
4. **수습/분골**: 유골을 수습하여 가루로 만듭니다.
5. **유골함 전달**: 기본 유골함에 담아 보호자님께 인도합니다.`
                : isFuneralHome
                    ? `3일장 기본 장례 절차입니다.

1. **임종 및 이송**: 고인을 장례식장으로 모십니다. (운구차 지원)
2. **1일차**: 빈소 차림 및 부고 알림
3. **2일차**: 성복제 및 입관 (염습)
4. **3일차**: 발인 및 화장장 이동

지금 바로 운구차가 필요하시면 **[운구 요청]**을 입력해주세요.`
                    : `안치 및 계약 절차 안내입니다.

1. **시설 답사**: 현장을 방문하여 자리를 확인합니다.
2. **계약 체결**: 안치단 선정 및 계약서 작성
3. **안치 예약**: 화장 일정에 맞춰 안치 시간을 정합니다.
4. **안장/봉안**: 유골함을 모시고 방문하여 안치합니다.

방문 답사를 원하시면 **[오시는 길]** 버튼을 눌러 위치를 확인해주세요.`
        },
        {
            // [Scenario 3] Location / Map Action
            keywords: ["위치", "주소", "찾아가는", "교통", "어디"],
            response: `시설 위치 정보를 안내해 드립니다.

- **주소**: ${facility.address}
- **대표전화**: ${facility.phone || '02-0000-0000'}

하단의 버튼을 눌러 지도로 정확한 위치를 확인해보세요.
<ACTION:MAP>`
        },
        {
            // [Scenario 4] Reservation / Urgent Action (Legacy - kept for non-urgent)
            keywords: ["예약", "방문", "상담", "접수"],
            // Exclude "긴급" from here to prevent overlap
            response: isPetFuneral
                ? `장례 예약을 도와드리겠습니다.\n\n원하시는 방문 시간을 선택해주시면 즉시 예약을 확정해 드립니다.\n아래 버튼을 눌러 접수를 진행해주세요.\n<ACTION:RESERVE>`
                : `방문 답사 및 상담 예약을 도와드리겠습니다.\n\n편하신 일정으로 방문 예약을 잡아드립니다.\n아래 버튼을 눌러 날짜와 시간을 선택해주세요.\n<ACTION:RESERVE>`
        },
        // --- [NEW] Urgent Booking Flow (JSON Simulation) ---
        {
            keywords: ["긴급", "장례 발생", "mode_urgent"],
            response: JSON.stringify({
                message: "삼가 조의를 표합니다. 전화 대기 없이 **지금 바로 안치 예약**을 확정해 드리겠습니다.\\n시설에 도착하시는 날짜(발인일)를 선택해 주세요.",
                options: [
                    { label: "📅 오늘 (즉시 이동)", value: "date_today" },
                    { label: "📅 내일", value: "date_tomorrow" },
                    { label: "📅 모레", value: "date_dayafter" }
                ],
                action_trigger: "URGENT_CHECK"
            })
        },
        {
            keywords: ["date_today", "date_tomorrow", "date_dayafter"],
            response: JSON.stringify({
                message: "안치 가능한 자리를 확보하겠습니다.\\n어떤 유형으로 준비해 드릴까요?",
                options: [
                    { label: "👤 개인단 (1분)", value: "type_single" },
                    { label: "👥 부부단 (2분)", value: "type_couple" }
                ],
                action_trigger: "URGENT_CHECK"
            })
        },
        {
            keywords: ["type_single", "type_couple", "개인단", "부부단"],
            response: JSON.stringify({
                message: "네, 여유분 확보되었습니다.\\n**도착하셔서 계약 및 안치를 진행할 시간**을 선택해 주세요.\\n(선택하신 시간에 맞춰 직원이 준비하고 대기합니다.)",
                options: [
                    { label: "09:00 도착", value: "time_0900" },
                    { label: "11:00 도착", value: "time_1100" },
                    { label: "13:00 도착", value: "time_1300" },
                    { label: "15:00 도착", value: "time_1500" }
                ],
                action_trigger: "URGENT_CHECK"
            })
        },
        {
            keywords: ["time_0900", "time_1100", "time_1300", "time_1500"],
            response: JSON.stringify({
                message: "**[예약 확정] 선택하신 시간**으로 접수되었습니다.\\n도착 즉시 안치가 가능하도록 준비해 두겠습니다.\\n\\n⚠️ **필수 지참 서류:**\\n1. 화장 증명서\\n2. 계약자 신분증\\n\\n조심히 오십시오.",
                options: [
                    { label: "📍 내비게이션 실행", value: "open_navi" },
                    { label: "📄 예약증 보기", value: "show_ticket" }
                ],
                action_trigger: "URGENT_RESERVATION_CONFIRM"
            })
        },
        {
            // [Scenario 5] Funeral Home Specific - Ambulance/Hearse
            keywords: ["운구", "이송", "엠뷸런스", "차량", "픽업", "데리러"],
            response: isPetFuneral
                ? `반려동물 픽업(운구) 서비스를 요청하시겠습니까?

직접 이동이 어려우신 경우, 전용 차량을 배차해 드립니다.
아래 예약 버튼을 통해 픽업 주소를 남겨주세요.
<ACTION:RESERVE>`
                : isFuneralHome
                    ? `고인 이송을 위한 운구차(엠뷸런스)를 배차합니다.

관내 무료 이송이 가능하며, 24시간 언제든 출동합니다.
긴급 배차를 위해 바로 접수해주세요.
<ACTION:RESERVE>`
                    : `죄송합니다. 추모시설은 직접적인 운구 서비스를 제공하지 않습니다.
제휴된 장례차량을 연결해 드릴까요?`
        },
        {
            // [Scenario 6] Pet Specific - Stone/Memorial Goods
            keywords: ["스톤", "메모리얼", "루세떼", "보석"],
            response: isPetFuneral
                ? `메모리얼 스톤 제작 비용 안내입니다.

- **기본형**: 20~30만원 (5kg 기준)
- **주얼리형**: 40만원~ (세공비 포함)
- **제작 시간**: 화장 후 1시간 소요

*영원히 변치 않는 아름다움으로 아이를 기억하세요.*`
                : `죄송합니다. 해당 시설에서는 메모리얼 스톤 제작 서비스를 제공하지 않습니다.`
        },
        {
            // [Scenario 7] Call Manager Action
            keywords: ["통화", "전화", "연결", "담당자", "상담원", "사람"],
            response: `전문 상담사와 바로 연결해 드리겠습니다.

통화 버튼을 누르면 담당자 직통 번호로 연결됩니다.
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
            response = `안녕하세요. **${facility.name}** 상담사(AI)입니다. 🐾
반려동물과의 이별 준비를 도와드리고 있습니다.

- **장례 절차 및 비용**
- **픽업(운구) 서비스**
- **메모리얼 스톤**

궁금하신 점을 말씀해 주세요.`;
        } else if (isFuneralHome) {
            response = `안녕하세요. **${facility.name}** 장례 지도사(AI)입니다.
갑작스러운 슬픔에 위로의 말씀을 드립니다.

- **빈소 확인 및 예약**
- **운구차 긴급 배차**
- **장례 비용 견적**

도움이 필요하신 내용을 말씀해 주시면 즉시 안내해 드리겠습니다.`;
        } else {
            response = `안녕하세요. **${facility.name}** 전문 상담사(AI)입니다.

- **분양 가격 및 관리비**
- **안치 절차**
- **방문 답사 예약**

무엇을 도와드릴까요?
"위치 알려줘" 또는 "예약해줘"라고 말씀해 보세요.`;
        }
    }

    // Stream response character by character for realistic effect
    // Speed up for better UX in form-centric mode
    for (let i = 0; i < response.length; i += 5) {
        yield response.slice(i, i + 5);
        await new Promise(resolve => setTimeout(resolve, 10)); // Faster typing
    }
}
