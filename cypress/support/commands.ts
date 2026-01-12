// ***********************************************
// Cypress Custom Commands
// ***********************************************

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Custom command to login via Clerk
             * @example cy.login('admin@test.com', 'password123')
             */
            login(email: string, password: string): Chainable<void>;

            /**
             * Custom command to handle ConfirmModal
             * @example cy.confirmModal()
             */
            confirmModal(): Chainable<void>;

            /**
             * Custom command to check toast message
             * @example cy.checkToast('저장되었습니다')
             */
            checkToast(message: string): Chainable<void>;
        }
    }
}

// Login command - adapts to your auth system (Clerk)
Cypress.Commands.add('login', (email: string, password: string) => {
    // Note: Adjust selectors based on your actual login UI
    cy.visit('/');

    // Wait for app to load
    cy.get('body').should('be.visible');

    // Click login button (adjust selector as needed)
    cy.get('[data-testid="login-button"], button:contains("로그인")').first().click();

    // Fill login form (adjust selectors for Clerk modal)
    cy.get('input[name="identifier"], input[type="email"]').type(email);
    cy.get('button:contains("Continue"), button:contains("계속")').click();
    cy.get('input[name="password"], input[type="password"]').type(password);
    cy.get('button:contains("Sign in"), button:contains("로그인")').click();

    // Wait for login to complete
    cy.url().should('not.include', 'sign-in');
});

// ConfirmModal handling command
Cypress.Commands.add('confirmModal', () => {
    // Wait for modal to appear
    cy.get('[data-testid="confirm-modal"], .confirm-modal, [role="dialog"]', { timeout: 5000 })
        .should('be.visible');

    // Check the checkbox (if exists)
    cy.get('[data-testid="confirm-checkbox"], input[type="checkbox"]')
        .check({ force: true });

    // Click confirm button
    cy.get('[data-testid="confirm-button"], button:contains("확인"), button:contains("동의")').first()
        .click();

    // Wait for modal to close
    cy.get('[data-testid="confirm-modal"], .confirm-modal, [role="dialog"]')
        .should('not.exist');
});

// Toast message check command
Cypress.Commands.add('checkToast', (message: string) => {
    cy.get('[data-sonner-toast], .toast, [role="alert"]', { timeout: 5000 })
        .should('be.visible')
        .and('contain.text', message);
});

export { };
