/// <reference types="cypress" />
/**
 * Week 4: E2E Test - Admin Flow
 * 
 * Scenario A: 시설 관리자의 FAQ 수정
 * Scenario B: 슈퍼 관리자의 승인 절차
 */

describe('Admin Flow Tests', () => {

    // =============================================
    // Scenario A: 시설 관리자 FAQ 수정
    // =============================================
    describe('Scenario A: Facility Admin - FAQ 수정', () => {

        beforeEach(() => {
            // Login as facility admin
            cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'));
        });

        it('should navigate to FAQ management page', () => {
            // 1. Navigate to facility admin dashboard
            cy.visit('/#/facility-admin');
            cy.url().should('include', 'facility-admin');

            // 2. Click on FAQ/Settings tab (adjust selector)
            cy.get('[data-testid="faq-tab"], button:contains("FAQ"), button:contains("설정")')
                .first()
                .click();

            // 3. Verify FAQ page loaded
            cy.get('[data-testid="faq-list"], .faq-list')
                .should('be.visible');
        });

        it('should edit FAQ and trigger ConfirmModal', () => {
            // 1. Navigate to FAQ page
            cy.visit('/#/facility-admin');
            cy.get('[data-testid="faq-tab"], button:contains("설정")').first().click();

            // 2. Find and click edit on a FAQ item
            cy.get('[data-testid="faq-item"], .faq-item').first().within(() => {
                cy.get('[data-testid="edit-button"], button:contains("수정")').click();
            });

            // 3. Edit the content
            cy.get('[data-testid="faq-input"], textarea, input[name="content"]')
                .first()
                .clear()
                .type('Updated FAQ content - Test');

            // 4. Click Save button
            cy.get('[data-testid="save-button"], button:contains("저장")').click();

            // 5. Assert: ConfirmModal appears
            cy.get('[data-testid="confirm-modal"], [role="dialog"]', { timeout: 5000 })
                .should('be.visible');

            // 6. Check checkbox and confirm
            cy.confirmModal();

            // 7. Assert: Toast message appears
            cy.checkToast('저장되었습니다');
        });

        it('should persist FAQ changes after save', () => {
            // 1. Navigate to FAQ page
            cy.visit('/#/facility-admin');
            cy.get('[data-testid="faq-tab"], button:contains("설정")').first().click();

            // 2. Verify the updated content is visible
            cy.get('[data-testid="faq-item"], .faq-item')
                .first()
                .should('contain.text', 'Updated FAQ content');
        });
    });

    // =============================================
    // Scenario B: 슈퍼 관리자 승인 절차
    // =============================================
    describe('Scenario B: Super Admin - 업체 승인', () => {

        beforeEach(() => {
            // Login as super admin
            cy.login(Cypress.env('SUPER_ADMIN_EMAIL'), Cypress.env('SUPER_ADMIN_PASSWORD'));
        });

        it('should navigate to approval dashboard', () => {
            // 1. Visit super admin dashboard
            cy.visit('/#/super-admin');
            cy.url().should('include', 'super-admin');

            // 2. Click on Partner Admissions tab
            cy.get('[data-testid="admissions-tab"], button:contains("입점"), button:contains("승인")')
                .first()
                .click();

            // 3. Verify pending applications list
            cy.get('[data-testid="pending-list"], .pending-applications')
                .should('be.visible');
        });

        it('should approve a pending partner with ConfirmModal', () => {
            // 1. Navigate to admissions page
            cy.visit('/#/super-admin');
            cy.get('[data-testid="admissions-tab"], button:contains("승인")').first().click();

            // 2. Find a pending application
            cy.get('[data-testid="pending-item"], .pending-item, tr:contains("대기")').first().as('pendingItem');

            // 3. Click approve button
            cy.get('@pendingItem').within(() => {
                cy.get('[data-testid="approve-button"], button:contains("승인")').click();
            });

            // 4. Assert: ConfirmModal appears
            cy.get('[data-testid="confirm-modal"], [role="dialog"]', { timeout: 5000 })
                .should('be.visible')
                .and('contain.text', '승인');

            // 5. Check checkbox and confirm
            cy.confirmModal();

            // 6. Assert: Status changes to Approved
            cy.get('@pendingItem')
                .should('match', /Approved|승인됨/);

            // 7. Toast confirmation
            cy.checkToast('승인');
        });

        it('should reject a pending partner with reason', () => {
            // 1. Navigate to admissions page
            cy.visit('/#/super-admin');
            cy.get('[data-testid="admissions-tab"], button:contains("승인")').first().click();

            // 2. Find a pending application
            cy.get('[data-testid="pending-item"], .pending-item').first().as('pendingItem');

            // 3. Click reject button
            cy.get('@pendingItem').within(() => {
                cy.get('[data-testid="reject-button"], button:contains("거절")').click();
            });

            // 4. ConfirmModal with reason input
            cy.get('[data-testid="confirm-modal"], [role="dialog"]')
                .should('be.visible');

            // 5. Enter rejection reason
            cy.get('[data-testid="rejection-reason"], textarea')
                .type('서류 미비로 인한 거절');

            // 6. Confirm
            cy.confirmModal();

            // 7. Assert: Status changes to Rejected
            cy.get('@pendingItem')
                .should('match', /Rejected|거절/);
        });
    });

    // =============================================
    // Smoke Tests
    // =============================================
    describe('Smoke Tests', () => {

        it('should load homepage without errors', () => {
            cy.visit('/');
            cy.get('#root').should('be.visible');
            cy.get('body').should('not.contain.text', 'Error');
        });

        it('should display map component', () => {
            cy.visit('/');
            cy.get('.leaflet-container', { timeout: 10000 }).should('be.visible');
        });

        it('should open facility detail on marker click', () => {
            cy.visit('/');

            // Wait for markers to load
            cy.get('.leaflet-marker-icon', { timeout: 15000 }).first().click({ force: true });

            // Facility detail sheet should appear
            cy.get('[data-testid="facility-sheet"], .facility-detail, .bottom-sheet')
                .should('be.visible');
        });
    });
});
