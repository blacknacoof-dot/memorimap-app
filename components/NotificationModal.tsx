import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, Trash2, Check } from 'lucide-react';
import { UserNotification } from '@/types/db';
import { confirmAsync } from '../src/components/common/ConfirmModal';

const getRelativeTime = (date: string): string => {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;
    return new Date(date).toLocaleDateString('ko-KR');
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        success: { bg: 'bg-green-100', text: 'text-green-700', label: '완료' },
        warning: { bg: 'bg-orange-100', text: 'text-orange-700', label: '주의' },
        error: { bg: 'bg-red-100', text: 'text-red-700', label: '오류' },
        info: { bg: 'bg-blue-100', text: 'text-blue-700', label: '안내' },
    };
    const c = config[type] || config.info;

    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.bg} ${c.text}`}>
            {c.label}
        </span>
    );
};

const TypeIcon: React.FC<{ type: string }> = ({ type }) => {
    switch (type) {
        case 'success':
            return <CheckCircle size={18} className="text-green-500" />;
        case 'warning':
            return <AlertTriangle size={18} className="text-orange-500" />;
        case 'error':
            return <X size={18} className="text-red-500" />;
        default:
            return <Info size={18} className="text-blue-500" />;
    }
};

type FilterTab = '전체' | '안읽음';

export interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: UserNotification[];
    unreadCount: number;
    isLoading: boolean;
    loadError?: string | null;
    onRetry: () => void;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onDelete: (id: string) => void;
    onNavigate: (link: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
    isOpen,
    onClose,
    notifications,
    unreadCount,
    isLoading,
    loadError,
    onRetry,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onNavigate,
}) => {
    const [filter, setFilter] = useState<FilterTab>('전체');
    const [isClosing, setIsClosing] = useState(false);

    // isOpen 전환 시 overflow 제어 + 열림 시 상태 리셋
    const prevIsOpenRef = React.useRef(false);
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            // 모달이 열릴 때 리셋 — DOM overflow 동기화와 함께 1회 수행
            setFilter('전체'); // eslint-disable-line react-hooks/set-state-in-effect
            setIsClosing(false);
        }
        prevIsOpenRef.current = isOpen;

        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 200);
    }, [onClose]);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    }, [handleClose]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose]);

    if (!isOpen) return null;

    const filteredNotifications = filter === '안읽음'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const normalizeNotificationLink = (rawLink: string): string => {
        let normalized = rawLink.trim();
        if (!normalized) return '/';

        if (normalized.startsWith('/#/')) normalized = normalized.slice(2);
        if (normalized.startsWith('#/')) normalized = normalized.slice(1);
        if (!normalized.startsWith('/')) normalized = `/${normalized}`;

        const [rawPath = '/', rawQuery = ''] = normalized.split('?');
        const path = rawPath.endsWith('/') && rawPath.length > 1 ? rawPath.slice(0, -1) : rawPath;
        const params = new URLSearchParams(rawQuery);

        if (path === '/admin' && params.get('tab') === 'subs') {
            return '/super-admin?tab=subs';
        }

        return rawQuery ? `${path}?${rawQuery}` : path;
    };

    const handleNotificationClick = (notif: UserNotification) => {
        if (!notif.is_read) {
            onMarkAsRead(notif.id);
        }

        if (notif.link) {
            onNavigate(normalizeNotificationLink(notif.link));
            handleClose();
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (await confirmAsync('이 알림을 삭제하시겠습니까?')) {
            onDelete(id);
        }
    };

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center transition-colors duration-200 ${isClosing ? 'bg-black/0' : 'bg-black/50'}`}
            onClick={handleBackdropClick}
            data-testid="notification-modal"
        >
            <div
                className={`
                    bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl
                    shadow-2xl flex flex-col
                    max-h-[85dvh] sm:max-h-[80dvh]
                    transition-all duration-200
                    ${isClosing
                        ? 'translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0'
                        : 'translate-y-0 sm:scale-100 sm:opacity-100 animate-slide-up sm:animate-zoom-in'
                    }
                `}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-center pt-2 sm:hidden">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Bell size={20} className="text-gray-700" />
                        <h2 className="text-lg font-bold text-gray-900">알림</h2>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-5 py-2 border-b border-gray-100 flex gap-1 shrink-0">
                    {(['전체', '안읽음'] as FilterTab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                filter === tab
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {tab}
                            {tab === '안읽음' && unreadCount > 0 && (
                                <span className={`ml-1 ${filter === tab ? 'text-blue-100' : 'text-gray-400'}`}>
                                    ({unreadCount})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain">
                    {loadError ? (
                        <div className="p-8 text-center">
                            <Bell size={36} className="mx-auto text-red-300 mb-3" />
                            <p className="text-red-600 text-sm mb-3">{loadError}</p>
                            <button
                                onClick={onRetry}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                            >
                                다시 불러오기
                            </button>
                        </div>
                    ) : isLoading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                            <p className="text-gray-400 text-sm mt-3">로딩 중...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <Bell size={40} className="mx-auto text-gray-200 mb-3" />
                            <p className="text-gray-400 text-sm">
                                {filter === '안읽음' ? '읽지 않은 알림이 없습니다.' : '아직 알림이 없습니다.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filteredNotifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    data-testid={`notification-item-${notif.id}`}
                                    className={`px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${
                                        !notif.is_read ? 'bg-blue-50/40' : ''
                                    }`}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className="flex gap-3">
                                        {!notif.is_read && (
                                            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                                        )}

                                        <div className="mt-0.5 shrink-0">
                                            <TypeIcon type={notif.type} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <TypeBadge type={notif.type} />
                                                <span className="text-[10px] text-gray-400">
                                                    {getRelativeTime(notif.created_at)}
                                                </span>
                                            </div>
                                            <p className={`text-sm font-semibold leading-tight mb-1 ${
                                                !notif.is_read ? 'text-gray-900' : 'text-gray-600'
                                            }`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-gray-500 leading-relaxed break-keep line-clamp-2">
                                                {notif.message}
                                            </p>
                                        </div>

                                        <button
                                            onClick={(e) => handleDelete(e, notif.id)}
                                            className="shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 active:opacity-100"
                                            title="삭제"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="px-5 py-3 border-t border-gray-100 shrink-0">
                        <button
                            onClick={() => onMarkAllAsRead()}
                            disabled={unreadCount === 0}
                            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                unreadCount > 0
                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-[0.98]'
                                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <Check size={16} />
                            모두 읽음으로 표시
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes zoom-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.25s ease-out;
                }
                .animate-zoom-in {
                    animation: zoom-in 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};
