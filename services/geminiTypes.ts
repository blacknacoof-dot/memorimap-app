// geminiTypes.ts — AI 서비스 공용 타입

import type { ActionType } from '../types';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  action?: ActionType;
  options?: { label: string; value: string }[];
  facilities?: Array<{
    id: string;
    name: string;
    address: string;
    type?: string;
    rating?: number;
    reviewCount?: number;
    imageUrl?: string;
  }>;
}

export interface AIResponseData {
  facilities?: Array<{
    id: string;
    name: string;
    address: string;
    type?: string;
    rating?: number;
    reviewCount?: number;
    imageUrl?: string;
  }>;
  [key: string]: unknown;
}

export interface AIResponse {
  text: string;
  action: ActionType;
  data?: AIResponseData;
}

export interface MapPlace {
  place_name: string;
  address_name: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  id: string;
}
