# Super Admin Precision Checklist

Date: 2026-04-21
Scope: super admin precision check and operator-facing navigation notes

## Current verification status

- Verified pass: `tests/e2e/superAdmin.adminSettings.spec.ts`
- Verified pass: `tests/e2e/superAdmin.systemSettings.spec.ts`
- Verified pass: `tests/e2e/superAdmin.noticeManagement.spec.ts`
- Verified pass: `tests/e2e/superAdmin.monitoring.spec.ts`
- Previously verified pass: `tests/e2e/superAdmin.facilityAssignment.spec.ts`
- Previously verified pass: `tests/e2e/superAdmin.subscriptionManager.spec.ts`
- Previously verified pass: `tests/e2e/superAdmin.auditLogs.spec.ts`

## Operator note

- The top tab bar does not expose every super admin function.
- Direct tabs: `monitoring`, `admissions`, `revenue`, `leads`
- Menu-only areas require opening the side menu first.
- Side menu path: `/#/super-admin` -> top-left menu button -> target item

## Checklist

### Access control

- [ ] Anonymous or general user cannot access `/#/super-admin` directly.
- [ ] After sign-out and switching to another account, the super admin entry point disappears.

### User management

- Path: `/#/super-admin` -> menu -> `회원/권한 관리`
- [ ] Role change persists to `profiles.role`.
- [ ] `audit_logs.action='UPDATE_ROLE'` is recorded.

### Facility management

- Path: `/#/super-admin` -> menu -> `시설 통합 관리`
- [ ] Facility search works.
- [ ] Facility manager assignment works.
- [ ] Assigned account can enter `/#/facility-admin`.

### Subscription management

- Path: `/#/super-admin` -> menu -> `사업장 구독`
- [ ] Facility subscription list loads.
- [ ] Editing next billing date persists to `facility_subscriptions`.

### Personal premium

- Path: `/#/super-admin` -> menu -> `개인 구독`
- [ ] Grant works.
- [ ] Extend works.
- [ ] Revoke works.
- [ ] `premium_grants` and `audit_logs` are updated.

### Admin settings

- Path: `/#/super-admin` -> menu -> `관리자 설정`
- [ ] `full_name` save works.
- [ ] `phone_number` save works.
- [ ] Notification toggles persist to `system_settings`.

### System settings

- Path: `/#/super-admin` -> menu -> `시스템 설정`
- [ ] `maintenance_mode` toggle persists.
- [ ] `commission_rate` save persists.
- [ ] Revenue sync area is understood as manual guidance, not an execution feature.
- [ ] Separate runbook or SQL procedure is available to operators.

### Notices

- Path: `/#/super-admin` -> menu -> `공지사항 관리`
- [ ] Create works.
- [ ] Update works.
- [ ] Soft delete works.

### Monitoring

- Path: `/#/super-admin` -> top tab `통합 관제`
- [ ] Contract detail drawer opens.
- [ ] Admin memo save persists.
- [ ] Communication navigation opens the expected filtered view.

### Leads and partner flows

- Path for leads: `/#/super-admin` -> top tab `상담 리드`
- Path for admissions: `/#/super-admin` -> top tab `파트너 관리`
- [ ] Lead list loads.
- [ ] Partner approval works.
- [ ] Partner communication history is visible where expected.

## Execution note

- Do not run `superAdmin.systemSettings.spec.ts` in parallel with other super admin specs that need normal site access.
- That spec toggles `maintenance_mode`, which can create false failures in unrelated tests.
