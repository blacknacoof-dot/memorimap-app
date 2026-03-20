import type { QueryClient } from '@tanstack/react-query';
import { useChatStore } from '../stores/useChatStore';
import { useConversationStore } from '../stores/conversationStore';
import { useSangjoFavoriteStore } from '../stores/useSangjoFavoriteStore';
import { useConfirmModal, usePromptModal } from '../src/components/common/ConfirmModal';

export const LOGOUT_STORAGE_PREFIXES = ['sb-', 'conv_id_'] as const;
export const LOGOUT_STORAGE_EXACT_KEYS = ['supabase.auth.token'] as const;

export interface LogoutCleanupResult {
  removedLocalStorageKeys: string[];
  removedSessionStorageKeys: string[];
}

const shouldRemoveStorageKey = (key: string): boolean => {
  if (LOGOUT_STORAGE_EXACT_KEYS.some((exactKey) => exactKey === key)) return true;
  return LOGOUT_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));
};

const removeMatchingStorageKeys = (storage: Storage): string[] => {
  const removedKeys: string[] = [];
  const keys: string[] = [];

  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key) keys.push(key);
  }

  keys.forEach((key) => {
    if (!shouldRemoveStorageKey(key)) return;
    storage.removeItem(key);
    removedKeys.push(key);
  });

  return removedKeys;
};

export async function runLogoutCleanup(queryClient: QueryClient): Promise<LogoutCleanupResult> {
  await queryClient.cancelQueries();
  queryClient.clear();

  useChatStore.getState().resetChatState();
  useConversationStore.getState().resetConversationState();
  useSangjoFavoriteStore.getState().resetFavoritesState();
  useConfirmModal.getState().close();
  usePromptModal.getState().close();

  if (typeof window === 'undefined') {
    return { removedLocalStorageKeys: [], removedSessionStorageKeys: [] };
  }

  const removedLocalStorageKeys = removeMatchingStorageKeys(window.localStorage);
  const removedSessionStorageKeys = removeMatchingStorageKeys(window.sessionStorage);

  return { removedLocalStorageKeys, removedSessionStorageKeys };
}
