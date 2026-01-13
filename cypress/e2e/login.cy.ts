describe('Login Flow', () => {
    it('should log in with Clerk test credentials and show protected UI', () => {
        cy.fixture('user').then(user => {
            cy.login(user.email, user.password)
        })
        // after login, a protected element should be visible, e.g., My Page link
        cy.contains('My Page').should('be.visible')
    })
})
