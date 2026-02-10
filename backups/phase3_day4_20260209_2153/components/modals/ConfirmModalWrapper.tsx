import React, { useEffect } from 'react';
import { useConfirmModal, ConfirmModal } from '../../src/components/common/ConfirmModal'; // Ensure this path is correct based on project structure
import { resolveConfirm } from '../../utils/confirmAction';

const ConfirmModalWrapper: React.FC = () => {
    const { open } = useConfirmModal();

    useEffect(() => {
        const handleConfirmOpen = (event: Event) => {
            const customEvent = event as CustomEvent<{ msg: string; title?: string; requireCheckbox?: boolean }>;
            const { msg, title, requireCheckbox } = customEvent.detail;

            open({
                title: title || '확인',
                message: msg,
                requireCheckbox,
                onConfirm: () => resolveConfirm(true),
                onCancel: () => resolveConfirm(false),
            });
        };

        window.addEventListener('confirm-open', handleConfirmOpen);
        return () => window.removeEventListener('confirm-open', handleConfirmOpen);
    }, [open]);

    return <ConfirmModal />;
};

export default ConfirmModalWrapper;
