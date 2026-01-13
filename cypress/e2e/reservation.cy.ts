describe('Reservation Flow', () => {
    it('should create a reservation and appear in user reservation list', () => {
        // login first
        cy.fixture('user').then(user => {
            cy.login(user.email, user.password)
        })
        // select a facility (first one for simplicity)
        cy.get('[data-testid="facility-list"] li').first().click()
        // open reservation modal
        cy.get('[data-testid="reserve-button"]').click()
        // fill required fields (example selectors, adjust as needed)
        cy.get('input[name="date"]').type('2026-02-01')
        cy.get('input[name="time"]').type('10:00')
        cy.get('input[name="name"]').type('Test User')
        cy.get('input[name="phone"]').type('010-1234-5678')
        // proceed to next step
        cy.contains('Next').click()
        // confirm reservation
        cy.contains('Confirm').click()
        // intercept API call and assert success
        cy.intercept('POST', '/api/reservations').as('createReservation')
        cy.wait('@createReservation').its('response.statusCode').should('eq', 200)
        // after success, go to reservation list page
        cy.get('[data-testid="my-reservations-link"]').click()
        // verify the newly created reservation appears
        cy.contains('2026-02-01').should('exist')
        cy.contains('10:00').should('exist')
    })
})
