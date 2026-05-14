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

function getVisualViewportHeight() {
  return Math.round(
    window.visualViewport?.height ||
    window.innerHeight ||
    document.documentElement.clientHeight ||
    0
  );
}

function getVisualViewportOffsetTop() {
  return Math.round(window.visualViewport?.offsetTop || 0);
}

function getKeyboardInset() {
  if (!window.visualViewport) return 0;
  return Math.max(
    0,
    Math.round(window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop)
  );
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
    scrollHeight: el instanceof HTMLElement ? el.scrollHeight : undefined,
    clientHeight: el instanceof HTMLElement ? el.clientHeight : undefined,
    display: style?.display,
    position: style?.position,
    bottom: style?.bottom,
    width: style?.width,
    height: style?.height,
    minHeight: style?.minHeight,
    maxHeight: style?.maxHeight,
    overflow: style?.overflow,
    overflowX: style?.overflowX,
    overflowY: style?.overflowY,
    paddingTop: style?.paddingTop,
    paddingBottom: style?.paddingBottom,
    marginTop: style?.marginTop,
    marginBottom: style?.marginBottom,
    zIndex: style?.zIndex,
    transform: style?.transform,
    whiteSpace: style?.whiteSpace,
    lineHeight: style?.lineHeight,
    fontSize: style?.fontSize,
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
    visualViewportOffsetTop: window.visualViewport?.offsetTop,
    keyboardInset: getRootVar('--native-keyboard-inset'),
    supportsDvh: CSS.supports("height: 100dvh"),
    appHeight: getRootVar('--app-height'),
    nativeVisualViewportHeight: getRootVar('--native-visual-viewport-height'),
    bottomNavHeightVar: getRootVar('--bottom-nav-height'),
    safeBottom: getRootVar('--app-safe-bottom'),
    contentBottom: getRootVar('--app-content-bottom'),
    path: location.pathname,
    userAgent: navigator.userAgent,
    isStandalone: window.matchMedia?.("(display-mode: standalone)")?.matches,
    naver: !!window.naver,
    naverMaps: !!window.naver?.maps,
  });
  logRect('app shell', "[data-debug='app-shell']");
  logRect('app content', "[data-debug='app-content']");
  logRect('top bar', "[data-debug='top-bar']");
  logRect('top bar row', "[data-debug='top-bar-row']");
  logRect('top bar title', "[data-debug='top-bar-title']");
  logRect('smart search input', "#smart-search-input");
  logRect('smart search', "[data-debug='smart-search']");
  logRect('filter bar', "[data-debug='filter-bar']");
  logRect('smart search dropdown', "[data-debug='smart-search-dropdown']");
  logRect('search suggestion card', "[data-debug='search-suggestion-card']");
  logRect('search suggestion chips', "[data-debug='search-suggestion-chips']");
  logRect('emergency cta', "[data-debug='emergency-cta']");
  logRect('emergency cta title', "[data-debug='emergency-cta-title']");
  logRect('emergency cta subtitle', "[data-debug='emergency-cta-subtitle']");
  logRect('map benefit banner', "[data-debug='map-benefit-banner']");
  logRect('map benefit banner close', "[data-debug='map-benefit-banner-close']");
  logRect('map page', "[data-debug='map-page']");
  logRect('map body', "[data-debug='map-body']");
  logRect('map container', "[data-debug='map-container']");
  logRect('map inner', "[data-debug='map-container'] > div");
  logRect('facility list', "[data-debug='facility-list']");
  logRect('facility card', "[data-testid^='facility-card-']");
  logRect('facility list card', "[data-debug='facility-list-card']");
  logRect('facility list card title', "[data-debug='facility-list-card-title']");
  logRect('facility list card meta', "[data-debug='facility-list-card-meta']");
  logRect('facility list card compare button', "[data-debug='facility-list-card-compare-button']");
  logRect('facility bottom sheet', "[data-debug='facility-bottom-sheet']");
  logRect('bottom nav', "[data-debug='bottom-nav']");
  logRect('welcome sheet', "[data-debug='welcome-sheet']");
  logRect('ai floating', "[data-debug='ai-floating']");
  logRect('ai floating button', "[data-debug='ai-floating-button']");
  logRect('ai menu overlay', "[data-debug='ai-menu-overlay']");
  logRect('ai menu card', "[data-debug='ai-menu-card']");
  logRect('sangjo page', "[data-debug='sangjo-page']");
  logRect('sangjo scroll', "[data-debug='sangjo-scroll']");
  logRect('sangjo ai cta', "[data-debug='sangjo-ai-cta']");
  logRect('sangjo card', "[data-debug='sangjo-card']");
  logRect('ai modal', "[data-debug='ai-modal']");
  logRect('ai modal panel', "[data-debug='ai-modal-panel']");
  logRect('ai header', "[data-debug='ai-header']");
  logRect('ai avatar', "[data-debug='ai-avatar']");
  logRect('ai title', "[data-debug='ai-title']");
  logRect('ai close', "[data-debug='ai-close']");
  logRect('ai body', "[data-debug='ai-body']");
  logRect('ai login card', "[data-debug='ai-login-card']");
  logRect('ai region dropdown', "[data-debug='ai-region-dropdown']");
  logRect('ai bottom cta', "[data-debug='ai-bottom-cta']");
  logRect('ai input bar', "[data-debug='ai-input-bar']");
  logRect('my page', "[data-debug='my-page']");
  logRect('profile header', "[data-debug='profile-header']");
  logRect('mypage profile', "[data-debug='profile-header']");
  logRect('profile name row', "[data-debug='profile-name-row']");
  logRect('profile name', "[data-debug='profile-name']");
  logRect('mypage profile name', "[data-debug='profile-name']");
  logRect('profile edit button', "[data-debug='profile-edit-button']");
  logRect('profile email', "[data-debug='profile-email']");
  logRect('mypage profile email', "[data-debug='profile-email']");
  logRect('profile dashboard button', "[data-debug='profile-dashboard-button']");
  logRect('mypage dashboard button', "[data-debug='profile-dashboard-button']");
  logRect('ending note modal', "[data-debug='ending-note-modal']");
  logRect('ending note panel', "[data-debug='ending-note-panel']");
  logRect('ending note header', "[data-debug='ending-note-header']");
  logRect('ending note title', "[data-debug='ending-note-title']");
  logRect('ending note scroll', "[data-debug='ending-note-scroll']");
  logRect('ending note footer', "[data-debug='ending-note-footer']");
  logRect('admin page', "[data-debug='admin-page']");
  logRect('admin header', "[data-debug='admin-header']");
  logRect('admin title', "[data-debug='admin-title']");
  logRect('subscription button', "[data-debug='subscription-button']");
  logRect('admin home button', "[data-debug='admin-home-button']");
  logRect('admin scroll', "[data-debug='admin-scroll']");
  logRect('facility info card', "[data-debug='facility-info-card']");
  logRect('facility name', "[data-debug='facility-name']");
  logRect('facility edit button', "[data-debug='facility-edit-button']");
  logRect('admin status tabs', "[data-debug='admin-status-tabs']");
  logRect('partner apply page', "[data-debug='partner-apply-page']");
  logRect('partner apply scroll', "[data-debug='partner-apply-scroll']");
  logRect('business upload section', "[data-debug='business-upload-section']");
  logRect('partner apply footer space', "[data-debug='partner-apply-footer-space']");
  logRect('sangjo detail page', "[data-debug='sangjo-detail-page']");
  logRect('sangjo detail hero', "[data-debug='sangjo-detail-hero']");
  logRect('sangjo detail tabs', "[data-debug='sangjo-detail-tabs']");
  logRect('sangjo detail tab item', "[data-debug='sangjo-detail-tab-item']");
  logRect('sangjo detail content', "[data-debug='sangjo-detail-content']");
  logRect('sangjo detail scroll', ".sangjo-detail-content");
  logRect('sangjo detail bottom action', "[data-debug='sangjo-detail-bottom-action']");
  logRect('sangjo detail bottom cta', "[data-debug='sangjo-detail-bottom-action']");
  logRect('sangjo detail ai button', "[data-debug='sangjo-detail-ai-button']");
  logRect('sangjo detail contract button', "[data-debug='sangjo-detail-contract-button']");
  logRect('facility detail page', "[data-debug='facility-detail-page']");
  logRect('facility detail tabs', "[data-debug='facility-detail-tabs']");
  logRect('facility detail scroll', "[data-debug='facility-detail-scroll']");
  logRect('facility detail bottom action', "[data-debug='facility-detail-bottom-action']");
  logRect('funeral emergency modal', "[data-debug='funeral-emergency-modal']");
  logRect('funeral emergency header', "[data-debug='funeral-emergency-header']");
  logRect('funeral emergency scroll', "[data-debug='funeral-emergency-scroll']");
  logRect('funeral emergency bottom action', "[data-debug='funeral-emergency-bottom-action']");
  logRect('funeral emergency submit button', "[data-debug='funeral-emergency-submit-button']");
  logRect('facility ai chat', "[data-debug='facility-ai-chat']");
  logRect('facility ai header', "[data-debug='facility-ai-header']");
  logRect('facility ai avatar', "[data-debug='facility-ai-avatar']");
  logRect('facility ai title', "[data-debug='facility-ai-title']");
  logRect('facility ai body', "[data-debug='facility-ai-body']");
  logRect('sangjo ai modal', "[data-debug='sangjo-ai-modal']");
  logRect('sangjo compare ai modal', "[data-debug='sangjo-compare-ai-modal']");
  logRect('sangjo ai panel', "[data-debug='sangjo-ai-panel']");
  logRect('sangjo ai header', "[data-debug='sangjo-ai-header']");
  logRect('sangjo ai title wrap', "[data-debug='sangjo-ai-title-wrap']");
  logRect('sangjo ai back', "[data-debug='sangjo-ai-back']");
  logRect('sangjo ai avatar', "[data-debug='sangjo-ai-avatar']");
  logRect('sangjo ai title', "[data-debug='sangjo-ai-title']");
  logRect('sangjo ai subtitle', "[data-debug='sangjo-ai-subtitle']");
  logRect('sangjo ai title check', "[data-debug='sangjo-ai-title-check']");
  logRect('sangjo ai close', "[data-debug='sangjo-ai-close']");
  logRect('pet ai header', "[data-debug='pet-ai-header']");
  logRect('pet ai title', "[data-debug='pet-ai-title']");
  logRect('pet chat root', "[data-debug='pet-ai-chat']");
  logRect('pet quick reserve', "[data-debug='pet-quick-reserve']");
  logRect('pet ai reserve button', "[data-debug='pet-quick-reserve']");
  logRect('pet ai modal', "[data-debug='pet-ai-modal']");
  logRect('pet ai panel', "[data-debug='pet-ai-panel']");
  logRect('pet ai body', "[data-debug='pet-ai-body']");
  logRect('pet ai message list', "[data-debug='pet-ai-message-list']");
  logRect('pet ai message bubble', "[data-debug='pet-ai-message-bubble']");
  logRect('pet ai quick chips', "[data-debug='pet-ai-quick-chips']");
  logRect('pet ai input bar', "[data-debug='pet-ai-input-bar']");
  logRect('pet ai input', "[data-debug='pet-ai-input-bar']");
  logRect('pet ai input field', "[data-debug='pet-ai-input-field']");
  logRect('pet ai send button', "[data-debug='pet-ai-send-button']");
  logRect('sangjo ai body', "[data-debug='sangjo-ai-body']");
  logRect('sangjo ai menu buttons', "[data-debug='sangjo-ai-menu-buttons']");
  logRect('sangjo compare ai message', "[data-debug='sangjo-compare-ai-message']");
  logRect('sangjo compare ai bot icon', "[data-debug='sangjo-compare-ai-bot-icon']");
  logRect('sangjo compare ai card', "[data-debug='sangjo-compare-ai-card']");
  logRect('sangjo compare ai card logo', "[data-debug='sangjo-compare-ai-card-logo']");
  logRect('sangjo compare ai card title', "[data-debug='sangjo-compare-ai-card-title']");
  logRect('sangjo compare ai footer', "[data-debug='sangjo-compare-ai-footer']");
  logRect('sangjo scenario bot row', "[data-debug='sangjo-scenario-bot-row']");
  logRect('sangjo scenario bot avatar', "[data-debug='sangjo-scenario-bot-avatar']");
  logRect('sangjo scenario bot bubble', "[data-debug='sangjo-scenario-bot-bubble']");
  logRect('sangjo scenario options', "[data-debug='sangjo-scenario-options']");
  logRect('phone reservation modal', "[data-debug='phone-reservation-modal']");
  logRect('phone reservation header', "[data-debug='phone-reservation-header']");
  logRect('phone reservation scroll', "[data-debug='phone-reservation-scroll']");
  logRect('phone reservation bottom action', "[data-debug='phone-reservation-bottom-action']");
  logRect('phone reservation submit button', "[data-debug='phone-reservation-submit-button']");
  logRect('sangjo admin dashboard', "[data-debug='sangjo-admin-dashboard']");
  logRect('sangjo admin topnav', "[data-debug='sangjo-admin-topnav']");
  logRect('sangjo admin tab', "[data-debug='sangjo-admin-tab']");
  logRect('sangjo admin header', "[data-debug='sangjo-admin-header']");
  logRect('sangjo admin content', "[data-debug='sangjo-admin-content']");
  logRect('sangjo admin scroll', "[data-debug='sangjo-admin-scroll']");
  logRect('sangjo admin feature input row', "[data-debug='sangjo-admin-feature-input-row']");
  logRect('sangjo admin feature input', "[data-debug='sangjo-admin-feature-input']");
  logRect('sangjo admin feature save', "[data-debug='sangjo-admin-feature-save']");
  logRect('super admin page', "[data-debug='super-admin-page']");
  logRect('super admin header', "[data-debug='super-admin-header']");
  logRect('super admin filter bar', "[data-debug='super-admin-filter-bar']");
  logRect('super admin table wrapper', "[data-debug='super-admin-table-wrapper']");
  logRect('super admin modal', "[data-debug='super-admin-modal']");
  logRect('super admin bottom area', "[data-debug='super-admin-bottom-area']");

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
  const visualHeight = getVisualViewportHeight();
  const visualOffsetTop = getVisualViewportOffsetTop();
  const keyboardInset = getKeyboardInset();

  document.documentElement.style.setProperty('--app-height', `${height}px`);
  document.body.style.setProperty('--app-height', `${height}px`);
  document.documentElement.style.setProperty('--native-visual-viewport-height', `${visualHeight}px`);
  document.body.style.setProperty('--native-visual-viewport-height', `${visualHeight}px`);
  document.documentElement.style.setProperty('--native-visual-viewport-offset-top', `${visualOffsetTop}px`);
  document.body.style.setProperty('--native-visual-viewport-offset-top', `${visualOffsetTop}px`);
  document.documentElement.style.setProperty('--native-keyboard-inset', `${keyboardInset}px`);
  document.body.style.setProperty('--native-keyboard-inset', `${keyboardInset}px`);
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
