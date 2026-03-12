// Cypress E2E test - payment creation and confirmation

describe('Payment Flow', () => {
  beforeEach(() => {
    cy.visit('https://staging-web.samplepay.com/login');

    cy.get('[data-testid="login-email"]').type('customer.qa+payments-web@samplepay.com');
    cy.get('[data-testid="login-password"]').type('Password123!');
    cy.get('[data-testid="login-submit"]').click();

    cy.get('[data-testid="dashboard-title"]').should('contain', 'Wallet Dashboard');
  });

  it('PF-E2E-001: Create payment and verify in transaction history', () => {
    cy.get('[data-testid="action-pay-merchant"]').click();

    cy.get('[data-testid="merchant-search-input"]').type('Sample Coffee Shop');
    cy.contains('[data-testid="merchant-item"]', 'Sample Coffee Shop').click();

    cy.get('[data-testid="payment-amount-input"]').type('12.50');
    cy.get('[data-testid="payment-currency-select"]').click();
    cy.contains('[role="option"]', 'USD').click();

    cy.intercept('POST', '/v1/payments/authorize').as('paymentAuth');
    cy.intercept('POST', '/v1/payments/capture').as('paymentCapture');

    cy.get('[data-testid="payment-confirm-button"]').click();

    cy.wait('@paymentAuth').its('response.statusCode').should('eq', 201);
    cy.wait('@paymentCapture').its('response.statusCode').should('eq', 200);

    cy.get('@paymentCapture').then((interception) => {
      const body = interception.response.body;
      expect(body.status).to.eq('CAPTURED');
      expect(body.paymentReference).to.be.a('string').and.not.empty;
      cy.wrap(body.paymentReference).as('paymentRef');
    });

    cy.get('[data-testid="payment-success-banner"]').should('contain', 'Payment successful');

    cy.get('[data-testid="nav-transactions"]').click();

    cy.get('@paymentRef').then((paymentRef) => {
      cy.get('[data-testid="transaction-list"]').within(() => {
        cy.contains('[data-testid="transaction-item"]', paymentRef).within(() => {
          cy.get('[data-testid="transaction-status"]').should('contain', 'SUCCESS');
          cy.get('[data-testid="transaction-amount"]').should('contain', '12.50');
        });
      });
    });
  });
});

