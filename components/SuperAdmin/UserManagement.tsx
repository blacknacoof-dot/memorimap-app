import React, { useState } from 'react';
import { useAllUsers } from '../../hooks/useUsers';
import { Search, Shield, User, RefreshCw, UserCheck } from 'lucide-react';

export const UserManagement: React.FC = () => {
    const { users, loading, refresh, updateRole } = useAllUsers();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole = roleFilter === 'all' ? true : user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4 flex-wrap">
                <div className="flex-1 flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
                    <Search className="text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="이름, 이메일 검색..."
                        className="bg-transparent outline-none text-sm w-full"
                    />
                </div>

                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                    <option value="all">모든 권한</option>
                    <option value="user">일반 유저 (User)</option>
                    <option value="facility_admin">시설 관리자 (Facility Admin)</option>
                    <option value="sangjo_admin">상조 관리자 (Sangjo Admin)</option>
                    <option value="super_admin">슈퍼 관리자 (Super Admin)</option>
                </select>

                <button
                    onClick={refresh}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="새로고침"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin text-primary' : 'text-gray-500'} />
                </button>
            </div>

            {/* User List Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                            <tr>
                                <th scope="col" className="px-6 py-3">사용자 정보</th>
                                <th scope="col" className="px-6 py-3">현재 권한</th>
                                <th scope="col" className="px-6 py-3">권한 변경</th>
                                <th scope="col" className="px-6 py-3">가입일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center">데이터 로딩 중...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center">검색된 사용자가 없습니다.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{user.full_name || '이름 없음'}</div>
                                                    <div className="text-xs text-gray-500">{user.email || '이메일 없음'}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">{user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                user.role === 'facility_admin' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                    user.role === 'sangjo_admin' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                        'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => {
                                                        const newRole = e.target.value;
                                                        if (confirm(`${user.email}님의 권한을 ${newRole}(으)로 변경하시겠습니까?`)) {
                                                            updateRole(user.id, newRole);
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-white border rounded text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:border-gray-400 transition-colors"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="facility_admin">Facility Admin</option>
                                                    <option value="sangjo_admin">Sangjo Admin</option>
                                                    <option value="super_admin">Super Admin</option>
                                                </select>
                                                {user.role !== 'user' && <UserCheck size={14} className="text-green-500" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t text-xs text-gray-500 flex justify-between">
                    <span>총 {filteredUsers.length}명의 사용자</span>
                    <span>* 권한 변경 시 해당 유저는 즉시 새로운 대시보드 접근 권한을 갖게 됩니다.</span>
                </div>
            </div>
        </div>
    );
};
