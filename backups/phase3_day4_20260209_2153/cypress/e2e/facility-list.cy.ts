describe('Facility List', () => {
    it('should load list, filter by category and open detail sheet', () => {
        cy.visit('/')
        // wait for facility list to appear
        cy.get('[data-testid="facility-list"]').should('exist')
        // example: filter by "Memorial" category button
        cy.get('[data-testid="category-memorial"]').click()
        // ensure list updates (at least one item)
        cy.get('[data-testid="facility-list"] li').should('have.length.greaterThan', 0)
        // click first facility
        cy.get('[data-testid="facility-list"] li').first().click()
        // detail sheet should appear
        cy.get('[data-testid="facility-detail-sheet"]').should('be.visible')
    })
})
