import React from 'react';
import { ViewState, Facility } from '../../types';
import { useFacilityAdmin } from './useFacilityAdmin';
import ReservationManager from './facility/ReservationManager';
import { ConsultationList } from '../ConsultationList';
import { ReservationDetailModal } from '../ReservationDetailModal';
import { FacilityEditModal } from '../FacilityEditModal';
import { FacilityFAQManager } from '../FacilityFAQManager';
import {
  Loader2, CheckCircle, XCircle, Clock, Home, Edit,
  Building2, MapPin, Phone, ArrowRight, HelpCircle, MessageSquare, Calendar,
} from 'lucide-react';

interface Props {
  user: { id: string; name: string; email: string; imageUrl?: string } | null;
  facilities: Facility[];
  onNavigate: (view: ViewState, context?: { facilityId?: string }) => void;
}

export const FacilityAdminDashboard: React.FC<Props> = ({ user, facilities, onNavigate }) => {
  const {
    myFacilityId, myFacility,
    reservations, consultations,
    isLoading, activeTab, setActiveTab,
    selectedReservation, setSelectedReservation,
    editingFacility, setEditingFacility,
    subscription,
    pendingCount, urgentCount, consultationCount,
    handleApprove, handleReject,
    handleAnswerConsultation, handleReadConsultation,
    loadData,
  } = useFacilityAdmin({ user, facilities });

  return (
    <div className="h-full overflow-y-auto pt-4 md:pt-6 pb-20 md:pb-6 px-4 sm:px-6 md:px-8 bg-gray-50">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">업체 관리 대시보드</h1>
          <p className="text-sm text-gray-600">
            {myFacility ? `${myFacility.name} 관리 중` : '할당된 시설 정보를 불러오는 중...'}
          </p>
          {pendingCount > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              <Clock size={16} />
              승인 대기 중인 예약 {pendingCount}건
              {urgentCount > 0 && <span className="ml-1 text-red-600 font-bold animate-pulse">(긴급 {urgentCount}건)</span>}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate(ViewState.SUBSCRIPTION_PLANS, { facilityId: myFacility?.id })}
            className="px-3 md:px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all shadow-md text-xs md:text-sm"
          >
            💎 구독 관리
          </button>
          <button
            onClick={() => onNavigate(ViewState.MY_PAGE)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="일반 화면으로 돌아가기"
          >
            <Home size={24} />
          </button>
        </div>
      </div>

      {/* Subscription upsell banner */}
      {(!subscription || !subscription.plan_name) && myFacility && (
        <div
          onClick={() => onNavigate(ViewState.SUBSCRIPTION_PLANS, { facilityId: myFacility.id })}
          className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white shadow-lg cursor-pointer transform transition-transform hover:scale-[1.01] flex justify-between items-center group"
        >
          <div>
            <h3 className="font-bold text-lg mb-1">💎 프리미엄 멤버십으로 업그레이드하세요!</h3>
            <p className="text-indigo-100 text-sm">무제한 AI 상담, 상위 노출 등 다양한 혜택을 누려보세요.</p>
          </div>
          <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
            <ArrowRight size={20} />
          </div>
        </div>
      )}

      {/* Facility Card */}
      {myFacility ? (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">시설 정보</h2>
          <div className="bg-white rounded-xl p-4 md:p-5 border shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 size={18} className="text-primary" />
                  <h3 className="font-bold text-gray-900">{myFacility.name}</h3>
                  {(subscription?.plan_name || '').toLowerCase() === 'premium' && (
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold border border-purple-200">PREMIUM</span>
                  )}
                  {(subscription?.plan_name || '').toLowerCase() === 'enterprise' && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">ENTERPRISE</span>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><MapPin size={14} /><span>{myFacility.address}</span></div>
                  <div className="flex items-center gap-2"><Phone size={14} /><span>{myFacility.phone || '전화번호 미등록'}</span></div>
                  {subscription?.next_billing_date && (
                    <div className="flex items-center gap-2 text-primary font-medium mt-1">
                      <Calendar size={14} />
                      <span>다음 결제 예정일: {new Date(subscription.next_billing_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditingFacility(myFacility)}
                className="flex flex-col items-center gap-1 px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-md active:scale-95 group"
              >
                <div className="flex items-center gap-2 font-bold whitespace-nowrap">
                  <Edit size={18} />
                  정보 수정
                </div>
                <span className="text-[10px] opacity-90 font-medium">사진 · 가격 · 설명 관리</span>
              </button>
            </div>
          </div>
        </div>
      ) : !isLoading && (
        <div className="mb-6 p-8 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">관리 중인 시설이 없습니다.</h3>
          <p className="text-sm text-gray-500">관리자 계정으로 시설을 할당받아야 대시보드를 사용할 수 있습니다.</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { key: 'pending', label: '대기', color: 'yellow', icon: Clock, count: reservations.filter(r => r.status === 'pending' || r.status === 'urgent').length },
          { key: 'confirmed', label: '확정', color: 'green', icon: CheckCircle, count: reservations.filter(r => r.status === 'confirmed').length },
          { key: 'cancelled', label: '취소', color: 'gray', icon: XCircle, count: reservations.filter(r => r.status === 'cancelled').length },
        ].map(({ key, label, color, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`bg-white rounded-xl p-3 border text-left transition-all ${activeTab === key ? `ring-2 ring-${color}-400 border-${color}-300` : 'hover:shadow-md'}`}
          >
            <div className={`flex items-center gap-1.5 text-${color}-600 mb-0.5`}>
              <Icon size={14} />
              <span className="text-[11px] font-medium">{label}</span>
            </div>
            <p className="text-xl font-bold">{count}</p>
            {key === 'pending' && urgentCount > 0 && (
              <p className="text-[10px] text-red-500 font-bold mt-0.5">긴급 {urgentCount}건</p>
            )}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-2">
        {[
          { key: 'pending', label: '예약 대기', count: reservations.filter(r => r.status === 'pending' || r.status === 'urgent').length },
          { key: 'consultations', label: '상담 문의', count: consultationCount, icon: MessageSquare, badge: true },
          { key: 'confirmed', label: '확정', count: reservations.filter(r => r.status === 'confirmed').length },
          { key: 'cancelled', label: '취소', count: reservations.filter(r => r.status === 'cancelled').length },
          { key: 'faq', label: 'FAQ', icon: HelpCircle },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-shrink-0 md:flex-1 min-w-[48px] py-2 px-2 min-h-[44px] md:min-h-0 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1 ${
              activeTab === tab.key ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border'
            }`}
            data-testid={tab.key === 'faq' ? 'faq-tab' : undefined}
          >
            {tab.icon && <tab.icon size={14} />}
            <span>{tab.label}</span>
            {tab.badge && tab.count && tab.count > 0 ? (
              <span className="ml-0.5 w-6 h-6 bg-red-500 text-white text-xs rounded-full font-bold inline-flex items-center justify-center leading-none">{tab.count}</span>
            ) : tab.count !== undefined && !tab.badge ? (
              <span className="opacity-70">({tab.count})</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'consultations' ? (
        <ConsultationList
          consultations={consultations}
          onAnswer={handleAnswerConsultation}
          onRead={handleReadConsultation}
        />
      ) : activeTab === 'faq' ? (
        <FacilityFAQManager facilityId={myFacilityId || undefined} />
      ) : isLoading ? (
        <div className="text-center py-10">
          <Loader2 size={32} className="animate-spin text-primary mx-auto" />
        </div>
      ) : myFacilityId ? (
        <ReservationManager
          reservations={reservations}
          onUpdateStatus={async (id, status, reason) => {
            if (status === 'confirmed') await handleApprove(id);
            else if (status === 'rejected') await handleReject(id, reason);
          }}
        />
      ) : null}

      {/* Reservation Detail Modal */}
      {selectedReservation && (
        <ReservationDetailModal
          reservation={selectedReservation}
          facility={facilities.find(f => f.id === selectedReservation.facility_id)}
          onClose={() => setSelectedReservation(null)}
          onCancel={undefined}
          adminActions={
            (selectedReservation.status === 'pending' || selectedReservation.status === 'urgent') ? (
              <div className="p-6 border-t flex gap-3">
                <button
                  onClick={() => selectedReservation.id && handleReject(selectedReservation.id)}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                >
                  거절하기
                </button>
                <button
                  onClick={() => selectedReservation.id && handleApprove(selectedReservation.id)}
                  className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                >
                  승인하기
                </button>
              </div>
            ) : undefined
          }
        />
      )}

      {/* Facility Edit Modal */}
      {editingFacility && (
        <FacilityEditModal
          facility={editingFacility}
          onClose={() => setEditingFacility(null)}
          onSave={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
