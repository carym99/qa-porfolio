## Security and Privacy Checklist – Fintech QA

This checklist is used during API and UI verification to ensure key security and privacy controls are in place.

### 1. Authentication and Authorization

- [ ] All sensitive APIs (wallet, payouts, payments, virtual cards) require strong authentication (Bearer/JWT or MTLS).  
- [ ] Tokens are **scoped** (no over-privileged tokens).  
- [ ] Access to admin/ops APIs is clearly separated from customer-facing APIs.  
- [ ] Authorization checks enforced on:
  - [ ] Wallet ownership (no cross-wallet access).  
  - [ ] Merchant-specific resources.  
  - [ ] Virtual card operations.  

### 2. Data Exposure in APIs

- [ ] Public APIs do **not** expose internal identifiers:
  - [ ] No `internalAccountId`, raw DB `id`, or core banking IDs in customer responses.  
  - [ ] Only safe, external references such as `transactionReference`, `publicWalletId`.  
- [ ] Sensitive fields:
  - [ ] Card numbers are masked or tokenized (no PAN/CVV in logs or normal responses).  
  - [ ] PII fields are minimized and only returned where strictly required.  
- [ ] Error responses:
  - [ ] Contain generic messages (no stack traces, SQL errors, or hostnames).  
  - [ ] Map internal errors to safe error codes/messages.  

See `bug-reports/internal-id-exposure.md` for a realistic example of a failure in this area.

### 3. Input Validation and Injection Protection

- [ ] All input fields are server-side validated (length, format, allowed characters).  
- [ ] Special cases:
  - [ ] `remarks` / free-text fields validated and safely escaped in UIs (XSS prevention).  
  - [ ] Numeric fields (`amount`, `limits`) blocked from containing non-numeric or injection payloads.  
  - [ ] Account/bank codes validated for length and numeric content.  
- [ ] Negative tests executed:
  - [ ] XSS payloads in `remarks` or similar fields.  
  - [ ] SQL injection patterns in `destinationAccountNumber` and IDs.  

Relevant tests: BT-040 and BT-041 in `bank-transfer-payout-tests.md`.

### 4. Transport and Storage

- [ ] All traffic uses HTTPS/TLS; HTTP endpoints redirect or are disabled.  
- [ ] Secrets (API keys, DB credentials) are never committed to the repo; stored in secure vaults.  
- [ ] Sensitive data at rest is encrypted as required by policy.  

### 5. Logging and Monitoring

- [ ] Logs **never** contain full card data, CVV, passwords, or security answers.  
- [ ] Transaction logs:
  - [ ] Contain enough metadata for audit (who, what, when, where).  
  - [ ] Do not include PII that is not needed for incident investigation.  
- [ ] Security events (failed logins, lockouts, suspicious volume of payouts) are monitored and alerted.  

### 6. Rate Limiting and Abuse Protection

- [ ] Rate limiting is enforced on:
  - [ ] Login and OTP endpoints.  
  - [ ] Payout, wallet transfer, and payment APIs.  
  - [ ] Transaction listing endpoints.  
- [ ] Excessive failures (invalid CVV, invalid OTP) trigger throttling or additional verification.  

### 7. Session Management (Web & Mobile)

- [ ] Session tokens expire after reasonable inactivity and absolute lifetime.  
- [ ] Logout invalidates tokens on server side (where applicable).  
- [ ] Sensitive operations (new device, high-value payouts) require step-up authentication.  

### 8. Evidence

For this checklist, include screenshots such as:
- `screenshots/postman-payout-negative-validation.png` – examples of safe error responses.  
- `screenshots/bug-internal-id-exposure.png` – redacted evidence of a security defect before fix.  

