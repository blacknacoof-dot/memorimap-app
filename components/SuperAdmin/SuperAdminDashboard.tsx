import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Assuming primitive UI exists, or build manual tabs if not
import { LayoutDashboard, Users, CreditCard, Bell, BadgeCheck } from 'lucide-react';
import { PartnerAdmissions } from './PartnerAdmissions';
import { SubscriptionManager } from '../dashboard/super-admin/SubscriptionManager';
import { RevenueAnalytics } from '../dashboard/super-admin/RevenueAnalytics';
import { NoticeManager } from '../dashboard/super-admin/NoticeManager';

// Manual Tab Implementation to avoid dependency on shadcn/ui if not present or complex
const SuperAdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'admissions' | 'subscriptions' | 'revenue' | 'notices'>('admissions');

    const renderContent = () => {
        switch (activeTab) {
            case 'admissions': return <PartnerAdmissions />;
            case 'subscriptions': return <SubscriptionManager />;
            case 'revenue': return <RevenueAnalytics />;
            case 'notices': return <NoticeManager />;
            default: return <PartnerAdmissions />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 px-8 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-900 p-2 rounded-lg text-white">
                        <LayoutDashboard size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Super Admin Console</h1>
                        <p className="text-xs text-gray-500">Memorimap Management System</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                    <span>Admin: master@memorimap.com</span>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-8 bg-white p-1 rounded-xl border shadow-sm w-fit">
                    <button
                        onClick={() => setActiveTab('admissions')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'admissions' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <Users size={18} />
                        입점 승인
                    </button>
                    <button
                        onClick={() => setActiveTab('subscriptions')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'subscriptions' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <BadgeCheck size={18} />
                        구독 관리
                    </button>
                    <button
                        onClick={() => setActiveTab('revenue')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'revenue' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <CreditCard size={18} />
                        매출 통계
                    </button>
                    <button
                        onClick={() => setActiveTab('notices')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'notices' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <Bell size={18} />
                        공지사항
                    </button>
                </div>

                {/* Dashboard Content */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default SuperAdminDashboard;
