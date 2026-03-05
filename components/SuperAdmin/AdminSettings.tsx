import React, { useState, useEffect } from 'react';
import { useUser } from '../../lib/auth';
import { toast } from 'sonner';
import { UserCog, Lock, BellRing } from 'lucide-react';
import { useSuperAdminClient } from './SuperAdminGuard';

export const AdminSettings = () => {
    const { user } = useUser();
    const client = useSuperAdminClient();
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        const loadPhone = async () => {
            try {
                const { data } = await client.from('profiles').select('phone').eq('clerk_id', user.id).single();
                if (data?.phone) setPhone(data.phone);
            } catch { /* ignore */ }
        };
        loadPhone();
    }, [user?.id, client]);

    const handleSaveProfile = async () => {
        if (!user?.id) return;
        setSaving(true);
        try {
            const { error } = await client
                .from('profiles')
                .update({ full_name: fullName, phone })
                .eq('clerk_id', user.id);
            if (error) throw error;
            toast.success('프로필 정보가 저장되었습니다.');
        } catch (e: unknown) {
            toast.error('저장 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        const email = user?.primaryEmailAddress?.emailAddress;
        if (!email) {
            toast.error('이메일 정보를 찾을 수 없습니다.');
            return;
        }
        const { error } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/#/reset-password`,
        });
        if (error) {
            toast.error('비밀번호 재설정 이메일 발송에 실패했습니다.');
        } else {
            toast.success('비밀번호 재설정 이메일이 발송되었습니다.');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Profile Section */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-blue-600" />
                    내 정보 수정
                </h3>
                <p className="text-xs text-slate-400 mb-3">{user?.primaryEmailAddress?.emailAddress}</p>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">관리자 이름</label>
                        <input id="admin-fullname" name="admin-fullname" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">연락처</label>
                        <input id="admin-phone" name="admin-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>
                    <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="w-full mt-2 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? '저장 중...' : '정보 업데이트'}
                    </button>
                </div>
            </div>

            {/* Security Section */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-blue-600" />
                    보안 설정
                </h3>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-sm text-slate-600">이메일로 비밀번호 재설정 링크를 발송합니다.</p>
                    <button
                        onClick={handleChangePassword}
                        className="mt-3 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
                    >
                        비밀번호 재설정 이메일 발송
                    </button>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-blue-600" />
                    알림 설정
                </h3>
                <div className="space-y-4">
                    {[
                        { label: '새 상담 접수 알림', desc: '새로운 고객 상담이 접수되면 알림을 받습니다.' },
                        { label: '결제 발생 알림', desc: '구독 또는 수수료 결제가 발생하면 알림을 받습니다.' },
                        { label: '입점 신청 알림', desc: '새로운 시설 입점 신청이 들어오면 알림을 받습니다.' },
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-800">{item.label}</p>
                                <p className="text-[10px] text-slate-400">{item.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked onChange={() => toast.info('알림 설정 기능은 준비 중입니다.')} />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
