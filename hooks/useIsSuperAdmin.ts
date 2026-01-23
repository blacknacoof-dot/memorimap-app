import { useUser } from '@clerk/clerk-react';

export const useIsSuperAdmin = () => {
    const { user } = useUser();

    // Explicitly check for the only allowed super admin email
    const email = user?.primaryEmailAddress?.emailAddress;
    const isSuperAdmin = email === 'blacknacoof@gmail.com';

    // [DEBUG] Check removed for production


    return { isSuperAdmin };
};
