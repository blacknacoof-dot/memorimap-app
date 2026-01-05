import React, { useState } from 'react';
import { UserManagement } from './UserManagement';
import { PartnerAdmissions } from './PartnerAdmissions';
import { SubscriptionStatus } from './SubscriptionStatus';
import { Users, Building2, CreditCard, LayoutDashboard } from 'lucide-react';

type Tab = 'users' | 'admissions' | 'subscriptions';

export const SuperAdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('users');

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-purple-600 p-2 rounded-lg text-white">
                            <LayoutDashboard size={20} />
                        </div>
                        <h1 className="text-lg font-bold text-gray-900">슈퍼 관리자 센터</h1>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">v1.2.0</div>
                </div>

                {/* Tabs */}
                <div className="max-w-5xl mx-auto px-4 mt-2">
                    <div className="flex gap-6 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`pb-3 flex items-center gap-2 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'users'
                                    ? 'text-purple-600 border-purple-600'
                                    : 'text-gray-500 border-transparent hover:text-gray-800'
                                }`}
                        >
                            <Users size={18} />
                            유저 관리
                        </button>
                        <button
                            onClick={() => setActiveTab('admissions')}
                            className={`pb-3 flex items-center gap-2 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'admissions'
                                    ? 'text-purple-600 border-purple-600'
                                    : 'text-gray-500 border-transparent hover:text-gray-800'
                                }`}
                        >
                            <Building2 size={18} />
                            입점 관리
                        </button>
                        <button
                            onClick={() => setActiveTab('subscriptions')}
                            className={`pb-3 flex items-center gap-2 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'subscriptions'
                                    ? 'text-purple-600 border-purple-600'
                                    : 'text-gray-500 border-transparent hover:text-gray-800'
                                }`}
                        >
                            <CreditCard size={18} />
                            구독 현황
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'admissions' && <PartnerAdmissions />}
                {activeTab === 'subscriptions' && <SubscriptionStatus />}
            </div>
        </div>
    );
};
