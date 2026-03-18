import { ViewState } from '../types';

export const APP_ROLE = {
  USER: 'user',
  FACILITY_ADMIN: 'facility_admin',
  FACILITY_MANAGER: 'facility_manager',
  SANGJO_HQ_ADMIN: 'sangjo_hq_admin',
  SANGJO_BRANCH_ADMIN: 'sangjo_branch_admin',
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PARTNER: 'partner',
} as const;

export type AppRole = (typeof APP_ROLE)[keyof typeof APP_ROLE];
type RolePolicyKey = 'user' | 'facility_admin' | 'sangjo_admin' | 'super_admin' | 'legacy_partner';

const COMMON_ALLOWED_VIEWS: readonly ViewState[] = [
  ViewState.MAP,
  ViewState.LIST,
  ViewState.MY_PAGE,
  ViewState.GUIDE,
  ViewState.NOTICES,
  ViewState.SUPPORT,
  ViewState.SETTINGS,
  ViewState.CONSULTATION,
  ViewState.CONSULTATION_HISTORY,
  ViewState.FUNERAL_COMPANIES,
  ViewState.PARTNER_INQUIRY,
  ViewState.PERSONAL_SUBSCRIPTION,
];

// TICKET-B4: role-based access table (single source of truth for role guards)
export const ROLE_ALLOWED_VIEWS: Record<RolePolicyKey, readonly ViewState[]> = {
  user: COMMON_ALLOWED_VIEWS,
  facility_admin: [
    ...COMMON_ALLOWED_VIEWS,
    ViewState.ADMIN,
    ViewState.FACILITY_ADMIN,
    ViewState.SUBSCRIPTION_PLANS,
  ],
  sangjo_admin: [
    ...COMMON_ALLOWED_VIEWS,
    ViewState.FACILITY_ADMIN,
    ViewState.SANGJO_DASHBOARD,
    ViewState.SUBSCRIPTION_PLANS,
  ],
  super_admin: [
    ...COMMON_ALLOWED_VIEWS,
    ViewState.ADMIN,
    ViewState.FACILITY_ADMIN,
    ViewState.SANGJO_DASHBOARD,
    ViewState.SUPER_ADMIN,
    ViewState.SUBSCRIPTION_PLANS,
  ],
  legacy_partner: [
    ...COMMON_ALLOWED_VIEWS,
    ViewState.ADMIN,
    ViewState.FACILITY_ADMIN,
  ],
};

export const LEGACY_PARTNER_FALLBACK_VIEW = ViewState.FACILITY_ADMIN;

const ROLE_ENTRY_VIEW: Record<RolePolicyKey, ViewState> = {
  user: ViewState.MAP,
  facility_admin: ViewState.FACILITY_ADMIN,
  sangjo_admin: ViewState.SANGJO_DASHBOARD,
  super_admin: ViewState.SUPER_ADMIN,
  legacy_partner: LEGACY_PARTNER_FALLBACK_VIEW,
};

const ADMIN_LIKE_VIEWS = new Set<ViewState>([
  ViewState.ADMIN,
  ViewState.FACILITY_ADMIN,
  ViewState.SANGJO_DASHBOARD,
  ViewState.SUPER_ADMIN,
  ViewState.SUBSCRIPTION_PLANS,
]);

export const resolveRolePolicyKey = (role?: string | null): RolePolicyKey => {
  if (!role) return 'user';
  if (role === APP_ROLE.SUPER_ADMIN) return 'super_admin';
  if (role === APP_ROLE.SANGJO_HQ_ADMIN || role === APP_ROLE.SANGJO_BRANCH_ADMIN) return 'sangjo_admin';
  if (role === APP_ROLE.PARTNER) return 'legacy_partner';
  if (role === APP_ROLE.FACILITY_ADMIN || role === APP_ROLE.FACILITY_MANAGER || role === APP_ROLE.ADMIN) {
    return 'facility_admin';
  }
  return 'user';
};

export const isSangjoRole = (role?: string | null): boolean => {
  return resolveRolePolicyKey(role) === 'sangjo_admin';
};

export const getRoleEntryView = (role?: string | null): ViewState => {
  return ROLE_ENTRY_VIEW[resolveRolePolicyKey(role)];
};

export const canAccessView = (role: string | null | undefined, view: ViewState): boolean => {
  const key = resolveRolePolicyKey(role);
  return ROLE_ALLOWED_VIEWS[key].includes(view);
};

export const shouldRedirectAfterLogin = (role: string | null | undefined, currentView: ViewState): boolean => {
  const entryView = getRoleEntryView(role);
  if (entryView !== ViewState.MAP) {
    return currentView !== entryView;
  }
  return ADMIN_LIKE_VIEWS.has(currentView);
};

export const getHashForView = (view: ViewState): string | null => {
  if (view === ViewState.FACILITY_ADMIN) return '#/facility-admin';
  if (view === ViewState.SUPER_ADMIN) return '#/super-admin';
  if (view === ViewState.ADMIN) return '#/admin';
  return null;
};

export const syncHashForView = (view: ViewState): void => {
  const nextHash = getHashForView(view);
  if (!nextHash) return;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
};
