let installed = false;
let resizeNotificationsRemaining = 4;
let layoutLogScheduled = false;

const HEIGHT_UPDATE_DELAYS = [0, 80, 240, 600, 1200, 2400];

function shouldLogNativeLayoutMetrics() {
  if (import.meta.env.DEV) return true;
  try {
    return window.localStorage.getItem('memorimap_native_layout_debug') === '1';
  } catch {
    return false;
  }
}

function getViewportHeight() {
  const candidates = [
    window.visualViewport?.height || 0,
    window.innerHeight || 0,
    document.documentElement.clientHeight || 0,
    document.body?.clientHeight || 0,
  ]
    .map(value => Math.round(value))
    .filter(value => value > 0);

  return Math.max(...candidates, 0);
}

function getRootVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getRect(selector: string) {
  return document.querySelector(selector)?.getBoundingClientRect();
}

function logRect(name: string, selector: string) {
  const el = document.querySelector(selector);
  const rect = el?.getBoundingClientRect();
  const style = el ? getComputedStyle(el) : null;
  console.log(name, {
    rect,
    display: style?.display,
    position: style?.position,
    height: style?.height,
    minHeight: style?.minHeight,
    overflow: style?.overflow,
    overflowY: style?.overflowY,
    paddingBottom: style?.paddingBottom,
    zIndex: style?.zIndex,
    transform: style?.transform,
  });
}

function logNativeLayoutMetrics() {
  layoutLogScheduled = false;
  if (!shouldLogNativeLayoutMetrics()) return;
  if (!document.body.classList.contains('native-app')) return;

  console.table({
    innerHeight: window.innerHeight,
    outerHeight: window.outerHeight,
    docClientHeight: document.documentElement.clientHeight,
    bodyClientHeight: document.body.clientHeight,
    visualViewportHeight: window.visualViewport?.height,
    supportsDvh: CSS.supports("height: 100dvh"),
    appHeight: getRootVar('--app-height'),
    bottomNavHeightVar: getRootVar('--bottom-nav-height'),
    safeBottom: getRootVar('--app-safe-bottom'),
    contentBottom: getRootVar('--app-content-bottom'),
    path: location.pathname,
    naver: !!window.naver,
    naverMaps: !!window.naver?.maps,
  });
  logRect('app shell', "[data-debug='app-shell']");
  logRect('app content', "[data-debug='app-content']");
  logRect('map page', "[data-debug='map-page']");
  logRect('map body', "[data-debug='map-body']");
  logRect('map container', "[data-debug='map-container']");
  logRect('map inner', "[data-debug='map-container'] > div");
  logRect('facility list', "[data-debug='facility-list']");
  logRect('facility bottom sheet', "[data-debug='facility-bottom-sheet']");
  logRect('bottom nav', "[data-debug='bottom-nav']");
  logRect('ai floating', "[data-debug='ai-floating']");
  logRect('smart search', "[data-debug='smart-search']");

  console.log('[native-layout:legacy] shell', getRect('.native-app-shell'));
  console.log('[native-layout:legacy] content', getRect('.native-app-shell .app-mobile-shell > div > div > .flex-1.relative.overflow-hidden'));
  console.log('[native-layout:legacy] list', getRect('.native-app-shell .list-view-shell'));
}

function scheduleNativeLayoutLog() {
  if (!shouldLogNativeLayoutMetrics()) return;
  if (layoutLogScheduled) return;
  layoutLogScheduled = true;
  window.setTimeout(logNativeLayoutMetrics, 120);
}

function setNativeViewportVars() {
  const height = getViewportHeight();
  if (height <= 0) return;

  document.documentElement.style.setProperty('--app-height', `${height}px`);
  document.body.style.setProperty('--app-height', `${height}px`);
  scheduleNativeLayoutLog();
  if (resizeNotificationsRemaining > 0) {
    resizeNotificationsRemaining -= 1;
    window.dispatchEvent(new Event('resize'));
  }
}

function scheduleViewportUpdates() {
  HEIGHT_UPDATE_DELAYS.forEach((delay) => {
    window.setTimeout(setNativeViewportVars, delay);
  });
}

export function installNativeViewportVars() {
  if (installed || typeof window === 'undefined' || typeof document === 'undefined') return;
  installed = true;

  setNativeViewportVars();
  scheduleViewportUpdates();

  window.addEventListener('resize', scheduleViewportUpdates, { passive: true });
  window.addEventListener('orientationchange', scheduleViewportUpdates, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleViewportUpdates);
  window.visualViewport?.addEventListener('scroll', scheduleViewportUpdates);
}
