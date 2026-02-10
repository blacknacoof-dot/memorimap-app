describe('Home Page', () => {
    it('should load map and display facility markers', () => {
        cy.visit('/')
        cy.get('#map').should('exist')
        // wait for markers to load
        cy.get('.leaflet-marker-icon').should('have.length.greaterThan', 0)
    })
})
