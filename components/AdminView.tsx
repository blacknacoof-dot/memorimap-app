import React, { useState } from 'react';
import { Facility, Reservation } from '../types';
import { Users, Calendar, Building2, ChevronLeft, Search, MoreHorizontal, Check, X, PieChart } from 'lucide-react';

interface Props {
  facilities: Facility[];
  reservations: Reservation[];
  onUpdateReservationStatus: (id: string, status: 'confirmed' | 'cancelled') => void;
  onExitAdmin: () => void;
}

export const AdminView: React.FC<Props> = ({ facilities, reservations, onUpdateReservationStatus, onExitAdmin }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reservations' | 'facilities'>('dashboard');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Stats
  const totalReservations = reservations.length;
  const pendingReservations = reservations.filter(r => r.status === 'pending').length;
  const confirmedReservations = reservations.filter(r => r.status === 'confirmed').length;
  const totalRevenue = reservations
    .filter(r => r.status !== 'cancelled')
    .reduce((acc, curr) => acc + curr.paymentAmount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">확정됨</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">취소됨</span>;
      default: return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold">대기중</span>;
    }
  };

  const filteredReservations = reservations.filter(r =>
    r.visitorName.includes(searchTerm) ||
    r.facilityName.includes(searchTerm) ||
    r.id.includes(searchTerm)
  );

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col text-gray-800 absolute inset-0 z-50 overflow-hidden">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-1.5 rounded text-white font-bold text-xs">ADMIN</div>
          <h1 className="font-bold text-lg">추모맵 관리자</h1>
        </div>
        <button
          onClick={onExitAdmin}
          className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 transition-colors"
        >
          앱으로 돌아가기
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav (Desktop style even on mobile for admin) */}
        <div className="w-16 md:w-64 bg-white border-r flex flex-col shrink-0">
          {[
            { id: 'dashboard', label: '대시보드', icon: PieChart },
            { id: 'reservations', label: '예약 관리', icon: Calendar },
            { id: 'facilities', label: '시설 관리', icon: Building2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 p-4 md:px-6 hover:bg-gray-50 transition-colors ${activeTab === tab.id
                ? 'text-blue-600 border-r-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500'
                }`}
            >
              <tab.icon size={20} />
              <span className="hidden md:block font-medium">{tab.label}</span>
            </button>
          ))}
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Users size={16} className="text-gray-500" />
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-bold">관리자</div>
                <div className="text-xs text-gray-500">Master</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">

          {/* --- Dashboard Tab --- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">현황판</h2>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border">
                  <div className="text-xs text-gray-500 mb-1">총 예약 건수</div>
                  <div className="text-2xl font-bold text-gray-900">{totalReservations}</div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border">
                  <div className="text-xs text-gray-500 mb-1">예약 대기</div>
                  <div className="text-2xl font-bold text-yellow-600">{pendingReservations}</div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border">
                  <div className="text-xs text-gray-500 mb-1">예약 확정</div>
                  <div className="text-2xl font-bold text-green-600">{confirmedReservations}</div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border">
                  <div className="text-xs text-gray-500 mb-1">누적 예약금</div>
                  <div className="text-2xl font-bold text-blue-600">{(totalRevenue / 10000).toLocaleString()}만원</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 border-b font-bold flex justify-between items-center">
                  <span>최근 예약 요청</span>
                  <button onClick={() => setActiveTab('reservations')} className="text-xs text-blue-500 hover:underline">전체보기</button>
                </div>
                <div className="divide-y">
                  {reservations.slice(0, 5).map(r => (
                    <div key={r.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <div className="font-bold text-sm">{r.visitorName} <span className="text-gray-400 font-normal">| {r.facilityName}</span></div>
                        <div className="text-xs text-gray-500">{r.date.toLocaleDateString()} {r.timeSlot}</div>
                      </div>
                      {getStatusBadge(r.status)}
                    </div>
                  ))}
                  {reservations.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">데이터가 없습니다.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- Reservations Tab --- */}
          {activeTab === 'reservations' && (
            <div className="max-w-5xl mx-auto h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">예약 관리</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="예약자, 시설명 검색"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b">
                      <tr>
                        <th className="p-4 font-medium">예약번호/일시</th>
                        <th className="p-4 font-medium">시설/방문목적</th>
                        <th className="p-4 font-medium">방문자</th>
                        <th className="p-4 font-medium">상태</th>
                        <th className="p-4 font-medium text-right">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredReservations.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{r.id}</div>
                            <div className="text-xs text-gray-500">{r.date.toLocaleDateString()} {r.timeSlot}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-800">{r.facilityName}</div>
                            <span className="inline-block bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded mt-1">{r.purpose}</span>
                          </td>
                          <td className="p-4">
                            <div>{r.visitorName}</div>
                            <div className="text-xs text-gray-500">{r.visitorCount}명</div>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(r.status)}
                          </td>
                          <td className="p-4 text-right">
                            {r.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => onUpdateReservationStatus(r.id, 'confirmed')}
                                  className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 border border-green-200" title="승인"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => onUpdateReservationStatus(r.id, 'cancelled')}
                                  className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 border border-red-200" title="거절"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            )}
                            {r.status !== 'pending' && (
                              <button className="text-gray-400 hover:text-gray-600">
                                <MoreHorizontal size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredReservations.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400">검색 결과가 없습니다.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'facilities' && (
            <div className="max-w-5xl mx-auto">
              {!selectedFacility ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">시설 관리</h2>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
                      + 시설 추가
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {facilities.map(f => (
                      <div key={f.id} className="bg-white p-4 rounded-xl shadow-sm border flex gap-4 cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setSelectedFacility(f)}>
                        <img src={f.imageUrl} alt={f.name} className="w-20 h-20 object-cover rounded-lg bg-gray-200" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-900 truncate">{f.name}</h3>
                            <button className="text-gray-400 hover:text-blue-600"><MoreHorizontal size={16} /></button>
                          </div>
                          <div className="text-xs text-gray-500 truncate mb-2">{f.address}</div>
                          <div className="flex gap-1 flex-wrap">
                            <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{f.type}</span>
                            <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">★ {f.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="p-4 border-b flex items-center gap-4">
                    <button onClick={() => setSelectedFacility(null)} className="p-2 hover:bg-gray-100 rounded-full">
                      <ChevronLeft size={20} />
                    </button>
                    <h2 className="text-xl font-bold">{selectedFacility.name} 관리</h2>
                  </div>
                  <div className="p-6 space-y-8">
                    {/* Photos Section */}
                    <section>
                      <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
                        <Building2 size={20} className="text-blue-500" /> 사진 관리
                        <button className="text-xs bg-gray-100 px-2 py-1 rounded ml-auto hover:bg-gray-200">+ 사진 추가</button>
                      </h3>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-400 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-colors">
                          <span>+ Upload</span>
                        </div>
                        {[selectedFacility.imageUrl, ...(selectedFacility.galleryImages || [])].slice(0, 3).map((img, i) => (
                          <div key={i} className="aspect-square rounded-lg bg-gray-200 relative group overflow-hidden">
                            <img src={img} alt="Facility" className="w-full h-full object-cover" />
                            <button className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title="삭제">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                    <hr />
                    {/* Reviews Section */}
                    <section>
                      <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
                        <Users size={20} className="text-green-500" /> 리뷰 관리 ({selectedFacility.reviewCount})
                      </h3>
                      <div className="space-y-4">
                        {(selectedFacility.reviews || []).length > 0 ? (
                          selectedFacility.reviews.map(review => (
                            <div key={review.id} className="border p-4 rounded-lg flex gap-4 items-start">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                                {review.userName[0]}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div className="font-bold text-sm">{review.userName} <span className="text-xs text-gray-400 font-normal ml-2">{review.date}</span></div>
                                  <button className="text-red-500 text-xs hover:underline flex items-center gap-1"><X size={12} /> 삭제</button>
                                </div>
                                <div className="text-yellow-400 text-xs my-1">{'★'.repeat(review.rating)}<span className="text-gray-300">{'★'.repeat(5 - review.rating)}</span></div>
                                <p className="text-sm text-gray-700">{review.content}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-400 py-8 bg-gray-50 rounded-lg">
                            등록된 리뷰가 없습니다.
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};