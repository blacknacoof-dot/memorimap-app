Cypress.Commands.add('login', (email, password) => {
    cy.visit('/')
    cy.get('[data-testid="login-button"]').click()
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password)
    cy.get('button[type="submit"]').click()
    // wait for Clerk to finish loading
    cy.contains('My Page').should('exist')
})

Cypress.Commands.add('selectFacility', (name) => {
    cy.get('[data-testid="facility-list"]').contains(name).click()
})
