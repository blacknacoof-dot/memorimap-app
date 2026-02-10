import { useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  message: string;
  type: ToastType;
}

interface UseToastReturn {
  toast: Toast | null;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

/**
 * 토스트 알림 관리 Hook
 * @returns 토스트 상태 및 제어 함수
 */
export const useToast = (): UseToastReturn => {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
    
    // 2.5초 후 자동으로 사라짐
    setTimeout(() => {
      setToast(null);
    }, 2500);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return {
    toast,
    showToast,
    hideToast
  };
};

export default useToast;
