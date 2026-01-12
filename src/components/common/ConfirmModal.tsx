import React, { useState } from 'react';
import { create } from 'zustand';

interface ConfirmModalState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
    open: (params: { title: string; message: string; onConfirm: () => void }) => void;
    close: () => void;
}

export const useConfirmModal = create<ConfirmModalState>((set: (partial: Partial<ConfirmModalState> | ((state: ConfirmModalState) => Partial<ConfirmModalState>)) => void) => ({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    open: ({ title, message, onConfirm }) =>
        set({ isOpen: true, title, message, onConfirm }),
    close: () => set({ isOpen: false, title: '', message: '', onConfirm: null }),
}));

export const ConfirmModal: React.FC = () => {
    const { isOpen, title, message, onConfirm, close } = useConfirmModal();
    const [isConfirmed, setIsConfirmed] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        close();
        setIsConfirmed(false); // Reset for next time
    };

    const handleClose = () => {
        close();
        setIsConfirmed(false); // Reset for next time
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                <h2 className="text-xl font-semibold mb-4">{title}</h2>
                <p className="mb-6">{message}</p>
                <div className="flex items-center mb-4">
                    <input
                        type="checkbox"
                        id="confirmCheckbox"
                        className="mr-2"
                        checked={isConfirmed}
                        onChange={(e) => setIsConfirmed(e.target.checked)}
                    />
                    <label htmlFor="confirmCheckbox" className="text-sm text-gray-600">
                        동의합니다
                    </label>
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 rounded border hover:bg-gray-50"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        disabled={!isConfirmed}
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};
