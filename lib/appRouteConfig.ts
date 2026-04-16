import { matchPath } from 'react-router-dom';
import { ViewState } from '../types';

export type AppRouteLayout = 'main' | 'share' | 'external-guide';
export type AppRouteAction = 'open-login-modal' | null;

export interface ParsedAppRoute {
  layout: AppRouteLayout;
  viewState: ViewState | null;
  action: AppRouteAction;
  canonicalPath: string | null;
}

const ROUTABLE_PATH_TO_VIEW: Record<string, ViewState> = {
  '/': ViewState.MAP,
  '/admin': ViewState.ADMIN,
  '/facility-admin': ViewState.FACILITY_ADMIN,
  '/super-admin': ViewState.SUPER_ADMIN,
  '/sangjo-dashboard': ViewState.SANGJO_DASHBOARD,
  '/funeral-company': ViewState.FUNERAL_COMPANIES,
  '/partner-inquiry': ViewState.PARTNER_INQUIRY,
  '/subscription-plans': ViewState.SUBSCRIPTION_PLANS,
  '/personal-subscription': ViewState.PERSONAL_SUBSCRIPTION,
};

const VIEW_TO_PATH: Record<ViewState, string> = {
  [ViewState.ADMIN]: '/admin',
  [ViewState.FACILITY_ADMIN]: '/facility-admin',
  [ViewState.SUPER_ADMIN]: '/super-admin',
  [ViewState.SANGJO_DASHBOARD]: '/sangjo-dashboard',
  [ViewState.FUNERAL_COMPANIES]: '/funeral-company',
  [ViewState.PARTNER_INQUIRY]: '/partner-inquiry',
  [ViewState.SUBSCRIPTION_PLANS]: '/subscription-plans',
  [ViewState.PERSONAL_SUBSCRIPTION]: '/personal-subscription',
  [ViewState.MAP]: '/',
  [ViewState.LIST]: '/',
  [ViewState.MY_PAGE]: '/',
  [ViewState.GUIDE]: '/',
  [ViewState.NOTICES]: '/',
  [ViewState.SUPPORT]: '/',
  [ViewState.SETTINGS]: '/',
  [ViewState.CONSULTATION]: '/',
  [ViewState.CONSULTATION_HISTORY]: '/',
  [ViewState.ADMIN_CHECKLIST]: '/',
};

const normalizePathname = (pathname: string): string => {
  if (!pathname) return '/';
  if (pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
};

const withSearch = (pathname: string, search: string): string => {
  return search ? `${pathname}${search}` : pathname;
};

export const parseAppRoute = (pathname: string, search: string): ParsedAppRoute => {
  const normalizedPath = normalizePathname(pathname);
  const params = new URLSearchParams(search);

  if (normalizedPath === '/admin' && params.get('tab') === 'subs') {
    return {
      layout: 'main',
      viewState: ViewState.SUPER_ADMIN,
      action: null,
      canonicalPath: '/super-admin?tab=subs',
    };
  }

  if (normalizedPath === '/auth') {
    return {
      layout: 'main',
      viewState: ViewState.MAP,
      action: 'open-login-modal',
      canonicalPath: '/',
    };
  }

  if (normalizedPath === '/external-browser-guide') {
    return {
      layout: 'external-guide',
      viewState: null,
      action: null,
      canonicalPath: null,
    };
  }

  if (matchPath('/share/:token', normalizedPath)) {
    return {
      layout: 'share',
      viewState: null,
      action: null,
      canonicalPath: null,
    };
  }

  const mappedView = ROUTABLE_PATH_TO_VIEW[normalizedPath];
  if (mappedView) {
    return {
      layout: 'main',
      viewState: mappedView,
      action: null,
      canonicalPath: null,
    };
  }

  return {
    layout: 'main',
    viewState: ViewState.MAP,
    action: null,
    canonicalPath: null,
  };
};

export const getPathForViewState = (viewState: ViewState): string => {
  return VIEW_TO_PATH[viewState] ?? '/';
};

export const resolveLegacyPathToHashUrl = (pathname: string, search: string): string | null => {
  const normalizedPath = normalizePathname(pathname);
  if (normalizedPath === '/') return null;

  const params = new URLSearchParams(search);
  if (normalizedPath === '/admin' && params.get('tab') === 'subs') {
    return '/#/super-admin?tab=subs';
  }

  if (normalizedPath === '/admin') {
    return '/#/facility-admin';
  }

  if (matchPath('/share/:token', normalizedPath)) {
    return withSearch(`/#${normalizedPath}`, search);
  }

  const passthroughPaths = new Set([
    '/facility-admin',
    '/super-admin',
    '/sangjo-dashboard',
    '/funeral-company',
    '/partner-inquiry',
    '/subscription-plans',
    '/personal-subscription',
    '/auth',
    '/external-browser-guide',
  ]);

  if (!passthroughPaths.has(normalizedPath)) {
    return null;
  }

  return withSearch(`/#${normalizedPath}`, search);
};

export const getInitialLayoutFromHash = (hash: string): AppRouteLayout => {
  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const [hashPath = '/', hashQuery = ''] = normalizedHash.split('?');
  const pathname = hashPath || '/';
  const search = hashQuery ? `?${hashQuery}` : '';
  return parseAppRoute(pathname, search).layout;
};
