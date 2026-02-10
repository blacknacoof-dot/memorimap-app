import React, { useState } from 'react';
import { create } from 'zustand';

interface ConfirmModalState {
    isOpen: boolean;
    title: string;
    message: string;
    requireCheckbox?: boolean;
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
    open: (params: { title: string; message: string; onConfirm: () => void; onCancel?: () => void; requireCheckbox?: boolean }) => void;
    close: () => void;
}

export const useConfirmModal = create<ConfirmModalState>((set: (partial: Partial<ConfirmModalState> | ((state: ConfirmModalState) => Partial<ConfirmModalState>)) => void) => ({
    isOpen: false,
    title: '',
    message: '',
    requireCheckbox: false,
    onConfirm: null,
    onCancel: null,
    open: ({ title, message, onConfirm, onCancel, requireCheckbox }) =>
        set({ isOpen: true, title, message, onConfirm, onCancel: onCancel || null, requireCheckbox: requireCheckbox || false }),
    close: () => set({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null, requireCheckbox: false }),
}));

export const ConfirmModal: React.FC = () => {
    const { isOpen, title, message, requireCheckbox, onConfirm, onCancel, close } = useConfirmModal();
    const [isConfirmed, setIsConfirmed] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        close();
        setIsConfirmed(false); // Reset for next time
    };

    const handleClose = () => {
        if (onCancel) onCancel();
        close();
        setIsConfirmed(false); // Reset for next time
    };

    const isButtonDisabled = requireCheckbox && !isConfirmed;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 p-4" data-testid="confirm-modal">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                <h2 className="text-xl font-semibold mb-4">{title}</h2>
                <p className="mb-6">{message}</p>
                {requireCheckbox && (
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
                )}
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 rounded border hover:bg-gray-50 bg-white"
                        data-testid="confirm-modal-no"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className={`px-4 py-2 rounded text-white ${isButtonDisabled ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        disabled={isButtonDisabled}
                        data-testid="confirm-modal-yes"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};
