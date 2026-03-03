import type { FuneralCompany } from './index';

export interface Message {
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
    recommendation?: FuneralCompany[];
}

export interface Consultation {
    id: string;
    user_id: string;
    facility_id: string;
    facilities?: { id: number; name: string; address?: string; images?: string[]; type?: string } | null;
    topic: string;
    messages: Message[];
    created_at: string;
    updated_at: string;
}

export type ConsultationTopic =
    | "장묘 방식 상담"
    | "이용 절차 안내"
    | "가격 및 옵션"
    | "방문 예약 상담";
