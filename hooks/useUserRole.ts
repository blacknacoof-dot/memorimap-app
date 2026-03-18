import { useState, useEffect, useRef } from 'react';
import { ViewState } from '../types';
import { APP_ROLE, getRoleEntryView, isSangjoRole, shouldRedirectAfterLogin, syncHashForView } from '../lib/rolePolicy';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
}

interface UseUserRoleParams {
  isSignedIn: boolean | undefined;
  userInfo: UserInfo | null;
  viewState: ViewState;
  setViewState: (v: ViewState) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function useUserRole({ isSignedIn, userInfo, viewState, setViewState, showToast }: UseUserRoleParams) {
  const [userRole, setUserRole] = useState<string>(APP_ROLE.USER);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const lastResolvedUserIdRef = useRef<string | null>(null);

  const [adminFacilityId, setAdminFacilityId] = useState<string | null>(null);
  const [adminSangjoId, setAdminSangjoId] = useState<string | null>(null);
  const [sangjoOrgType, setSangjoOrgType] = useState<'branch' | 'headquarters'>('branch');

  useEffect(() => {
    let mounted = true;

    const fetchUserRole = async () => {
      if (isSignedIn && userInfo) {
        setIsLoadingRole(true);
        try {
          const { supabase, getAuthClient } = await import('../lib/supabaseClient');
          const { data: { session } } = await supabase.auth.getSession();
          if (!mounted) return;
          const authClient = await getAuthClient(session);

          const { getUserRole } = await import('../lib/queries');
          const result = await getUserRole(userInfo.id, authClient);
          if (!mounted) return;

          setUserRole(result.role);
          setAdminFacilityId(result.facilityId ?? null);

          if (!isSangjoRole(result.role) && result.role !== APP_ROLE.SUPER_ADMIN) {
            setAdminSangjoId(null);
            setSangjoOrgType('branch');
          }

          if (result.isError) {
            setRoleError(result.error || 'Unknown role error');
            showToast(`권한 확인 중 문제가 발생했습니다: ${result.error}`, 'error');
          } else {
            setRoleError(null);

              if (lastResolvedUserIdRef.current !== userInfo.id) {
                if (shouldRedirectAfterLogin(result.role, viewState)) {
                  const entryView = getRoleEntryView(result.role);
                  setViewState(entryView);
                  syncHashForView(entryView);
                }
                lastResolvedUserIdRef.current = userInfo.id;
              }

            if (result.facilityId) {
              setAdminFacilityId(result.facilityId);
            }
          }

          if (isSangjoRole(result.role) || result.role === APP_ROLE.SUPER_ADMIN) {
            const { getSangjoUser } = await import('../lib/sangjoQueries');
            const sangjoInfo = await getSangjoUser(userInfo.id, authClient);
            if (!mounted) return;

            if (sangjoInfo) {
              setAdminSangjoId(sangjoInfo.sangjo_id);
              setSangjoOrgType(result.role === APP_ROLE.SANGJO_HQ_ADMIN ? 'headquarters' : 'branch');
            } else {
              setAdminSangjoId(null);
            }
          }
        } catch {
          if (!mounted) return;
          setRoleError('Unexpected error');
          showToast('권한 정보를 불러오지 못했습니다.', 'error');
        } finally {
          if (mounted) setIsLoadingRole(false);
        }
      } else {
        setUserRole(APP_ROLE.USER);
        setRoleError(null);
        setIsLoadingRole(false);
        setAdminFacilityId(null);
        setAdminSangjoId(null);
        setSangjoOrgType('branch');
        lastResolvedUserIdRef.current = null;
      }
    };

    fetchUserRole();
    return () => {
      mounted = false;
    };
  }, [isSignedIn, userInfo?.id]);

  return {
    userRole,
    roleError,
    setRoleError,
    isLoadingRole,
    adminFacilityId,
    setAdminFacilityId,
    adminSangjoId,
    sangjoOrgType,
  };
}
