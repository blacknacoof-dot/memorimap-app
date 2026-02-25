import React, { createContext, useContext } from 'react';
import { useSuperAdminAuth } from '../../hooks/useSuperAdminAuth';
import { ShieldX, Loader2, RefreshCw } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';

const SuperAdminClientContext = createContext<SupabaseClient | null>(null);

export function useSuperAdminClient(): SupabaseClient {
  const client = useContext(SuperAdminClientContext);
  if (!client) throw new Error('useSuperAdminClient must be used inside SuperAdminGuard');
  return client;
}

interface SuperAdminGuardProps {
  children: React.ReactNode;
  onBack?: () => void;
}

export function SuperAdminGuard({ children, onBack }: SuperAdminGuardProps) {
  const { client, isSuperAdmin, loading, error, recheck } = useSuperAdminAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-medium">관리자 권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin || !client) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <ShieldX className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">접근 권한 없음</h2>
          <p className="text-sm text-slate-500">
            {error || '슈퍼관리자 권한이 필요합니다.'}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={recheck}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              재확인
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                돌아가기
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <SuperAdminClientContext.Provider value={client}>
      {children}
    </SuperAdminClientContext.Provider>
  );
}
