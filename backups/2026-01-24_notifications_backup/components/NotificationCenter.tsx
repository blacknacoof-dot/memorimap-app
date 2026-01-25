import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, ExternalLink, Info, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

export const NotificationCenter: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={16} className="text-green-500" />;
            case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
            case 'error': return <X size={16} className="text-red-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white animate-bounce-subtle">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">알림</h3>
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="text-[10px] text-blue-600 hover:underline font-medium"
                                >
                                    모두 읽음
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                        {isLoading ? (
                            <div className="p-10 text-center text-gray-400 text-sm italic">로딩 중...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 text-sm">도착한 알림이 없습니다.</div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                    onClick={() => {
                                        if (!notif.is_read) markAsRead(notif.id);
                                        if (notif.link) window.location.href = `/#${notif.link}`;
                                    }}
                                >
                                    {!notif.is_read && (
                                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-sm" />
                                    )}
                                    <div className="flex gap-3">
                                        <div className="mt-1 shrink-0">{getTypeIcon(notif.type)}</div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold leading-tight mb-1 ${!notif.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-gray-500 leading-relaxed break-keep">
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-2">
                                                {new Date(notif.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-3 bg-gray-50 rounded-b-2xl border-t border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400">알림은 최근 건부터 표시됩니다.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
