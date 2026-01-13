// utils/confirmAction.ts
// Simple confirm flow using a global event and a custom ConfirmModal component.
// Returns a Promise<boolean> that resolves to true when user confirms.

let resolver: ((value: boolean) => void) | null = null;

/**
 * Open a confirmation dialog with the given message.
 * The ConfirmModal component listens for the "confirm-open" event and displays the UI.
 */
export const openConfirm = (msg: string): Promise<boolean> => {
    return new Promise<boolean>(resolve => {
        resolver = resolve;
        window.dispatchEvent(new CustomEvent('confirm-open', { detail: { msg } }));
    });
};

/**
 * Called by ConfirmModal when the user makes a choice.
 */
export const resolveConfirm = (value: boolean) => {
    if (resolver) {
        resolver(value);
        resolver = null;
        window.dispatchEvent(new Event('confirm-close'));
    }
};
