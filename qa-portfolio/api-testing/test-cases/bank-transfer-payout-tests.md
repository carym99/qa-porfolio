## Bank Transfer Payout API – Test Cases

System under test: **Bank Transfer Payout API**  
Base endpoint: `POST /v1/dev/payouts`  
Supporting endpoint (status re-query, referenced where relevant): `POST /v1/dev/payouts/requery`

Common request body:

```json
{
  "walletId": "72930b08-3d51-4129-8999-72f304d8472c",
  "amount": 1000,
  "destinationBankCode": "123456",
  "destinationAccountNumber": "0000000000",
  "remarks": "Test payout",
  "customerTransactionReference": "{{$guid}}"
}
```

Unless otherwise specified, all tests assume:
- Authenticated request with a valid bearer token.  
- Staging environment configured similarly to production rules.  

---

### 01 – Positive – Happy Path

#### BT-001 – Valid payout (full payload)

- **Test ID**: BT-001  
- **Title**: Successful payout with full, valid payload  
- **Preconditions**:
  - `walletId` exists and is `ACTIVE`.  
  - Wallet balance ≥ `amount` (e.g., balance ≥ 1,000).  
  - `destinationBankCode` is a valid 6+ digit bank code known to the system.  
  - `destinationAccountNumber` is a valid 10+ digit account number.  
  - `customerTransactionReference` is unique for this wallet on the test day.  
- **Steps**:
  1. Send `POST /v1/dev/payouts` with all fields populated as in the common request body above.  
  2. Capture HTTP status and response body.  
  3. Verify response JSON structure: `success`, `message`, `data` object with `customerTransactionReference`, `amount`, `status`.  
  4. (Optional) Call `POST /v1/dev/payouts/requery` with the returned `transactionReference` or `customerTransactionReference` once backend settlement job has run.  
- **Expected Result**:
  - HTTP status: **201 Created**.  
  - Response JSON:
    - `success` = `true`.  
    - `message` indicates payout is being processed.  
    - `data.customerTransactionReference` is non-empty and matches the request reference.  
    - `data.amount` = `1000`.  
    - `data.status` initially = `PENDING` (or equivalent).  
  - On later re-query, payout transitions to `SUCCESSFUL` once settlement is complete and wallet is debited correctly.

---

### 02 – Idempotency

#### BT-010 – First request (store key)

- **Test ID**: BT-010  
- **Title**: First payout request with unique `customerTransactionReference`  
- **Preconditions**:
  - Same as BT-001.  
  - Postman or automation can store variables between requests.  
- **Steps**:
  1. Generate a unique `customerTransactionReference` (e.g. Postman `{{$guid}}`).  
  2. Send `POST /v1/dev/payouts` with valid payload and the generated reference.  
  3. In test script, store:
     - `firstRef` = `data.transactionReference` (backend reference if returned).  
     - `firstCustomerRef` = `data.customerTransactionReference`.  
- **Expected Result**:
  - Payout behaves as in BT-001 (201, `success = true`, `status = PENDING`).  
  - `firstCustomerRef` equals the request `customerTransactionReference`.  

#### BT-011 – Second request (same key – idempotent behavior)

- **Test ID**: BT-011  
- **Title**: Second payout request with same `customerTransactionReference` does not create duplicate debit  
- **Preconditions**:
  - BT-010 executed successfully and `firstCustomerRef` stored.  
  - Wallet still has enough balance that a duplicate debit would be visible.  
- **Steps**:
  1. Re-send `POST /v1/dev/payouts` with **identical** body:
     - Same `walletId`, `amount`, `destinationBankCode`, `destinationAccountNumber`, `remarks`, and `customerTransactionReference = firstCustomerRef`.  
  2. Capture HTTP status and response body.  
  3. In test script, compare:
     - `secondRef` = returned `data.transactionReference` (if present)  
     - `secondCustomerRef` = `data.customerTransactionReference`.  
  4. Check ledger/balance via wallet service or transaction listing if available.  
- **Expected Result**:
  - HTTP status: **200** or **201** (per API spec), but:  
    - No **second** payout record is created that debits the wallet again.  
  - Either:
    - Same `transactionReference` is returned as in BT-010, **or**  
    - The API clearly indicates that the request is a duplicate and has no additional effect.  
  - Wallet is debited **once only** for the `amount`.  
  - Automated assertion confirms `secondCustomerRef` equals `firstCustomerRef`, and `secondRef` equals `firstRef` where the design supports that behavior.

---

### 03 – Negative – Validation and Business Rules

#### BT-020 – Empty walletId

- **Test ID**: BT-020  
- **Title**: Payout rejected when `walletId` is missing or empty  
- **Preconditions**:
  - None beyond default authentication.  
- **Steps**:
  1. Send `POST /v1/dev/payouts` with `walletId` set to an empty string (`""`) or omitted.  
  2. Keep all other fields valid.  
- **Expected Result**:
  - HTTP status: **400 Bad Request**.  
  - Response JSON:
    - `statusCode` = `400`.  
    - `message` mentions `walletId` and indicates it is required.  
    - `error` = `Bad Request`.  
  - No payout is created and no balance is debited.

#### BT-021 – Empty destinationBankCode

- **Test ID**: BT-021  
- **Title**: Payout rejected when `destinationBankCode` is empty  
- **Preconditions**:
  - Valid `walletId` and other fields.  
- **Steps**:
  1. Send `POST /v1/dev/payouts` with `destinationBankCode` = `""`.  
  2. Observe response.  
- **Expected Result**:
  - HTTP status: **400**.  
  - `message` indicates `destinationBankCode` is required or invalid.  
  - No payout record is created.

#### BT-022 – Destination bank code too short

- **Test ID**: BT-022  
- **Title**: Payout rejected when `destinationBankCode` is shorter than 6 digits  
- **Preconditions**:
  - Default valid payload except for bank code.  
- **Steps**:
  1. Send `POST /v1/dev/payouts` with `destinationBankCode` = `"12345"` (5 digits).  
  2. Observe response.  
- **Expected Result**:
  - HTTP status: **400**.  
  - `message` includes text like `destinationBankCode must be at least 6 digits`.  
  - No payout is created.

#### BT-023 – Destination account number too short

- **Test ID**: BT-023  
- **Title**: Payout rejected when `destinationAccountNumber` is shorter than 10 digits  
- **Preconditions**:
  - Default valid payload except for account number.  
- **Steps**:
  1. Send `POST /v1/dev/payouts` with `destinationAccountNumber` = `"123456789"` (9 digits).  
  2. Observe response.  
- **Expected Result**:
  - HTTP status: **400**.  
  - `message` includes text like `destinationAccountNumber must be at least 10 digits`.  
  - No payout is created.

#### BT-024 – Negative amount

- **Test ID**: BT-024  
- **Title**: Payout rejected when `amount` is negative  
- **Preconditions**:
  - Default valid payload except for amount.  
- **Steps**:
  1. Send `POST /v1/dev/payouts` with `amount` = `-1`.  
  2. Observe response.  
- **Expected Result**:
  - HTTP status: **400**.  
  - `message` includes text like `amount must be a positive number`.  
  - No payout record or debit is applied.

#### BT-025 – Amount below minimum (100)

- **Test ID**: BT-025  
- **Title**: Payout rejected when amount is below configured minimum  
- **Preconditions**:
  - API configured with minimum payout amount of `100`.  
- **Steps**:
  1. Send `POST /v1/dev/payouts` with `amount` = `50`.  
  2. Observe response.  
- **Expected Result**:
  - HTTP status: **400**.  
  - `message` mentions that amount must be greater than or equal to `100` (wording per implementation).  
  - No payout is created.

#### BT-026 – Amount above maximum (1,000,000)

- **Test ID**: BT-026  
- **Title**: Payout rejected when amount exceeds configured maximum  
- **Preconditions**:
  - API configured with maximum payout amount of `1,000,000`.  
- **Steps**:
  1. Send `POST /v1/dev/payouts` with `amount` = `1_000_001`.  
  2. Observe response.  
- **Expected Result**:
  - HTTP status: **400**.  
  - `message` mentions that amount must be less than or equal to `1,000,000`.  
  - No payout is created.

#### BT-027 – Multiple validation errors in one request

- **Test ID**: BT-027  
- **Title**: API returns combined validation messages when multiple fields are invalid  
- **Preconditions**:
  - None beyond default.  
- **Steps**:
  1. Send `POST /v1/dev/payouts` with:
     - `walletId` empty  
     - `destinationBankCode` too short  
     - `amount` below minimum  
  2. Observe response body.  
- **Expected Result**:
  - HTTP status: **400**.  
  - `message` includes references to all invalid fields (e.g., walletId required, destinationBankCode length, amount minimum).  
  - No payout is created.

---

### 04 – Boundary Conditions

#### BT-030 – Minimum valid amount (100)

- **Test ID**: BT-030  
- **Title**: Payout succeeds with amount equal to minimum allowed  
- **Preconditions**:
  - Minimum amount configured as `100`.  
  - Wallet balance ≥ `100`.  
- **Steps**:
  1. Send `POST /v1/dev/payouts` with `amount` = `100` and all other fields valid.  
- **Expected Result**:
  - HTTP status: **201**.  
  - Payout accepted and processed as a normal valid transaction.

#### BT-031 – Maximum valid amount (1,000,000)

- **Test ID**: BT-031  
- **Title**: Payout succeeds with amount equal to maximum allowed  
- **Preconditions**:
  - Maximum amount configured as `1,000,000`.  
  - Wallet balance ≥ `1,000,000`.  
- **Steps**:
  1. Send `POST /v1/dev/payouts` with `amount` = `1_000_000` and all other fields valid.  
- **Expected Result**:
  - HTTP status: **201**.  
  - Payout accepted and processed as a normal valid transaction.

#### BT-032 – Bank code and account number at exact length limits

- **Test ID**: BT-032  
- **Title**: Payout succeeds when `destinationBankCode` and `destinationAccountNumber` are at minimum valid lengths  
- **Preconditions**:
  - Configured rules:
    - `destinationBankCode` min length = 6 digits.  
    - `destinationAccountNumber` min length = 10 digits.  
- **Steps**:
  1. Send `POST /v1/dev/payouts` with:
     - `destinationBankCode` = `123456` (6 digits)  
     - `destinationAccountNumber` = `1234567890` (10 digits)  
  2. Keep other fields valid.  
- **Expected Result**:
  - HTTP status: **201**.  
  - Payout behaves as a valid request.

---

### 05 – Security-Focused Negative Scenarios

#### BT-040 – XSS attempt in remarks

- **Test ID**: BT-040  
- **Title**: Payout request escapes or rejects script tags in `remarks`  
- **Preconditions**:
  - Default valid payload.  
- **Steps**:
  1. Send `POST /v1/dev/payouts` with `remarks` = `"<script>alert('xss')</script>"`.  
  2. Observe API response and any logs/monitoring available.  
- **Expected Result**:
  - Either:
    - Request is rejected with a clear validation error, **or**  
    - Request is accepted but remarks are safely stored/escaped (no script execution in any UI).  
  - Response does **not** reflect raw script tags back to the caller.  

#### BT-041 – SQL injection pattern in account number

- **Test ID**: BT-041  
- **Title**: Payout request with SQL injection-like account number is rejected as invalid input  
- **Preconditions**:
  - Default valid payload.  
- **Steps**:
  1. Send `POST /v1/dev/payouts` with `destinationAccountNumber` = `"1234567890' OR '1'='1"`.  
  2. Observe API response.  
- **Expected Result**:
  - HTTP status: **400** (invalid format).  
  - `message` indicates account number format is invalid, not a SQL/server error.  
  - No stack traces, SQL error codes, or internal details are leaked in the response.

---

### 06 – Performance / Resilience (High-Level)

#### BT-050 – Throughput under load

- **Test ID**: BT-050  
- **Title**: Payout API maintains acceptable latency under expected peak load  
- **Preconditions**:
  - Dedicated performance environment.  
  - Load test tool configured to simulate concurrent payout requests (e.g., 100–500 RPS).  
- **Steps**:
  1. Execute a load test sending valid payout requests with unique `customerTransactionReference` values.  
  2. Collect metrics for latency, error rate, and saturation of dependent services.  
- **Expected Result**:
  - P95 and P99 latency remain within agreed SLOs.  
  - Error rate stays within acceptable bounds (no widespread 5xx).  
  - No data inconsistencies (duplicate or missing debits) observed in post-test reconciliation.

