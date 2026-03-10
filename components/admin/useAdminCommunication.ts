import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getInquiries, Inquiry } from '../../lib/queries';
import { getPlatformNotices, createPlatformNotice } from '../../lib/sangjoQueries';
import { PlatformNotice } from '../../types';
import { SupabaseClient } from '@supabase/supabase-js';

type TabType = 'notices' | 'inquiries' | 'customer_support';

export function useAdminCommunication(client: SupabaseClient, initialFilter?: string) {
    const [activeTab, setActiveTab] = useState<TabType>('notices');
    const [filterText, setFilterText] = useState(initialFilter ?? '');
    const [notices, setNotices] = useState<PlatformNotice[]>([]);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [supportInquiries, setSupportInquiries] = useState<Inquiry[]>([]);
    const [expandedSupport, setExpandedSupport] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [noticeTitle, setNoticeTitle] = useState('');
    const [noticeContent, setNoticeContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'notices') {
                const data = await getPlatformNotices(undefined, client);
                setNotices(data);
            } else if (activeTab === 'customer_support') {
                const data = await getInquiries(client);
                setSupportInquiries(data.filter((i) => i.type === 'customer_support' || i.inquiryType === 'customer_support'));
            } else {
                const data = await getInquiries(client);
                setInquiries(data.filter((i) => i.type !== 'customer_support' && i.inquiryType !== 'customer_support'));
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '네트워크 오류';
            toast.error('데이터 로딩 실패: ' + message);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, client]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (initialFilter) {
            setFilterText(initialFilter);
            setActiveTab('inquiries');
        }
    }, [initialFilter]);

    const handleNoticeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await createPlatformNotice({ title: noticeTitle, content: noticeContent, notice_type: 'info' }, client);
            toast.success('공지사항이 등록되었습니다.');
            setNoticeTitle('');
            setNoticeContent('');
            loadData();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '권한 오류';
            toast.error('공지사항 등록 실패: ' + message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        activeTab,
        setActiveTab,
        filterText,
        setFilterText,
        notices,
        inquiries,
        supportInquiries,
        expandedSupport,
        setExpandedSupport,
        isLoading,
        noticeTitle,
        setNoticeTitle,
        noticeContent,
        setNoticeContent,
        isSubmitting,
        handleNoticeSubmit,
    };
}
