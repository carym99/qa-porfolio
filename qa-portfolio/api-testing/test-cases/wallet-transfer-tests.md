## Wallet Transfer API Test Cases

System under test: **Digital Wallet Service – Wallet-to-Wallet Transfer API**  
Base endpoint: `POST /v1/wallets/transfer`

Common request body:

```json
{
  "sourceWalletId": "WALLET-12345",
  "destinationWalletId": "WALLET-67890",
  "amount": 50.00,
  "currency": "USD",
  "clientReference": "WTX-{{timestamp}}-{{random}}",
  "description": "P2P transfer"
}
```

### WT-001 – Successful wallet-to-wallet transfer (same currency)

- **Test ID**: WT-001  
- **Title**: Successful transfer between two active wallets with sufficient balance  
- **Preconditions**:
  - `sourceWalletId` = `WALLET-1001` exists and is `ACTIVE`
  - `destinationWalletId` = `WALLET-2001` exists and is `ACTIVE`
  - Source wallet balance ≥ 100.00 USD  
  - Destination wallet balance known (capture before test)  
  - No pending disputes or holds on either wallet  
- **Steps**:
  1. Send `POST /v1/wallets/transfer` with:
     - `sourceWalletId` = `WALLET-1001`
     - `destinationWalletId` = `WALLET-2001`
     - `amount` = 25.00
     - `currency` = `USD`
     - Unique `clientReference`
  2. Verify HTTP status code.  
  3. Verify response body fields: `status`, `transactionReference`, `sourceBalance`, `destinationBalance`, `createdAt`.  
  4. Query source wallet balance via `GET /v1/wallets/WALLET-1001`.  
  5. Query destination wallet balance via `GET /v1/wallets/WALLET-2001`.  
  6. Query transaction details via `GET /v1/transactions/{transactionReference}`.  
- **Expected Result**:
  - Response HTTP status: **200**  
  - Response JSON:
    - `status` = `SUCCESS`
    - `transactionReference` is non-empty, unique, and matches later re-query
    - `sourceBalance` = previous source balance − 25.00
    - `destinationBalance` = previous destination balance + 25.00
  - Transaction details:
    - `type` = `WALLET_TRANSFER`
    - `direction` = `DEBIT` for source, `CREDIT` for destination
    - `currency` = `USD`
    - `amount` = 25.00
    - `status` = `SUCCESS`

### WT-002 – Insufficient balance

- **Test ID**: WT-002  
- **Title**: Transfer fails when source wallet balance is insufficient  
- **Preconditions**:
  - `sourceWalletId` = `WALLET-1002` exists and is `ACTIVE`
  - Source wallet balance = 10.00 USD  
  - `destinationWalletId` = `WALLET-2002` exists and is `ACTIVE`
  - System-level overdraft is **disabled** for wallet transfers  
- **Steps**:
  1. Send `POST /v1/wallets/transfer` with:
     - `sourceWalletId` = `WALLET-1002`
     - `destinationWalletId` = `WALLET-2002`
     - `amount` = 50.00
     - `currency` = `USD`
     - Unique `clientReference`
  2. Verify HTTP status code and error response payload.  
  3. Re-check balances for `WALLET-1002` and `WALLET-2002`.  
- **Expected Result**:
  - Response HTTP status: **400** or **422** (per API spec)  
  - Error JSON:
    - `code` = `INSUFFICIENT_FUNDS`
    - `message` describes that the source wallet has insufficient balance
    - No `transactionReference` is issued
  - Wallet balances remain **unchanged** (no debit or credit applied).

### WT-003 – Transfer to blocked destination wallet

- **Test ID**: WT-003  
- **Title**: Transfer is rejected when destination wallet is blocked  
- **Preconditions**:
  - `sourceWalletId` = `WALLET-3001` is `ACTIVE` with balance ≥ 100.00 USD  
  - `destinationWalletId` = `WALLET-3002` exists and status = `BLOCKED`  
  - Compliance rules disallow crediting a blocked wallet  
- **Steps**:
  1. Send `POST /v1/wallets/transfer` with:
     - `sourceWalletId` = `WALLET-3001`
     - `destinationWalletId` = `WALLET-3002`
     - `amount` = 20.00
     - `currency` = `USD`
     - Unique `clientReference`
  2. Verify HTTP status code and error code.  
  3. Verify no movement in either wallet’s balance.  
- **Expected Result**:
  - Response HTTP status: **409** or **422** (per API spec)  
  - Error JSON:
    - `code` = `DESTINATION_WALLET_BLOCKED`
    - `message` explains that destination wallet cannot receive funds
  - No debit from the source wallet and no credit to the destination wallet.

### WT-004 – Currency mismatch

- **Test ID**: WT-004  
- **Title**: Transfer fails when wallets have incompatible currencies and FX is disabled  
- **Preconditions**:
  - `sourceWalletId` = `WALLET-4001` (currency = `USD`, balance ≥ 100.00)  
  - `destinationWalletId` = `WALLET-4002` (currency = `EUR`)  
  - Cross-currency wallet transfers are **not** enabled in configuration  
- **Steps**:
  1. Send `POST /v1/wallets/transfer` with:
     - `sourceWalletId` = `WALLET-4001`
     - `destinationWalletId` = `WALLET-4002`
     - `amount` = 10.00
     - `currency` = `USD`
     - Unique `clientReference`
  2. Verify HTTP status code and error payload.  
  3. Verify balances remain unchanged.  
- **Expected Result**:
  - Response HTTP status: **400** or **422**  
  - Error JSON:
    - `code` = `CURRENCY_MISMATCH`
    - `message` explains that cross-currency wallet transfers are not allowed
  - No debit or credit applied.

### WT-005 – Idempotent request using clientReference

- **Test ID**: WT-005  
- **Title**: Repeated transfer request with same `clientReference` is idempotent  
- **Preconditions**:
  - `sourceWalletId` = `WALLET-5001` `ACTIVE` with balance ≥ 100.00  
  - `destinationWalletId` = `WALLET-5002` `ACTIVE`  
  - API supports idempotency by `clientReference` within a 24-hour window  
- **Steps**:
  1. Generate a unique `clientReference` (e.g. `IDEMP-{{timestamp}}`).  
  2. Send first `POST /v1/wallets/transfer`:
     - `amount` = 15.00
     - `currency` = `USD`
     - `clientReference` = generated value
  3. Capture response `transactionReference` and resulting balances.  
  4. Immediately repeat the same request with **identical** body (same `clientReference`).  
  5. Compare both responses and wallet balances.  
- **Expected Result**:
  - First request:
    - HTTP status: **200**
    - `status` = `SUCCESS`
    - `transactionReference` generated
    - Balances updated correctly (−15.00 / +15.00).  
  - Second request:
    - HTTP status: **200**
    - `status` = `SUCCESS`
    - `transactionReference` is **identical** to the first response
    - Wallet balances are **not** further modified (no double debit/credit).

### WT-006 – Transfer with maximum daily limit reached

- **Test ID**: WT-006  
- **Title**: Transfer rejected when user has reached daily transfer limit  
- **Preconditions**:
  - `sourceWalletId` = `WALLET-6001` with daily transfer limit = 1,000.00 USD  
  - Previous successful transfers today total = 1,000.00 USD  
  - `destinationWalletId` = `WALLET-6002` is `ACTIVE`  
- **Steps**:
  1. Send `POST /v1/wallets/transfer` with:
     - `sourceWalletId` = `WALLET-6001`
     - `destinationWalletId` = `WALLET-6002`
     - `amount` = 10.00
     - `currency` = `USD`
     - Unique `clientReference`
  2. Verify HTTP status and error details.  
  3. Verify balances remain unchanged.  
- **Expected Result**:
  - Response HTTP status: **403** or **422**  
  - Error JSON:
    - `code` = `DAILY_LIMIT_EXCEEDED`
    - `message` clearly indicates the daily transfer limit has been reached
  - No transaction is created, and no wallet balances change.

### WT-007 – Audit and transaction history verification

- **Test ID**: WT-007  
- **Title**: Transfer is correctly reflected in transaction history and audit trail  
- **Preconditions**:
  - Successful transfer scenario (repeat WT-001 flow)  
  - `GET /v1/transactions?walletId={id}` and audit endpoints are available  
- **Steps**:
  1. Execute a successful transfer as per WT-001.  
  2. Call `GET /v1/transactions?walletId=WALLET-1001` and ensure the new transfer is present.  
  3. Call `GET /v1/transactions?walletId=WALLET-2001` and ensure the matching credit transaction is present.  
  4. Call `GET /v1/audit/events?entityType=WALLET_TRANSFER&entityId={transactionReference}`.  
  5. Inspect audit entries for who initiated the transfer, timestamp, IP/device metadata, and status transitions.  
- **Expected Result**:
  - Transaction history for both wallets includes the transfer with:
    - Correct `transactionReference`
    - Correct `amount`, `currency`, and `status`
    - Timestamps consistent with the initial call  
  - Audit trail shows:
    - `INITIATED`, `VALIDATED`, and `COMPLETED` (or equivalent) events
    - Actor (userId / serviceId), channel, and location metadata populated per compliance requirements.

