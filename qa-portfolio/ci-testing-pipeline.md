## CI Testing Pipeline – Fintech QA Portfolio

This document describes how the API, web, and mobile tests in this repository can be wired into a CI pipeline.

### 1. Stages Overview

Recommended CI stages:

1. **Build** – build application/services and container images.  
2. **Unit & Component Tests** – run developer-owned tests.  
3. **API Regression (Postman/Newman)** – run collections in `api-testing/postman`.  
4. **Web E2E (Cypress)** – run key E2E flows from `automation-framework/cypress-tests`.  
5. **Mobile E2E (Appium / WebdriverIO)** – run selected mobile specs from `mobile-testing-appium/automation`.  
6. **Reports & Notifications** – publish HTML/JUnit reports and send status to Slack/Email.  

### 2. API Regression Stage

- **Artifacts**:
  - `api-testing/postman/fintech-api-collection.json`  
  - `api-testing/postman/environment.json`  
  - Shared tests in `api-testing/api-test-scripts/postman-tests.js` (mirrored into Postman or Newman setup).  

- **Example command**:

```bash
newman run api-testing/postman/fintech-api-collection.json \
  -e api-testing/postman/environment.json \
  --reporters cli,junit,html \
  --reporter-junit-export reports/newman-api-tests.xml \
  --reporter-html-export reports/newman-api-tests.html
```

- **Gate**:
  - Pipeline fails if:
    - Any request fails assertions.  
    - Overall success rate < 100% for Critical paths (wallet transfer, payouts, payments).  

### 3. Web E2E (Cypress) Stage

- **Artifacts**:
  - `automation-framework/cypress-tests/wallet-transfer.cy.js`  
  - `automation-framework/cypress-tests/payment-flow.cy.js`  
  - `automation-framework/cypress-tests/transaction-history.cy.js` (added for history checks).  

- **Example command**:

```bash
npx cypress run \
  --spec "automation-framework/cypress-tests/wallet-transfer.cy.js,automation-framework/cypress-tests/payment-flow.cy.js,automation-framework/cypress-tests/transaction-history.cy.js" \
  --reporter junit \
  --reporter-options "mochaFile=reports/cypress-[hash].xml"
```

- **Gate**:
  - All smoke specs must pass on each PR.  
  - Full E2E suite can run nightly with looser gate (failures trigger investigation but not immediate block on deployments).

### 4. Mobile E2E (Appium / WebdriverIO) Stage

- **Artifacts**:
  - `mobile-testing-appium/automation/appium-login-test.js`  
  - `mobile-testing-appium/automation/payment-test.js`  
  - `mobile-testing-appium/automation/wallet-topup-test.js` (added to cover top-up flows).  

- **Example command**:

```bash
npx wdio wdio.conf.js --spec \
  mobile-testing-appium/automation/appium-login-test.js,\
  mobile-testing-appium/automation/payment-test.js,\
  mobile-testing-appium/automation/wallet-topup-test.js
```

- **Gate**:
  - Run at least on nightly builds and before mobile app releases.  
  - Treat login and basic payment failures as release blockers.  

### 5. Performance Smoke Stage (Optional)

- Integrate a short k6/JMeter scenario (see `test-strategy/performance-testing-plan.md`).  
- Gate deployments if P95 latency or error rate exceeds thresholds.

### 6. Reporting and Evidence

- Archive:
  - Newman HTML/JUnit reports.  
  - Cypress screenshots/videos and JUnit XML.  
  - WebdriverIO/Appium reports.  
- Example screenshot files referenced from this repo:
  - `screenshots/ci-api-tests.png` – API regression job in CI.  
  - `screenshots/ci-e2e-tests.png` – combined Cypress/Appium stage results.  

