## Screenshots and Evidence

This folder is intended to hold **real screenshots** from your tooling so that the portfolio looks like production QA work.  
Save the following images in this directory using the suggested filenames, then push them with the repo.

### API / Postman

- `postman-payout-happy-path.png` – Postman `POST /v1/dev/payouts` successful response with tests passing.  
- `postman-payout-idempotency.png` – First vs second payout request with same `customerTransactionReference` showing idempotent behavior.  
- `postman-payout-negative-validation.png` – Negative payout cases (e.g., invalid bank code, negative amount) with Test tab assertions.  
- `postman-transactions-fetch.png` – `GET /v1/dev/transactions` listing transactions with query params and response preview.

### Mobile / Appium

- `appium-login-success.png` – WebdriverIO/Appium run for `appium-login-test.js` showing successful login on emulator/device.  
- `appium-payment-flow.png` – WebdriverIO/Appium run for `payment-test.js` (wallet payment) including console output or report view.  
- `appium-network-interruption.png` – Scenario where network is disabled mid-payment and the app shows a clear offline message.

### Web / Cypress

- `cypress-wallet-transfer.png` – Cypress run of `wallet-transfer.cy.js` with green checks and network stubs visible.  
- `cypress-payment-flow.png` – Cypress run of `payment-flow.cy.js` including assertions on transaction history.  
- `cypress-transaction-history.png` – Cypress run of `transaction-history.cy.js` once added.

### Bug Evidence

- `bug-webhook-credit-missing.png` – Screenshot of monitoring/transactions UI highlighting a settled acquirer payment with missing wallet credit.  
- `bug-duplicate-topup.png` – Screenshot showing duplicated top-up entries or over-credited wallet balance.  
- `bug-internal-id-exposure.png` – Sanitized screenshot of API response/UI showing internal IDs before fix.

### CI / Reporting

- `ci-api-tests.png` – CI job or local Newman run for API regression suite.  
- `ci-e2e-tests.png` – CI summary for Cypress/Appium runs (pass/fail, duration).  
- `qa-dashboard.png` – Any dashboard summarizing test coverage or defect trends.

> After saving the images with these filenames, they will automatically be referenced by the markdown documents in this repository.

