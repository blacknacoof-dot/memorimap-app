import { useEffect } from 'react';
import { useUser, useSession } from './auth';
import { supabase, isSupabaseConfigured, setSupabaseAuth } from './supabaseClient';

export const useAuthSync = () => {
    const { user, isSignedIn } = useUser();
    const { session } = useSession();

    useEffect(() => {
        const syncUser = async () => {
            // Check if both services are ready
            if (!isSignedIn || !user || !isSupabaseConfigured()) {
                // If signed out, clear Supabase auth
                if (!isSignedIn && isSupabaseConfigured()) {
                    setSupabaseAuth(null);
                }
                return;
            }

            try {
                // 0. Set Supabase Auth Token
                if (session) {
                    const token = await session.getToken({ template: 'supabase' }); // Make sure 'supabase' template exists in Clerk Dashboard!
                    if (token) {
                        setSupabaseAuth(token);
                    }
                }

                // 1. Check if profile already exists
                const { data: existingUser, error: fetchError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('clerk_id', user.id)
                    .single();

                if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: No rows found
                    console.error("Error checking profile:", fetchError);
                    return;
                }

                // 2. If not exists, insert new profile
                if (!existingUser) {
                    console.log("Syncing new user to Supabase Profiles...");
                    const { error: insertError } = await supabase.from('profiles').insert({
                        clerk_id: user.id,
                        email: user.primaryEmailAddress?.emailAddress,
                        full_name: user.fullName || user.username || '사용자',
                        avatar_url: user.imageUrl,
                        role: 'user', // Default role
                        phone_number: user.primaryPhoneNumber?.phoneNumber
                    });

                    if (insertError) {
                        console.error("Failed to sync profile:", insertError);
                    } else {
                        console.log("Profile synced successfully!");
                    }
                }
            } catch (err) {
                console.error("Auth sync error:", err);
            }
        };

        syncUser();
    }, [isSignedIn, user, session]);
};
