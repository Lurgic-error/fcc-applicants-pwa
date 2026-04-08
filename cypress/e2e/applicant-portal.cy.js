describe('FCC Applicants Portal', () => {
  it('registers, signs in, and submits a new application', () => {
    const nonce = Date.now()
    const email = `applicant.${nonce}@example.com`

    cy.visit('/auth/register')

    cy.get('[data-test="register-first-name"] input').type('Test')
    cy.get('[data-test="register-surname"] input').type('Applicant')
    cy.get('[data-test="register-company"] input').type('Test Co Ltd')
    cy.get('[data-test="register-email"] input').type(email)
    cy.get('[data-test="register-phone"] input').type('+255700000000')
    cy.get('[data-test="register-password"] input').type('Password123!')
    cy.get('[data-test="register-submit"]').click()

    cy.url().should('include', '/portal/dashboard')
    cy.contains('Dashboard').should('be.visible')

    cy.visit('/portal/applications/sfcc-registration/create')

    cy.get('[data-test="application-sector"] input').type('Telecommunications')
    cy.get('[data-test="application-fee"] input').clear().type('250000')
    cy.get('[data-test="application-contract-category"] input').type('Standard Consumer Agreement')
    cy.get('[data-test="application-target-market"] input').type('Retail Consumers')
    cy.get('[data-test="application-consumer-impact-summary"] textarea').type('Consumer rights and obligations statement.')
    cy.contains('button', 'Next').click()

    cy.get('[data-test="application-company"] input').clear().type('Test Co Ltd')
    cy.get('[data-test="application-registration-number"] input').type('REG-7788')
    cy.get('[data-test="application-country"] input').clear().type('Tanzania')
    cy.contains('button', 'Next').click()

    cy.get('[data-test="application-email"] input').clear().type(email)
    cy.get('[data-test="application-phone"] input').clear().type('+255700000000')
    cy.get('[data-test="application-contact-person-name"] input').clear().type('Applicant Contact')
    cy.get('[data-test="application-contact-person-email"] input').clear().type(email)
    cy.get('[data-test="application-contact-person-phone"] input').clear().type('+255700000000')
    cy.get('[data-test="application-postal-address"] input').type('P.O.Box 7788')
    cy.get('[data-test="application-physical-address"] input').type('Dar es Salaam')
    cy.get('[data-test="application-description"] textarea').type('Automated e2e application submission test.')

    cy.get('[data-test="application-submit"]').click()

    cy.contains('Application Details').should('be.visible')
    cy.contains('Application ID').should('be.visible')
  })
})
