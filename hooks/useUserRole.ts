/**
 * useUserRole - App.tsx에서 추출한 사용자 역할 관리 Hook
 * Phase 4-3: userRole, roleError, isLoadingRole, adminFacilityId, adminSangjoId, sangjoOrgType, fetchUserRole
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
    const fetchUserRole = async () => {
      if (isSignedIn && userInfo) {
        setIsLoadingRole(true);
        try {
          const { getUserRole } = await import('../lib/queries');
          const result = await getUserRole(userInfo.id);

          setUserRole(result.role);

          if (result.isError) {
            setRoleError(result.error || 'Unknown role error');
            console.error('❌ Role fetch error:', result.error);
            showToast(`권한 확인 중 문제가 발생했습니다: ${result.error}`, 'error');
          } else {
            setRoleError(null);

            // Auto-route based on role
            if ((result.role === 'facility_admin' || result.role === 'facility_manager') && viewState === ViewState.MAP) {
              setViewState(ViewState.FACILITY_ADMIN);
            } else if (result.role.startsWith('sangjo_') && viewState === ViewState.MAP) {
              setViewState(ViewState.FACILITY_ADMIN);
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
          showToast('권한 정보를 불러오지 못했습니다.', 'error');
        } finally {
          setIsLoadingRole(false);
        }
      } else {
        setUserRole('user');
        setRoleError(null);
        setIsLoadingRole(false);
      }
    };
    fetchUserRole();
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
