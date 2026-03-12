## Defect Metrics and Analysis – Fintech QA

This document summarizes example defect patterns and shows how they are analysed at a portfolio level.

### 1. Defect Summary (Sample Snapshot)

| Area                     | Count | P1 | P2 | P3 | Notes                                   |
|--------------------------|------:|---:|---:|---:|-----------------------------------------|
| Payouts / Webhooks       |   4   |  2 |  1 |  1 | Missing credits, duplicate credits      |
| Wallet Transfers         |   3   |  1 |  1 |  1 | Limits & validation issues              |
| Transactions / Reporting |   2   |  0 |  1 |  1 | History vs ledger mismatch              |
| Security / Data Exposure |   2   |  1 |  1 |  0 | Internal IDs and verbose errors         |
| Web UI                   |   3   |  0 |  1 |  2 | Misleading statuses and layout issues   |
| Mobile App               |   2   |  0 |  1 |  1 | Offline handling, stale sessions        |

Related detailed examples are documented in `bug-reports/*.md`.

### 2. Example High-Impact Defects

- **Webhook failure – credit missing** (`webhook-failure-credit-missing.md`)
  - Category: Payouts / Webhooks, Severity: Critical.  
  - Root cause: Non-idempotent webhook consumer and missing reconciliation.  
  - Mitigation: Idempotent processing + scheduled reconciliation job.

- **Duplicate wallet credit due to retries** (`duplicate-transaction.md`)
  - Category: Payouts / Webhooks, Severity: Critical.  
  - Root cause: No uniqueness constraint on `(walletId, customerTransactionReference)`.  
  - Mitigation: Enforce idempotency at persistence and API gateway.

- **Internal ID exposure** (`internal-id-exposure.md`)
  - Category: Security / Data Exposure, Severity: High.  
  - Root cause: Direct mapping from entity models to API responses.  
  - Mitigation: Public DTOs and schema-based response filtering.

### 3. Root Cause Distribution (Illustrative)

| Root Cause Type            | Percentage | Example Defects                                |
|----------------------------|-----------:|-----------------------------------------------|
| Missing idempotency logic  |       30%  | Duplicate credits, double captures            |
| Validation gaps            |       25%  | Negative amount accepted, weak bank code check|
| Integration edge cases     |       20%  | Webhook failures, partial outages             |
| Security design oversights |       15%  | Internal IDs, verbose errors                  |
| UI/UX issues               |       10%  | Misleading status labels, confusing messages  |

### 4. Actions and Improvements

- Prioritize:
  - Strengthening **idempotency** across payouts, top-ups, and payments.  
  - Expanding negative and boundary tests (see `bank-transfer-payout-tests.md`).  
  - Applying the `test-strategy/security-checklist.md` on every API change.  
- Track:
  - Defect discovery over time vs. area to see effectiveness of new tests.  
  - Time to detect and time to resolve for P1/P2 incidents.  

### 5. Visual Evidence

For presentations or portfolio reviews, include screenshots such as:
- `screenshots/bug-webhook-credit-missing.png` – example incident view.  
- `screenshots/bug-duplicate-topup.png` – wallet showing duplicate credit.  
- `screenshots/qa-dashboard.png` – simple chart of defects by area/severity.  

