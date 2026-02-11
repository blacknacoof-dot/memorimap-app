/**
 * @deprecated useSuperAdmin 훅을 사용하세요 (RPC 서버 검증)
 * 이 훅은 클라이언트 이메일 하드코딩 방식으로 보안에 취약합니다.
 */
import { useSuperAdmin } from './useSuperAdmin';

export const useIsSuperAdmin = () => {
    const { isSuperAdmin, loading } = useSuperAdmin();
    return { isSuperAdmin, loading };
};
