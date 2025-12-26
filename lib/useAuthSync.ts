import { useEffect } from 'react';
import { useUser } from './auth';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export const useAuthSync = () => {
    const { user, isSignedIn } = useUser();

    useEffect(() => {
        const syncUser = async () => {
            // Check if both services are ready
            if (!isSignedIn || !user || !isSupabaseConfigured()) return;

            try {
                // 1. Check if user already exists
                const { data: existingUser, error: fetchError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('clerk_id', user.id)
                    .single();

                if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: No rows found
                    console.error("Error checking user:", fetchError);
                    return;
                }

                // 2. If not exists, insert new user
                if (!existingUser) {
                    console.log("Syncing new user to Supabase...");
                    const { error: insertError } = await supabase.from('users').insert({
                        clerk_id: user.id,
                        email: user.primaryEmailAddress?.emailAddress,
                        name: user.fullName || user.username || '사용자',
                        image_url: user.imageUrl,
                        role: 'user',
                        phone_number: user.primaryPhoneNumber?.phoneNumber
                    });

                    if (insertError) {
                        console.error("Failed to sync user:", insertError);
                    } else {
                        console.log("User synced successfully!");
                    }
                }
            } catch (err) {
                console.error("Auth sync error:", err);
            }
        };

        syncUser();
    }, [isSignedIn, user]);
};
