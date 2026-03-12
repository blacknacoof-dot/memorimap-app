/**
 * useUserRole - App.tsx에서 추출한 사용자 역할 관리 Hook
 * get_user_role RPC를 사용하여 역할 + facilityId를 한번에 조회
 */
import { useState, useEffect } from 'react';
import { ViewState } from '../types';

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
  const [userRole, setUserRole] = useState<string>('user');
  const [roleError, setRoleError] = useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(false);

  // Facility Admin Context
  const [adminFacilityId, setAdminFacilityId] = useState<string | null>(null);
  const [adminSangjoId, setAdminSangjoId] = useState<string | null>(null);
  const [sangjoOrgType, setSangjoOrgType] = useState<'branch' | 'headquarters'>('branch');

  // Fetch User Role
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

          if (result.isError) {
            setRoleError(result.error || 'Unknown role error');
            showToast(`권한 확인 중 문제가 발생했습니다: ${result.error}`, 'error');
          } else {
            setRoleError(null);

            // Auto-route based on role + set adminFacilityId (RPC에서 직접 반환)
            if ((result.role === 'facility_admin' || result.role === 'facility_manager') && viewState === ViewState.MAP) {
              setViewState(ViewState.FACILITY_ADMIN);
              if (result.facilityId) {
                setAdminFacilityId(result.facilityId);
              }
            } else if (result.role.startsWith('sangjo_') && viewState === ViewState.MAP) {
              setViewState(ViewState.SANGJO_DASHBOARD);
            }
          }

          // Fetch Sangjo Info if role is sangjo-related or super_admin
          if (result.role.includes('sangjo') || result.role === 'super_admin') {
            const { getSangjoUser } = await import('../lib/sangjoQueries');
            const sangjoInfo = await getSangjoUser(userInfo.id, authClient);
            if (!mounted) return;
            if (sangjoInfo) {
              setAdminSangjoId(sangjoInfo.sangjo_id);
              setSangjoOrgType(result.role === 'sangjo_hq_admin' ? 'headquarters' : 'branch');
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
        setUserRole('user');
        setRoleError(null);
        setIsLoadingRole(false);
      }
    };
    fetchUserRole();
    return () => { mounted = false; };
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
