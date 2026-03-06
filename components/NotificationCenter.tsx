import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { NotificationModal } from './NotificationModal';

export const NotificationCenter: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isLoading } = useNotifications();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleNavigate = (link: string) => {
        navigate(link);
    };

    return (
        <>
            {/* Bell Icon Trigger */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full border-2 border-white shadow-md">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Modal — portal to body to escape backdrop-filter containing block */}
            {createPortal(
                <NotificationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    notifications={notifications}
                    unreadCount={unreadCount}
                    isLoading={isLoading}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    onDelete={deleteNotification}
                    onNavigate={handleNavigate}
                />,
                document.body
            )}
        </>
    );
};
