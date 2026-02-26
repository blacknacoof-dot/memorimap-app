import React from 'react';

export const QuickMenuBtn: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
}> = ({ icon, label, onClick, active = false }) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all active:scale-95
            ${active
                    ? 'bg-[#E6F2F1] text-[#005B50]'
                    : 'bg-white hover:bg-gray-50 text-gray-600'
                }`}
        >
            <div className={`mb-1 ${active ? 'text-[#005B50]' : 'text-gray-400'}`}>
                {icon}
            </div>
            <span className="text-[10px] font-bold tracking-tight">{label}</span>
        </button>
    );
};
