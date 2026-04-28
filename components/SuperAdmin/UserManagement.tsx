import React, { useState } from 'react';
import { Search, RefreshCw, User, UserCheck } from 'lucide-react';
import { useAllUsers } from '../../hooks/useUsers';
import { useUser } from '../../lib/auth';
import { confirmAsync } from '../../src/components/common/ConfirmModal';

export const UserManagement: React.FC = () => {
    const { user: currentAdmin } = useUser();
    const { users, loading, refresh, updateRole, includeTestUsers, setIncludeTestUsers } = useAllUsers();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const normalizedSearch = searchTerm.toLowerCase();
    const filteredUsers = users.filter((user) => {
        const matchesSearch = !normalizedSearch ||
            user.email?.toLowerCase().includes(normalizedSearch) ||
            user.full_name?.toLowerCase().includes(normalizedSearch);
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        return Boolean(matchesSearch && matchesRole);
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex flex-1 items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2">
                    <Search className="text-gray-400" size={18} />
                    <input
                        data-testid="user-management-search-input"
                        id="user-search"
                        name="user-search"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="이름, 이메일 검색"
                        className="w-full bg-transparent text-sm outline-none"
                    />
                </div>

                <select
                    data-testid="user-management-role-filter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                    <option value="all">모든 권한</option>
                    <option value="user">일반 사용자</option>
                    <option value="facility_admin">시설 관리자</option>
                    <option value="sangjo_admin">상조 관리자</option>
                    <option value="super_admin">슈퍼 관리자</option>
                </select>

                <label className="flex items-center gap-2 whitespace-nowrap text-xs text-gray-600">
                    <input
                        data-testid="user-management-include-test-users"
                        type="checkbox"
                        checked={includeTestUsers}
                        onChange={(e) => setIncludeTestUsers(e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    테스트 계정 포함
                </label>

                <button
                    onClick={refresh}
                    className="rounded-full p-2 transition-colors hover:bg-gray-100"
                    title="새로고침"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin text-primary' : 'text-gray-500'} />
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-700">
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
                                    <td colSpan={4} className="px-6 py-10 text-center">데이터를 불러오는 중입니다.</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center">조건에 맞는 사용자가 없습니다.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    (() => {
                                        const isCurrentAdmin = Boolean(currentAdmin?.id && user.id === currentAdmin.id);
                                        return (
                                    <tr
                                        key={user.id}
                                        data-testid={`user-management-row-${user.id}`}
                                        className="border-b bg-white transition-colors hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                                    <User size={16} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{user.full_name || '이름 없음'}</div>
                                                    <div className="text-xs text-gray-500">{user.email || '이메일 없음'}</div>
                                                    <div className="mt-0.5 font-mono text-[10px] text-gray-400">
                                                        {user.id?.substring(0, 8)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded border px-2 py-1 text-xs font-bold ${
                                                    user.role === 'super_admin'
                                                        ? 'border-purple-200 bg-purple-100 text-purple-700'
                                                        : user.role === 'facility_admin'
                                                            ? 'border-blue-200 bg-blue-100 text-blue-700'
                                                            : user.role === 'sangjo_admin'
                                                                ? 'border-amber-200 bg-amber-100 text-amber-700'
                                                                : 'border-gray-200 bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    data-testid={`user-management-role-select-${user.id}`}
                                                    value={user.role}
                                                    disabled={isCurrentAdmin}
                                                    onChange={async (e) => {
                                                        const newRole = e.target.value;
                                                        const element = e.target;

                                                        if (
                                                            await confirmAsync(
                                                                `${user.email} 사용자의 권한을 ${newRole}(으)로 변경하시겠습니까?`,
                                                            )
                                                        ) {
                                                            await updateRole(user.id, newRole, currentAdmin?.id);
                                                        } else {
                                                            element.value = user.role;
                                                        }
                                                    }}
                                                    className="cursor-pointer rounded border bg-white px-2 py-1 text-xs outline-none transition-colors hover:border-gray-400 focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
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
                                        );
                                    })()
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-between border-t bg-gray-50 px-6 py-3 text-xs text-gray-500">
                    <span>총 {filteredUsers.length}명의 사용자</span>
                    <span>
                        {includeTestUsers
                            ? '* 테스트 계정을 포함해 표시 중입니다.'
                            : '* 기본값으로 테스트 계정은 숨김 처리됩니다.'}
                    </span>
                </div>
            </div>
        </div>
    );
};
