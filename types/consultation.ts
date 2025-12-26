export interface Message {
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
    recommendation?: any[]; // For Maum-i recommendation cards
}

export interface Consultation {
    id: string;
    userId: string;
    spaceId: string;
    facilityName: string;
    topic: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}

export type ConsultationTopic =
    | "장묘 방식 상담"
    | "이용 절차 안내"
    | "가격 및 옵션"
    | "방문 예약 상담";
