export interface UserFavorite {
    id: string;
    facility_id: string;
    facility_name: string;
    facility_description: string;
    facility_category: string;
    facility_image_url: string;
    facility_location: string;
    private_memo?: string;
    private_rating?: number;
    created_at: string;
}

export interface EndingNote {
    user_id: string;
    preferred_method?: string[];
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relation?: string;
    final_message?: string;
    photo_preference?: string;
    created_at: string;
    updated_at: string;
}

export interface FavoriteAnalysis {
    total_favorites: number;
    most_common_category?: string;
    average_rating?: number;
    has_memo_count: number;
    recent_activity?: Array<{
        facility_name: string;
        created_at: string;
    }>;
}
