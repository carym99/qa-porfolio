## Payment Validation API Test Cases

System under test: **Payments Service – Card/Bank Payment APIs**  
Key endpoints:
- `POST /v1/payments/authorize`
- `POST /v1/payments/capture`
- `POST /v1/payments/refund`

### PV-001 – Successful card payment authorization

- **Test ID**: PV-001  
- **Title**: Authorize payment successfully with valid card details  
- **Preconditions**:
  - Test card number: `4111111111111111` (Visa test card)  
  - Card is associated with a customer under KYC-verified profile  
  - Merchant is active and allowed to process card payments  
  - Payment gateway test environment available and reachable  
- **Steps**:
  1. Send `POST /v1/payments/authorize` with payload:
     - `amount` = 75.00
     - `currency` = `USD`
     - `merchantId` = `MRC-10001`
     - `orderReference` = `ORD-{{timestamp}}`
     - Card details (tokenized or PCI-safe representation)
  2. Verify HTTP status code.  
  3. Verify response body for:
     - `status`
     - `paymentReference`
     - `authorizationCode`
     - `amount`, `currency`
  4. Query `GET /v1/payments/{paymentReference}` to validate persisted state.  
- **Expected Result**:
  - HTTP status: **201** (Created)  
  - Response JSON:
    - `status` = `AUTHORIZED`
    - `paymentReference` is unique and non-empty
    - `authorizationCode` populated
    - `amount` = 75.00
    - `currency` = `USD`
  - Re-query shows payment in `AUTHORIZED` status with correct merchant and customer details.

### PV-002 – Declined authorization due to invalid CVV

- **Test ID**: PV-002  
- **Title**: Authorization is declined when invalid CVV is provided  
- **Preconditions**:
  - Valid card number and expiry date  
  - CVV value intentionally incorrect per gateway test data sheet  
  - Merchant configured to receive detailed decline codes from acquirer  
- **Steps**:
  1. Send `POST /v1/payments/authorize` with:
     - Valid card number and expiry
     - `cvv` = invalid value (e.g. `999`)
     - `amount` = 50.00
     - `currency` = `USD`
  2. Verify HTTP status and response error fields.  
- **Expected Result**:
  - HTTP status: **402** or **200** with `status` = `DECLINED` (per API contract)  
  - Response JSON:
    - `status` = `DECLINED`
    - `declineReason` = `INVALID_CVV` (or mapped equivalent)
    - No `authorizationCode` issued
  - No capture should be allowed for this `paymentReference`.

### PV-003 – 3DS / OTP flow validation

- **Test ID**: PV-003  
- **Title**: Payment requires additional authentication (3DS / OTP) and completes successfully  
- **Preconditions**:
  - Card enrolled for step-up authentication (3DS / OTP)  
  - ACS (Access Control Server) simulator available in test environment  
  - Redirect/OTP callback URLs configured for the merchant  
- **Steps**:
  1. Initiate `POST /v1/payments/authorize` with a 3DS-enrolled card.  
  2. Verify response indicating `status` = `PENDING_AUTHENTICATION` and containing `redirectUrl` or `otpSessionId`.  
  3. Simulate customer completing authentication via:
     - Following `redirectUrl` and submitting correct OTP, or  
     - Calling `POST /v1/payments/3ds-callback` with `authenticationStatus = SUCCESS`.  
  4. Re-query payment using `GET /v1/payments/{paymentReference}`.  
- **Expected Result**:
  - Initial response:
    - HTTP status: **202**
    - `status` = `PENDING_AUTHENTICATION`
    - `paymentReference` generated
    - `redirectUrl` / `otpSessionId` provided  
  - After successful authentication:
    - Payment status transitions to `AUTHORIZED`
    - Audit trail contains an authentication event with correct device and IP metadata.

### PV-004 – Capture full amount after authorization

- **Test ID**: PV-004  
- **Title**: Successfully capture full authorized amount  
- **Preconditions**:
  - A prior successfully `AUTHORIZED` payment from PV-001 or PV-003  
  - Payment not yet captured or voided  
- **Steps**:
  1. Call `POST /v1/payments/capture` with:
     - `paymentReference` from the authorized payment
     - `amount` = authorized amount
  2. Verify HTTP status and response body.  
  3. Re-query payment status using `GET /v1/payments/{paymentReference}`.  
- **Expected Result**:
  - Response HTTP status: **200**
  - Response JSON:
    - `status` = `CAPTURED`
    - `capturedAmount` = authorized amount  
  - Re-query shows:
    - Status = `CAPTURED`
    - Settlement details populated (settlement date, acquirer reference).

### PV-005 – Partial capture

- **Test ID**: PV-005  
- **Title**: Partial capture of authorized amount, with remaining amount available for later capture or release  
- **Preconditions**:
  - `AUTHORIZED` payment with `amount` = 100.00 USD  
  - Partial capture is supported in configuration  
- **Steps**:
  1. Call `POST /v1/payments/capture` with:
     - `paymentReference` = authorized payment
     - `amount` = 60.00
  2. Verify HTTP status and response JSON.  
  3. Re-query payment details.  
- **Expected Result**:
  - Response HTTP status: **200**
  - Response JSON:
    - `status` = `PARTIALLY_CAPTURED`
    - `capturedAmount` = 60.00
    - `remainingAuthorizedAmount` = 40.00  
  - Re-query shows:
    - Status = `PARTIALLY_CAPTURED`
    - Subsequent capture or void actions are allowed based on remaining amount.

### PV-006 – Capture without valid authorization

- **Test ID**: PV-006  
- **Title**: Capture fails when authorization is missing, expired, or already captured  
- **Preconditions**:
  - One of the following conditions:
    - Authorization expired (beyond configured validity period), or  
    - Payment already captured, or  
    - `paymentReference` does not exist.  
- **Steps**:
  1. Call `POST /v1/payments/capture` with:
     - `paymentReference` referencing an invalid/expired/fully captured payment
     - `amount` = any positive value
  2. Verify HTTP status and error response.  
- **Expected Result**:
  - Response HTTP status: **400**, **404**, or **409** depending on failure type  
  - Error JSON includes descriptive code such as:
    - `AUTHORIZATION_EXPIRED`
    - `PAYMENT_NOT_FOUND`
    - `ALREADY_CAPTURED`
  - No double capture is possible; system prevents over-settlement.

### PV-007 – Refund captured payment

- **Test ID**: PV-007  
- **Title**: Full refund of a captured payment  
- **Preconditions**:
  - `CAPTURED` payment with `amount` = 50.00  
  - Refunds are enabled for the merchant  
  - Original settlement successfully completed  
- **Steps**:
  1. Call `POST /v1/payments/refund` with:
     - `paymentReference` of captured payment
     - `amount` = 50.00
     - `reason` = `CUSTOMER_REQUEST`
  2. Verify HTTP status and response JSON.  
  3. Re-query payment and refund details.  
- **Expected Result**:
  - Response HTTP status: **202** or **200**
  - Response JSON:
    - `refundReference` generated
    - `refundStatus` = `PENDING` or `COMPLETED` (depending on integration timing)  
  - Final state (after settlement):
    - Payment shows `status` = `REFUNDED`
    - Refund record is visible in `GET /v1/refunds/{refundReference}` with correct amount and timestamps.

### PV-008 – Validation of required fields and schema

- **Test ID**: PV-008  
- **Title**: API returns validation errors for missing mandatory fields  
- **Preconditions**:
  - API schema for `POST /v1/payments/authorize` defines mandatory fields:
    - `amount`, `currency`, `merchantId`, `paymentMethod` (or token), etc.  
- **Steps**:
  1. Send `POST /v1/payments/authorize` with a payload missing one or more mandatory fields (e.g., omit `amount` and `currency`).  
  2. Verify HTTP status and response body.  
- **Expected Result**:
  - Response HTTP status: **400**  
  - Error JSON:
    - `code` = `VALIDATION_ERROR`
    - `errors` array listing `amount` and `currency` as missing/invalid fields
  - No payment record is created.

