// Cypress E2E test - wallet-to-wallet transfer flow

describe('Wallet Transfer Flow', () => {
  beforeEach(() => {
    cy.visit('https://staging-web.samplepay.com/login');

    cy.get('[data-testid="login-email"]').type('customer.qa+web@samplepay.com');
    cy.get('[data-testid="login-password"]').type('Password123!');
    cy.get('[data-testid="login-submit"]').click();

    cy.get('[data-testid="dashboard-title"]').should('contain', 'Wallet Dashboard');
  });

  it('WT-E2E-001: Successful wallet transfer and history verification', () => {
    cy.get('[data-testid="action-transfer"]').click();

    cy.get('[data-testid="transfer-source-wallet"]').should('contain', 'WALLET-1001');
    cy.get('[data-testid="transfer-destination-wallet"]').click();
    cy.get('[data-testid="wallet-option-WALLET-2001"]').click();

    cy.get('[data-testid="transfer-amount"]').type('25.00');
    cy.get('[data-testid="transfer-description"]').type('QA Cypress wallet transfer');

    cy.intercept('POST', '/v1/wallets/transfer').as('walletTransfer');

    cy.get('[data-testid="transfer-submit"]').click();

    cy.wait('@walletTransfer').its('response.statusCode').should('eq', 200);
    cy.get('@walletTransfer').then((interception) => {
      const body = interception.response.body;
      expect(body.status).to.eq('SUCCESS');
      expect(body.transactionReference).to.be.a('string').and.not.empty;

      // store transaction reference for history validation
      cy.wrap(body.transactionReference).as('txnRef');
    });

    cy.get('[data-testid="transfer-success-banner"]').should('contain', 'Transfer successful');

    cy.get('[data-testid="nav-transactions"]').click();

    cy.get('@txnRef').then((txnRef) => {
      cy.get('[data-testid="transaction-list"]').within(() => {
        cy.contains('[data-testid="transaction-item"]', txnRef).within(() => {
          cy.get('[data-testid="transaction-status"]').should('contain', 'SUCCESS');
          cy.get('[data-testid="transaction-amount"]').should('contain', '25.00');
        });
      });
    });
  });
});

