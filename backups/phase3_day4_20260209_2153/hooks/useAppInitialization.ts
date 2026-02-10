import { useState, useEffect, useCallback } from 'react';
import { useUser, useClerk, useSession } from '../lib/auth';
import { ViewState } from '../types';
import { useLocation } from './useLocation';

interface AppInitializationState {
  userRole: string;
  roleError: string | null;
  isLoadingRole: boolean;
  userInfo: {
    id: string;
    name: string;
    email: string;
    imageUrl: string;
  } | null;
  adminSangjoId: string | null;
  sangjoOrgType: 'branch' | 'headquarters';
  isInitialized: boolean;
}

interface AppInitializationReturn extends AppInitializationState {
  fetchUserRole: () => Promise<void>;
  initializeLocation: () => void;
}

export const useAppInitialization = (
  viewState: ViewState,
  setViewState: (state: ViewState) => void
): AppInitializationReturn => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { session } = useSession();
  const { location: userLocation, getCurrentPosition } = useLocation();

  const [userRole, setUserRole] = useState<string>('user');
  const [roleError, setRoleError] = useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [adminSangjoId, setAdminSangjoId] = useState<string | null>(null);
  const [sangjoOrgType, setSangjoOrgType] = useState<'branch' | 'headquarters'>('branch');
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoize user info to prevent infinite re-fetches
  const userInfo = user ? {
    id: user.id,
    name: user.firstName || user.username || '회원',
    email: user.primaryEmailAddress?.emailAddress || '',
    imageUrl: user.imageUrl
  } : null;

  // Initialize location on mount
  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  // Fetch user role
  const fetchUserRole = useCallback(async () => {
    if (isSignedIn && userInfo) {
      setIsLoadingRole(true);
      try {
        const { getUserRole } = await import('../lib/queries');
        const result = await getUserRole(userInfo.id);

        setUserRole(result.role);

        if (result.isError) {
          setRoleError(result.error || 'Unknown role error');
          console.error('❌ Role fetch error:', result.error);
        } else {
          setRoleError(null);

          // Auto-route based on role
          if (result.role === 'facility_admin' && viewState === ViewState.MAP) {
            setViewState(ViewState.FACILITY_ADMIN);
          } else if (result.role.startsWith('sangjo_') && viewState === ViewState.MAP) {
            setViewState(ViewState.FUNERAL_COMPANIES);
          }
        }

        // Fetch Sangjo Info if role is sangjo-related
        if (result.role.includes('sangjo')) {
          const { getSangjoUser } = await import('../lib/sangjoQueries');
          const sangjoInfo = await getSangjoUser(userInfo.id);
          if (sangjoInfo) {
            setAdminSangjoId(sangjoInfo.sangjo_id);
            setSangjoOrgType(result.role === 'sangjo_hq_admin' ? 'headquarters' : 'branch');
          }
        }
      } catch (err: any) {
        console.error('❌ Unexpected fetchUserRole error:', err);
        setRoleError('Unexpected error');
      } finally {
        setIsLoadingRole(false);
        setIsInitialized(true);
      }
    } else {
      setUserRole('user');
      setRoleError(null);
      setIsLoadingRole(false);
      setIsInitialized(true);
    }
  }, [isSignedIn, userInfo?.id, viewState, setViewState]);

  // Fetch role when auth state changes
  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  const initializeLocation = useCallback(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  return {
    userRole,
    roleError,
    isLoadingRole,
    userInfo,
    adminSangjoId,
    sangjoOrgType,
    isInitialized,
    fetchUserRole,
    initializeLocation
  };
};
