describe('Facility Detail', () => {
    it('should display facility information and reviews', () => {
        cy.visit('/')
        // select a facility (replace with a known facility name if needed)
        cy.get('[data-testid="facility-list"] li').first().click()
        // detail sheet should be visible
        cy.get('[data-testid="facility-detail-sheet"]').should('be.visible')
        // check for name, address, and at least one image
        cy.get('[data-testid="facility-name"]').should('exist')
        cy.get('[data-testid="facility-address"]').should('exist')
        cy.get('img[src*="/images/facilities"]').should('have.length.greaterThan', 0)
        // reviews list
        cy.get('[data-testid="review-list"]').should('exist')
    })
})
