import React, { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  XCircle,
  Building2,
  Mail,
  Phone,
  Calendar,
  X,
  FileText,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

import { Partner } from '../../types';
import { useSuperAdminClient } from './SuperAdminGuard';
import { createPartnerDocSignedUrl, hasPartnerDocument } from './partnerDocs';

interface Props {
  partner: Partner;
  onClose: () => void;
  onStatusChange: (id: string, status: Partner['status']) => Promise<boolean>;
}

interface PartnerDocumentSectionProps {
  canViewDocuments: boolean;
  hasDocument: boolean;
  isLoading: boolean;
  isOpening: boolean;
  onView: () => void;
  onDownload: () => void;
}

export function PartnerDocumentSection({
  canViewDocuments,
  hasDocument,
  isLoading,
  isOpening,
  onView,
  onDownload,
}: PartnerDocumentSectionProps) {
  if (!canViewDocuments) return null;

  return (
    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-500" />
        <h5 className="text-sm font-bold text-slate-800">등록 문서</h5>
      </div>

      {isLoading ? (
        <p className="text-xs text-slate-500">문서 정보를 불러오는 중입니다.</p>
      ) : hasDocument ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onView}
            disabled={isOpening}
            className="px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {isOpening ? '문서를 여는 중..' : '사업자등록증 보기'}
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={isOpening}
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Download size={14} />
            문서 다운로드
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-500">등록된 문서가 없습니다.</p>
      )}
    </div>
  );
}

export const PartnerDetailModal: React.FC<Props> = ({ partner, onClose, onStatusChange }) => {
  const client = useSuperAdminClient();
  const [documentPath, setDocumentPath] = useState<string | null>(partner.business_license_url?.trim() || null);
  const [isDocumentLoading, setIsDocumentLoading] = useState(!hasPartnerDocument(partner.business_license_url));
  const [isDocumentOpening, setIsDocumentOpening] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPartnerDocument = async () => {
      if (hasPartnerDocument(partner.business_license_url)) {
        setDocumentPath(partner.business_license_url!.trim());
        setIsDocumentLoading(false);
        return;
      }

      setIsDocumentLoading(true);
      try {
        let matchedPath: string | null = null;

        if (partner.contact_email) {
          const { data } = await client
            .from('partner_inquiries')
            .select('business_license_url, created_at')
            .eq('company_email', partner.contact_email)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data?.business_license_url) {
            matchedPath = data.business_license_url;
          }
        }

        if (!matchedPath) {
          const { data } = await client
            .from('partner_inquiries')
            .select('business_license_url, created_at')
            .eq('company_name', partner.company_name)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data?.business_license_url) {
            matchedPath = data.business_license_url;
          }
        }

        if (!cancelled) {
          setDocumentPath(matchedPath);
        }
      } catch (error) {
        console.error('Failed to load partner document metadata', error);
        if (!cancelled) {
          setDocumentPath(null);
          toast.error('문서 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } finally {
        if (!cancelled) {
          setIsDocumentLoading(false);
        }
      }
    };

    loadPartnerDocument();
    return () => {
      cancelled = true;
    };
  }, [client, partner.business_license_url, partner.company_name, partner.contact_email]);

  const handleAction = async (status: Partner['status']) => {
    const changed = await onStatusChange(partner.id, status);
    if (changed) {
      onClose();
    }
  };

  const openPartnerDocument = async (mode: 'view' | 'download') => {
    if (!documentPath) return;

    setIsDocumentOpening(true);
    try {
      const signedUrl = await createPartnerDocSignedUrl(
        client,
        documentPath,
        undefined,
        mode === 'download' ? { download: true } : undefined,
      );

      if (mode === 'download') {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Failed to open approved partner document', error);
      toast.error('등록 문서를 여는 중 오류가 발생했습니다. 경로를 확인한 뒤 다시 시도해 주세요.');
    } finally {
      setIsDocumentOpening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80dvh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-lg text-slate-800">파트너 상세 정보</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border">
              {partner.company_logo_url ? (
                <img src={partner.company_logo_url} alt={partner.company_name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="text-slate-400" size={28} />
              )}
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-800">{partner.company_name}</h4>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${partner.status === 'approved'
                  ? 'bg-green-100 text-green-600'
                  : partner.status === 'pending'
                    ? 'bg-blue-100 text-blue-600'
                    : partner.status === 'suspended'
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-red-100 text-red-600'
                  }`}
              >
                {partner.status === 'approved'
                  ? '승인됨'
                  : partner.status === 'pending'
                    ? '대기중'
                    : partner.status === 'suspended'
                      ? '정지'
                      : '반려'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 bg-slate-50 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold">이메일</p>
                <p className="text-sm text-slate-700">{partner.contact_email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold">연락처</p>
                <p className="text-sm text-slate-700">{partner.contact_phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold">담당자</p>
                <p className="text-sm text-slate-700">{partner.contact_person || '미정'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold">가입일</p>
                <p className="text-sm text-slate-700">{new Date(partner.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold">구독 플랜</p>
                <p className="text-sm text-blue-600 font-bold capitalize">{partner.subscription_plan}</p>
              </div>
            </div>
          </div>

          <PartnerDocumentSection
            canViewDocuments={true}
            hasDocument={hasPartnerDocument(documentPath)}
            isLoading={isDocumentLoading}
            isOpening={isDocumentOpening}
            onView={() => {
              void openPartnerDocument('view');
            }}
            onDownload={() => {
              void openPartnerDocument('download');
            }}
          />

          <div className="flex flex-col gap-2 pt-2">
            {partner.status === 'pending' && (
              <div className="text-center py-2.5 text-sm text-amber-600 bg-amber-50 rounded-xl border border-amber-100 font-medium">
                "신규 입점 요청"에서 승인/거절 처리
              </div>
            )}

            {partner.status === 'approved' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction('suspended')}
                  className="flex-1 bg-white text-orange-600 border border-orange-200 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <PauseCircle size={16} /> 서비스 일시정지
                </button>
                <button
                  onClick={() => handleAction('rejected')}
                  className="flex-1 bg-white text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <XCircle size={16} /> 승인 취소
                </button>
              </div>
            )}

            {partner.status === 'suspended' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction('approved')}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={16} /> 서비스 재개
                </button>
                <button
                  onClick={() => handleAction('rejected')}
                  className="flex-1 bg-white text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <XCircle size={16} /> 승인 취소
                </button>
              </div>
            )}

            {partner.status === 'rejected' && (
              <div className="text-center py-2.5 text-sm text-red-500 bg-red-50 rounded-xl border border-red-100 font-medium">
                반려된 파트너입니다
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
