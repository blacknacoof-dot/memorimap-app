import type { AdminChecklistCategory } from '../types/db';

export interface ChecklistItemData {
    category: AdminChecklistCategory;
    title: string;
    description: string;
    deadline: string | null;
    urgency: 'high' | 'medium' | 'low';
    links: { label: string; url: string }[];
    documents: string[];
}

export const ADMIN_CHECKLIST_DATA: ChecklistItemData[] = [
    {
        category: 'death_report',
        title: '사망신고',
        description: '주민센터 방문 또는 정부24 온라인으로 신고합니다. 동거 친족, 비동거 친족, 동거인 순서로 신고 의무가 있습니다.',
        deadline: '사망 후 1개월 이내',
        urgency: 'high',
        links: [
            { label: '정부24 사망신고', url: 'https://www.gov.kr/main?a=AA020InfoCappViewApp&HighCtgCD=A09002&CappBizCD=13100000056' },
        ],
        documents: ['사망진단서(시체검안서)', '신고인 신분증', '가족관계증명서'],
    },
    {
        category: 'health_insurance',
        title: '건강보험 자격상실 신고',
        description: '국민건강보험공단에 피보험자 사망 사실을 신고하고 자격상실 처리합니다.',
        deadline: '사망 후 14일 이내',
        urgency: 'high',
        links: [{ label: '국민건강보험공단', url: 'https://www.nhis.or.kr' }],
        documents: ['사망진단서 사본', '가족관계증명서', '신분증'],
    },
    {
        category: 'pension',
        title: '국민연금 유족연금 청구',
        description: '국민연금공단에 유족연금 또는 사망일시금을 청구합니다.',
        deadline: '사망 후 즉시 (5년 소멸시효)',
        urgency: 'high',
        links: [{ label: '국민연금공단', url: 'https://www.nps.or.kr' }],
        documents: ['사망진단서', '가족관계증명서', '통장 사본', '신분증'],
    },
    {
        category: 'banking',
        title: '금융거래 정지 및 상속',
        description: '고인의 은행 계좌 지급 정지를 요청하고, 상속인 명의 변경 또는 해지 절차를 진행합니다.',
        deadline: '가능한 빨리',
        urgency: 'high',
        links: [{ label: '금융감독원 안심상속', url: 'https://www.fss.or.kr' }],
        documents: ['사망진단서', '기본증명서(상세)', '가족관계증명서', '상속인 신분증'],
    },
    {
        category: 'tax',
        title: '상속세 신고',
        description: '상속 재산이 있는 경우 관할 세무서에 상속세를 신고·납부합니다. 기초공제 5억원, 배우자공제 최소 5억원.',
        deadline: '상속개시일로부터 6개월 이내',
        urgency: 'medium',
        links: [{ label: '국세청 홈택스', url: 'https://www.hometax.go.kr' }],
        documents: ['상속재산 목록', '채무 목록', '가족관계증명서', '재산세 과세증명'],
    },
    {
        category: 'insurance_claim',
        title: '보험금 청구',
        description: '고인이 가입한 생명보험, 상해보험 등의 보험금을 청구합니다. 내보험 찾아줌 서비스로 미확인 보험 조회 가능.',
        deadline: '3년 이내 (소멸시효)',
        urgency: 'medium',
        links: [{ label: '내보험 찾아줌', url: 'https://cont.insure.or.kr' }],
        documents: ['사망진단서', '가족관계증명서', '보험증권', '수익자 통장 사본'],
    },
    {
        category: 'real_estate',
        title: '부동산 상속 등기',
        description: '고인 소유 부동산의 소유권 이전 등기를 진행합니다. 법무사 위임 또는 직접 등기소 방문.',
        deadline: '상속 후 (취득세 신고 60일 이내)',
        urgency: 'medium',
        links: [{ label: '대법원 인터넷등기소', url: 'https://www.iros.go.kr' }],
        documents: ['상속재산분할협의서', '가족관계증명서', '등기부등본', '취득세 신고서'],
    },
    {
        category: 'vehicle',
        title: '차량 명의이전',
        description: '고인 소유 차량의 명의를 상속인으로 이전합니다.',
        deadline: '상속 후 (자동차세 고려)',
        urgency: 'medium',
        links: [{ label: '자동차민원 대국민포털', url: 'https://www.ecar.go.kr' }],
        documents: ['상속재산분할협의서', '가족관계증명서', '자동차등록증', '보험가입증명서'],
    },
    {
        category: 'subscription',
        title: '구독서비스 해지',
        description: '고인 명의의 통신, OTT, 정기결제 서비스를 확인하고 해지합니다.',
        deadline: '해당 시',
        urgency: 'low',
        links: [],
        documents: ['사망진단서 사본', '가족관계증명서'],
    },
    {
        category: 'digital_account',
        title: '디지털 계정 정리',
        description: '이메일, SNS, 클라우드 등 디지털 계정을 정리합니다. 구글/카카오 등은 사망자 계정 관리 절차 있음.',
        deadline: '해당 시',
        urgency: 'low',
        links: [{ label: '구글 비활성 계정 관리자', url: 'https://myaccount.google.com/inactive' }],
        documents: ['사망진단서 사본', '가족관계증명서'],
    },
    {
        category: 'inheritance',
        title: '상속 재산 분할 협의',
        description: '공동상속인 간 재산 분할 협의서를 작성합니다. 협의 불성립 시 가정법원 조정/심판.',
        deadline: '기한 없음 (상속세 신고 전 권장)',
        urgency: 'medium',
        links: [{ label: '대한법률구조공단', url: 'https://www.klac.or.kr' }],
        documents: ['상속재산 목록', '채무 목록', '상속인 전원 인감증명서', '인감도장'],
    },
    {
        category: 'memorial',
        title: '추모 절차',
        description: '49재, 추모 행사, 납골당/수목장 관리 계약 등 추모 관련 절차를 진행합니다.',
        deadline: '해당 시',
        urgency: 'low',
        links: [],
        documents: [],
    },
];

export function groupByUrgency(items: ChecklistItemData[]) {
    return {
        high: items.filter(i => i.urgency === 'high'),
        medium: items.filter(i => i.urgency === 'medium'),
        low: items.filter(i => i.urgency === 'low'),
    };
}
