import React, { useState, useEffect } from 'react';
import { Search, User, Phone, Mail, Award, AlertCircle, CheckCircle, XCircle, ChevronRight, FileText, Crown, Building2, MapPin, Zap, Search as SearchIcon } from 'lucide-react';
import { searchUsers, updateUserRole, getAllUsers, approveSangjoUser, AdminUser } from '../../lib/admin';
import { FUNERAL_COMPANIES } from '../../constants';

export const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<{ id: string, clerk_id: string, name: string, role: string } | null>(null);
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [mappingSearch, setMappingSearch] = useState('');
    const [detailUser, setDetailUser] = useState<AdminUser | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error(error);
            alert('사용자 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await searchUsers(searchTerm);
            setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, clerkId: string, newRole: string) => {
        if (newRole === 'sangjo_branch_manager' || newRole === 'sangjo_hq_admin') {
            setSelectedUser({
                id: userId,
                clerk_id: clerkId,
                name: users.find(u => u.id === userId)?.name || '회원',
                role: newRole
            });
            setShowMappingModal(true);
            return;
        }

        let message = '';
        if (newRole === 'pending_facility_admin') message = '해당 사용자에게 서류 제출을 요청하시겠습니까?';
        else if (newRole === 'facility_admin') message = '서류 확인이 완료되었습니까? 해당 사용자를 일반 시설 관리자로 승인하시겠습니까?';
        else if (newRole === 'user') message = '권한을 해제하시겠습니까?';

        if (!confirm(message)) return;

        console.log(`[UserManagement] Requesting role change: ${userId} -> ${newRole}`);
        try {
            setIsLoading(true);
            await updateUserRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            alert('권한이 성공적으로 변경되었습니다.');
        } catch (error) {
            console.error(error);
            alert('변경 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveMapping = async (sangjoId: string) => {
        if (!selectedUser) return;

        try {
            setIsLoading(true);
            // Use clerk_id for the dashboard mapping
            await approveSangjoUser(selectedUser.id, selectedUser.clerk_id, sangjoId, selectedUser.role, selectedUser.name);
            alert(`${selectedUser.name}님이 해당 업체의 관리자로 승인되었습니다.`);
            setShowMappingModal(false);
            setSelectedUser(null);
            loadUsers();
        } catch (err) {
            console.error(err);
            alert('승인 및 매핑에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderActionArea = (user: AdminUser) => {
        switch (user.role) {
            case 'user':
                return (
                    <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
                        <span className="text-xs text-gray-400 mr-2">일반 회원</span>
                        <button
                            onClick={() => handleRoleChange(user.id, user.clerk_id, 'facility_admin')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all font-medium text-xs whitespace-nowrap"
                        >
                            <CheckCircle size={14} />
                            일반 승인
                        </button>
                        <button
                            onClick={() => handleRoleChange(user.id, user.clerk_id, 'sangjo_branch_manager')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all font-medium text-xs whitespace-nowrap"
                        >
                            <Award size={14} />
                            상조 승인
                        </button>
                        <button
                            onClick={() => handleRoleChange(user.id, user.clerk_id, 'sangjo_hq_admin')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100 transition-all font-medium text-xs whitespace-nowrap"
                        >
                            <Crown size={14} className="w-3.5 h-3.5" />
                            본사 VIP
                        </button>
                    </div>
                );
            case 'pending_facility_admin':
                return (
                    <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
                        <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold mr-2 whitespace-nowrap">
                            <AlertCircle size={12} /> 서류 대기중
                        </div>
                        <button
                            onClick={() => handleRoleChange(user.id, user.clerk_id, 'facility_admin')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-xs whitespace-nowrap shadow-sm"
                        >
                            <CheckCircle size={14} />
                            최종 승인
                        </button>
                        <button
                            onClick={() => handleRoleChange(user.id, user.clerk_id, 'user')}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="요청 취소"
                        >
                            <XCircle size={16} />
                        </button>
                    </div>
                );
            case 'facility_admin':
            case 'sangjo_branch_manager':
            case 'sangjo_hq_admin':
                return (
                    <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold mr-2 whitespace-nowrap ${user.role === 'sangjo_hq_admin' ? 'text-purple-600 bg-purple-50' :
                            user.role === 'sangjo_branch_manager' ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50'
                            }`}>
                            <Award size={12} /> {
                                user.role === 'sangjo_hq_admin' ? '상조 본사(VIP)' :
                                    user.role === 'sangjo_branch_manager' ? '상조 지점장' : '업체 관리자'
                            }
                        </div>
                        {user.subscription_plan && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[10px] font-bold shadow-sm whitespace-nowrap">
                                <Zap size={10} className="fill-amber-500 text-amber-500" />
                                {user.subscription_plan}
                            </div>
                        )}
                        <button
                            onClick={() => handleRoleChange(user.id, user.clerk_id, 'user')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all font-medium text-xs whitespace-nowrap"
                        >
                            권한 해제
                        </button>
                    </div>
                );
            case 'super_admin':
                return (
                    <div className="text-left sm:text-right">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">슈퍼 관리자</span>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-2 sticky top-0 z-10">
                <Search className="text-gray-400" size={20} />
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="이름, 전화번호, 이메일 검색..."
                        className="flex-1 outline-none text-sm"
                    />
                    <button type="submit" className="hidden">검색</button> {/* Handles Enter key */}
                    {searchTerm && (
                        <button type="button" onClick={() => { setSearchTerm(''); loadUsers(); }} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            초기화
                        </button>
                    )}
                </form>
                <div onClick={loadUsers} className="cursor-pointer p-2 hover:bg-gray-100 rounded-full" title="새로고침">
                    <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
                </div>
            </div>

            {/* Compact User User List */}
            <div className="space-y-2">
                {users.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
                        검색 결과가 없습니다.
                    </div>
                ) : (
                    users.map(user => (
                        <div key={user.id} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-200 transition-colors">
                            {/* User Info Column - Clickable for details */}
                            <div
                                className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer group/info"
                                onClick={() => setDetailUser(user)}
                                title="상세 정보 보기"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${user.role.includes('admin') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {user.image_url ? (
                                        <img src={user.image_url} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </div>
                                <div className="min-w-0 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base font-bold text-gray-900 truncate group-hover/info:text-blue-600 transition-colors">
                                            {user.name}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-mono px-1.5 py-0.5 bg-gray-50 rounded border border-gray-100">
                                            {user.id.slice(0, 8)}...
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Mail size={12} className="text-gray-400 shrink-0" />
                                            <span className="truncate">{user.email}</span>
                                        </div>
                                        {user.phone_number && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                                                <Phone size={12} className="text-gray-400 shrink-0" />
                                                <span>{user.phone_number}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action / Status Column */}
                            <div className="flex items-center justify-start sm:justify-end sm:border-l sm:pl-4 border-gray-100 sm:min-w-[200px]">
                                {renderActionArea(user)}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 사용자 상세 정보 모달 */}
            {detailUser && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
                            <button
                                onClick={() => setDetailUser(null)}
                                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                            >
                                <XCircle size={20} />
                            </button>
                            <div className="absolute -bottom-12 left-6">
                                <div className="w-24 h-24 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden flex items-center justify-center">
                                    {detailUser.image_url ? (
                                        <img src={detailUser.image_url} alt={detailUser.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={40} className="text-gray-300" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-16 p-6 pb-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{detailUser.name}</h2>
                                    <p className="text-sm text-gray-500 font-mono mt-1">ID: {detailUser.id}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${detailUser.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                                    detailUser.role.startsWith('sangjo_') ? 'bg-emerald-100 text-emerald-700' :
                                        detailUser.role === 'facility_admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {detailUser.role === 'super_admin' ? '슈퍼 관리자' :
                                        detailUser.role === 'sangjo_hq_admin' ? '상조 본사(VIP)' :
                                            detailUser.role === 'sangjo_branch_manager' ? '상조 지점장' :
                                                detailUser.role === 'facility_admin' ? '업체 관리자' : '일반 회원'}
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-blue-500 shadow-sm border border-gray-100">
                                        <Mail size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">이메일 주소</p>
                                        <p className="text-sm text-gray-900 font-medium truncate">{detailUser.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-emerald-500 shadow-sm border border-gray-100">
                                        <Phone size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">전화번호</p>
                                        <p className="text-sm text-gray-900 font-medium">{detailUser.phone_number || '등록된 번호 없음'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-purple-500 shadow-sm border border-gray-100">
                                        <FileText size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">가입일시</p>
                                        <p className="text-sm text-gray-900 font-medium">
                                            {detailUser.created_at ? new Date(detailUser.created_at).toLocaleString('ko-KR', {
                                                year: 'numeric', month: 'long', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            }) : '기록 없음'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-2">
                                <button
                                    onClick={() => setDetailUser(null)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                                >
                                    닫기
                                </button>
                                {detailUser.role === 'user' && (
                                    <button
                                        onClick={() => {
                                            setDetailUser(null);
                                            handleRoleChange(detailUser.id, detailUser.clerk_id, 'facility_admin');
                                        }}
                                        className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                    >
                                        관리자 승인
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 업체 매핑 모달 */}
            {showMappingModal && selectedUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">상조 업체 매핑</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    <span className="font-bold text-slate-900">{selectedUser.name}</span>님을 연결할 업체를 선택하세요.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowMappingModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <XCircle size={18} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-4 bg-white">
                            <div className="relative mb-4">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="업체명 검색..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={mappingSearch}
                                    onChange={(e) => setMappingSearch(e.target.value)}
                                />
                            </div>

                            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {FUNERAL_COMPANIES.filter(c => c.name.includes(mappingSearch)).map(company => (
                                    <button
                                        key={company.id}
                                        onClick={() => handleApproveMapping(company.id)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-primary/5 rounded-xl border border-slate-100 hover:border-primary/20 transition-all group text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                                                    {company.name}
                                                </p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <MapPin size={10} /> 전국 서비스
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" size={18} />
                                    </button>
                                ))}
                                {FUNERAL_COMPANIES.filter(c => c.name.includes(mappingSearch)).length === 0 && (
                                    <div className="py-12 text-center text-slate-400">
                                        검색 결과가 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
                            <button
                                onClick={() => setShowMappingModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
};
