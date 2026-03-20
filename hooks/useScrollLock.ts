import { useEffect } from 'react';

/**
 * 모달/시트 열림 시 body 스크롤 잠금.
 * position: fixed 방식으로 iOS Safari의 뒤 배경 바운스도 차단.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const saved = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      body.style.overflow = saved.overflow;
      body.style.position = saved.position;
      body.style.top = saved.top;
      body.style.width = saved.width;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
