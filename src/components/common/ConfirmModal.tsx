import React, { useState } from 'react';
import { create } from 'zustand';

interface ConfirmModalState {
    isOpen: boolean;
    title: string;
    message: string;
    requireCheckbox?: boolean;
    isProcessing: boolean;
    onConfirm: (() => void | Promise<void>) | null;
    onCancel: (() => void) | null;
    open: (params: { title: string; message: string; onConfirm: () => void | Promise<void>; onCancel?: () => void; requireCheckbox?: boolean }) => void;
    close: () => void;
    setProcessing: (v: boolean) => void;
}

export const useConfirmModal = create<ConfirmModalState>((set: (partial: Partial<ConfirmModalState> | ((state: ConfirmModalState) => Partial<ConfirmModalState>)) => void) => ({
    isOpen: false,
    title: '',
    message: '',
    requireCheckbox: false,
    isProcessing: false,
    onConfirm: null,
    onCancel: null,
    open: ({ title, message, onConfirm, onCancel, requireCheckbox }) =>
        set({ isOpen: true, title, message, onConfirm, onCancel: onCancel || null, requireCheckbox: requireCheckbox || false, isProcessing: false }),
    close: () => set({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null, requireCheckbox: false, isProcessing: false }),
    setProcessing: (v: boolean) => set({ isProcessing: v }),
}));

export const ConfirmModal: React.FC = () => {
    const { isOpen, title, message, requireCheckbox, isProcessing, onConfirm, onCancel, close, setProcessing } = useConfirmModal();
    const [isConfirmed, setIsConfirmed] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!onConfirm) return;
        setProcessing(true);
        try {
            await onConfirm();
        } catch (_err) {
            // onConfirm 오류는 호출자 책임
        } finally {
            setProcessing(false);
            close();
            setIsConfirmed(false);
        }
    };

    const handleClose = () => {
        if (isProcessing) return;
        if (onCancel) onCancel();
        close();
        setIsConfirmed(false);
    };

    const isButtonDisabled = (requireCheckbox && !isConfirmed) || isProcessing;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-[10000] p-4" data-testid="confirm-modal">
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
                        disabled={isProcessing}
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
                        {isProcessing ? '처리 중...' : '확인'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const confirmAsync = (message: string, title = '확인'): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
        useConfirmModal.getState().open({
            title,
            message,
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
        });
    });
};

/* ─── promptAsync: prompt() 대체 입력 모달 ─── */
interface PromptModalState {
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    placeholder: string;
    resolve: ((value: string | null) => void) | null;
    open: (params: { title: string; message: string; defaultValue?: string; placeholder?: string }) => Promise<string | null>;
    close: () => void;
}

export const usePromptModal = create<PromptModalState>((set: (partial: Partial<PromptModalState> | ((state: PromptModalState) => Partial<PromptModalState>)) => void) => ({
    isOpen: false,
    title: '',
    message: '',
    defaultValue: '',
    placeholder: '',
    resolve: null,
    open: (params: { title: string; message: string; defaultValue?: string; placeholder?: string }) => {
        return new Promise<string | null>((resolve) => {
            set({
                isOpen: true,
                title: params.title,
                message: params.message,
                defaultValue: params.defaultValue || '',
                placeholder: params.placeholder || '',
                resolve,
            });
        });
    },
    close: () => {
        const { resolve } = usePromptModal.getState();
        if (resolve) resolve(null);
        set({ isOpen: false, title: '', message: '', defaultValue: '', placeholder: '', resolve: null });
    },
}));

export const PromptModal: React.FC = () => {
    const { isOpen, title, message, defaultValue, placeholder, resolve, close } = usePromptModal();
    const [value, setValue] = useState(defaultValue);

    React.useEffect(() => {
        if (isOpen) setValue(defaultValue);
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (resolve) resolve(value);
        usePromptModal.setState({ isOpen: false, title: '', message: '', defaultValue: '', placeholder: '', resolve: null });
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-[10000] p-4" data-testid="prompt-modal">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                <h2 className="text-lg font-semibold mb-2">{title}</h2>
                <p className="text-sm text-gray-600 mb-4">{message}</p>
                <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                    data-testid="prompt-modal-input"
                />
                <div className="flex justify-end space-x-3 mt-4">
                    <button type="button" onClick={close} className="px-4 py-2 rounded border hover:bg-gray-50 bg-white text-sm" data-testid="prompt-modal-no">
                        취소
                    </button>
                    <button type="button" onClick={handleSubmit} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm" data-testid="prompt-modal-yes">
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export const promptAsync = (message: string, title = '입력', options?: { defaultValue?: string; placeholder?: string }): Promise<string | null> => {
    return usePromptModal.getState().open({
        title,
        message,
        defaultValue: options?.defaultValue,
        placeholder: options?.placeholder,
    });
};
