## Bug Report – Internal IDs Exposed via Public Transaction API

- **Title**: Internal account and database IDs exposed in `GET /v1/transactions` response  
- **Environment**:
  - Environment: `staging-global`  
  - Transaction Service: `v2.9.0`  
  - API Gateway: `edge-gw v1.14.3`  
  - Date/Time Observed: 2026-03-07 10:18 UTC  

### Steps to Reproduce

1. Authenticate as a **standard end user** (non-admin) via the public API:
   - Endpoint: `POST /v1/auth/login`
   - User: `customer.qa+exposure@samplepay.com`  
2. Obtain access token and call:
   - `GET /v1/transactions?walletId=WALLET-445566&limit=10`  
3. Inspect the JSON response, especially nested `metadata`, `account`, and `ledgerEntry` fields.  
4. Note the presence of the following fields for each transaction:
   - `internalAccountId` (e.g., `"internalAccountId": 892377"`)  
   - `dbId` or `id` (e.g., `"id": "e93f2b68-8c4b-4e4d-99bd-9d9f75b53821"`)  
   - `coreBankingAccountId` (e.g., `"coreBankingAccountId": "CB-ACC-000334455"`)  

### Expected Result

- Public customer-facing transaction APIs should **only** expose:
  - Safe, external identifiers such as `transactionReference`, `clientReference`, and `publicWalletId`.  
  - Masked, non-sensitive account descriptors (e.g., `****1234` for bank account numbers).  
  - No internal system identifiers that could assist in enumeration, correlation attacks, or infrastructure discovery.  

- Fields **not** expected in the response for standard users:
  - Raw internal database primary keys (`id`, `dbId`)  
  - Internal ledger or accounting system IDs (`internalAccountId`)  
  - Core banking account internal identifiers (`coreBankingAccountId`)  

### Actual Result

- The `GET /v1/transactions` response for a standard end user contains:
  - `internalAccountId` with integer ID for each ledger entry  
  - Raw database UUIDs in the `id` field  
  - Internal core banking account identifiers (`coreBankingAccountId`)  

- These values are visible in production-like environments behind a customer token, not restricted to admin/ops APIs.

### Severity

- **Severity**: High  
- **Priority**: P1  

Rationale:
- Exposes **internal identifiers** that could:
  - Make lateral movement easier in case of token compromise.  
  - Aid in reverse-engineering internal data models and account structures.  
  - Breach internal security guidelines and may conflict with compliance expectations.  

### Impact

- Affects **all consumers** of the public transaction listing API in current design.
- Increases risk of:
  - Data mining by malicious users to infer internal structures and relationships.  
  - Enumeration attacks targeting specific internal accounts or ledger entries.  
  - Breach of internal-only data classification rules.

### Additional Notes / Attachments

- Recommended remediation:
  - Introduce a dedicated **response DTO** for public APIs that only exposes whitelisted, customer-safe fields.  
  - Move internal IDs to internal-only APIs or ensure they are excluded when the caller is a regular customer.  
  - Add automated API contract tests and security scans to ensure no internal IDs are leaked in public responses.  

