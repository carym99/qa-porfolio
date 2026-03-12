// Cypress E2E test - transaction history filters and details

describe('Transaction History', () => {
  beforeEach(() => {
    cy.visit('https://staging-web.samplepay.com/login');

    cy.get('[data-testid="login-email"]').type('customer.qa+history-web@samplepay.com');
    cy.get('[data-testid="login-password"]').type('Password123!');
    cy.get('[data-testid="login-submit"]').click();

    cy.get('[data-testid="dashboard-title"]').should('contain', 'Wallet Dashboard');
    cy.get('[data-testid="nav-transactions"]').click();
    cy.get('[data-testid="transaction-list"]').should('exist');
  });

  it('TH-E2E-001: Filter transactions by date range and verify results', () => {
    cy.get('[data-testid="filter-start-date"]').type('2025-09-01');
    cy.get('[data-testid="filter-end-date"]').type('2025-09-30');

    cy.intercept('GET', '/v1/transactions*').as('fetchTransactions');
    cy.get('[data-testid="apply-filters"]').click();

    cy.wait('@fetchTransactions').its('response.statusCode').should('eq', 200);

    cy.get('[data-testid="transaction-item"]').each(($item) => {
      cy.wrap($item)
        .find('[data-testid="transaction-date"]')
        .invoke('text')
        .then((text) => {
          // simple assertion that date string is non-empty; deeper date-range validation can be added
          expect(text.trim()).to.not.equal('');
        });
    });
  });

  it('TH-E2E-002: Open transaction detail and verify key fields', () => {
    cy.get('[data-testid="transaction-item"]').first().click();

    cy.get('[data-testid="transaction-detail"]').within(() => {
      cy.get('[data-testid="transaction-detail-reference"]').should('not.be.empty');
      cy.get('[data-testid="transaction-detail-status"]').should('not.be.empty');
      cy.get('[data-testid="transaction-detail-amount"]').should('not.be.empty');
    });
  });
});

