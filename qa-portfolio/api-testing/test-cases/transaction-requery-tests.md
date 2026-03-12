## Transaction Re-query and Reconciliation Test Cases

System under test: **Transaction Service – Re-query and Reconciliation APIs**  
Key endpoints:
- `GET /v1/transactions/{transactionReference}`
- `GET /v1/transactions?clientReference={clientReference}`
- `POST /v1/transactions/reconcile`

### TR-001 – Re-query by transactionReference (successful payment)

- **Test ID**: TR-001  
- **Title**: Re-query returns consistent details for a successful payment  
- **Preconditions**:
  - A completed `SUCCESS` transaction exists from previous payment or wallet-transfer tests  
  - Known `transactionReference` = `TXN-SUCCESS-001`  
- **Steps**:
  1. Call `GET /v1/transactions/TXN-SUCCESS-001`.  
  2. Verify HTTP status code and response payload fields:
     - `transactionReference`, `clientReference`, `amount`, `currency`, `status`, `channel`, `createdAt`, `updatedAt`  
  3. Cross-check the amount and currency with original payment request.  
  4. Cross-check the status with merchant ledger or wallet balances if applicable.  
- **Expected Result**:
  - HTTP status: **200**  
  - Response JSON:
    - `transactionReference` = `TXN-SUCCESS-001`
    - `status` = `SUCCESS`
    - `amount`, `currency` and `channel` match original transaction
    - `createdAt` and `updatedAt` consistent with event timeline  
  - No discrepancies between re-query response and original transaction details.

### TR-002 – Re-query by clientReference

- **Test ID**: TR-002  
- **Title**: Re-query by `clientReference` returns correct transaction and supports idempotency checks  
- **Preconditions**:
  - A transaction previously initiated with `clientReference` = `CLREF-12345`  
  - `clientReference` is unique per merchant per day  
- **Steps**:
  1. Call `GET /v1/transactions?clientReference=CLREF-12345`.  
  2. Verify HTTP status code and response body.  
- **Expected Result**:
  - HTTP status: **200**
  - Response JSON:
    - Contains a single transaction (or a documented list structure)  
    - `clientReference` = `CLREF-12345`
    - All transaction details match original payment/transfer
  - No duplicate or mismatched transactions are returned.

### TR-003 – Re-query for pending transaction

- **Test ID**: TR-003  
- **Title**: Re-query behavior for `PENDING` transactions awaiting external callback  
- **Preconditions**:
  - A transaction exists in `PENDING` state due to:
    - Awaiting bank or scheme callback, or  
    - Standing in `PENDING_AUTHENTICATION` state.  
  - Known `transactionReference` = `TXN-PENDING-001`  
- **Steps**:
  1. Call `GET /v1/transactions/TXN-PENDING-001`.  
  2. Verify response status and payload.  
  3. Simulate external callback (webhook or internal job) transitioning transaction to `SUCCESS` or `FAILED`.  
  4. Repeat the re-query.  
- **Expected Result**:
  - Before callback:
    - HTTP status: **200**
    - `status` = `PENDING`
    - Additional fields indicating pending reason or next action  
  - After callback:
    - HTTP status: **200**
    - `status` transitions to `SUCCESS` or `FAILED`
    - `updatedAt` timestamp changes accordingly
    - Audit/history section reflects transition event.

### TR-004 – Re-query for non-existent transaction

- **Test ID**: TR-004  
- **Title**: Re-query returns appropriate error for unknown `transactionReference`  
- **Preconditions**:
  - Use `transactionReference` that does not exist, e.g. `TXN-NOT-FOUND-999`  
- **Steps**:
  1. Call `GET /v1/transactions/TXN-NOT-FOUND-999`.  
  2. Verify HTTP status and error payload.  
- **Expected Result**:
  - HTTP status: **404**
  - Error JSON:
    - `code` = `TRANSACTION_NOT_FOUND`
    - Clear, non-sensitive error message
  - No partial transaction data is leaked.

### TR-005 – Reconciliation after webhook failure

- **Test ID**: TR-005  
- **Title**: Reconciliation API aligns internal status after missed webhook callback  
- **Preconditions**:
  - Payment or wallet transfer sent to external processor with reference `TXN-WEBHOOK-001`  
  - External provider marks transaction as `SUCCESS`  
  - Internal system missed or failed to process webhook; internal transaction remains `PENDING`  
  - `POST /v1/transactions/reconcile` endpoint available and integrated with provider’s re-query API  
- **Steps**:
  1. Confirm current internal status:
     - `GET /v1/transactions/TXN-WEBHOOK-001` returns `status` = `PENDING`.  
  2. Call `POST /v1/transactions/reconcile` with payload:
     - `transactionReference` = `TXN-WEBHOOK-001`  
     - `source` = `PROVIDER_REQUERY`  
  3. Verify reconciliation response.  
  4. Re-query transaction using `GET /v1/transactions/TXN-WEBHOOK-001`.  
- **Expected Result**:
  - Reconciliation call:
    - HTTP status: **202** or **200**
    - Response JSON indicates reconciliation request accepted and outcome (`UPDATED` or `NO_CHANGE`)  
  - Final re-query:
    - `status` updated to `SUCCESS` (aligned with provider)
    - Settlement and ledger records adjusted correctly
    - Audit log includes reconciliation event with operator/service identifier.

### TR-006 – Data integrity across channels (UI vs API)

- **Test ID**: TR-006  
- **Title**: Transaction re-query results match data shown in customer-facing UI  
- **Preconditions**:
  - A wallet transfer completed successfully via web or mobile UI  
  - `transactionReference` available from UI or notification  
- **Steps**:
  1. Log into customer portal UI and navigate to **Transaction History**.  
  2. Locate the relevant transaction and note:
     - `date/time`, `amount`, `currency`, `counterparty`, current `status`.  
  3. Use API: `GET /v1/transactions/{transactionReference}`.  
  4. Compare each field between UI and API response.  
- **Expected Result**:
  - All key fields (`amount`, `currency`, `status`, `counterparty`, timestamps) match between UI and API.  
  - No rounding or formatting issues that could confuse end users (e.g., `10` vs `10.00`).

### TR-007 – Risk-based negative scenarios

- **Test ID**: TR-007  
- **Title**: Re-query responses do not leak sensitive internal or security-related data  
- **Preconditions**:
  - Transactions exist across multiple channels (web, mobile, partner API)  
  - Logging and metadata fields include internal identifiers (e.g., internal account IDs, hostnames).  
- **Steps**:
  1. Re-query a variety of transactions via:
     - `GET /v1/transactions/{transactionReference}`  
     - `GET /v1/transactions?clientReference={clientReference}`  
  2. Inspect entire API response including nested structures and metadata.  
- **Expected Result**:
  - Response does **not** expose:
    - Internal database IDs (`id`, `internalAccountId`, raw UUIDs not meant for customers)
    - Infrastructure details (hostnames, IPs, internal service names)
    - Any sensitive PII or PCI-sensitive data in clear text  
  - Only safe, customer-facing identifiers and descriptors are present (e.g., `maskedCardNumber`, `customerReference`, `publicWalletId`).

