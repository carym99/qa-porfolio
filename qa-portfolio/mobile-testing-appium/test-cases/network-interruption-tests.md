## Mobile Network Interruption Test Cases (Appium)

Application under test: **SamplePay Wallet – Mobile App**  
Scope: Behavior under unstable or lost network during critical operations

### MN-001 – Network lost before payment submission

- **Test ID**: MN-001  
- **Title**: App handles network loss before submitting payment request  
- **Preconditions**:
  - User is logged in and on **Pay Merchant** screen with form filled.  
  - Device has an initial stable data connection.  
- **Steps**:
  1. On the payment review screen, disable network connectivity (airplane mode or test network toggle).  
  2. Tap **Confirm** to attempt payment.  
- **Expected Result**:
  - App detects lack of connectivity and:
    - Shows a clear “No internet connection” message.  
    - Does **not** send any request to backend.  
  - User remains on the review screen with data preserved, so they can retry later.  

### MN-002 – Network lost immediately after submission (idempotent retry)

- **Test ID**: MN-002  
- **Title**: App safely retries payment when network fails immediately after request is sent  
- **Preconditions**:
  - Wallet has balance to support the intended payment.  
  - Payment APIs support idempotency via `clientReference`.  
- **Steps**:
  1. Start a payment flow and reach the review screen.  
  2. Ensure network is ON.  
  3. Tap **Confirm** and at the same time, disable network (simulate drop).  
  4. App receives a timeout or network error.  
  5. Re-enable network.  
  6. Use the app’s “Retry” or “Check status” action, ensuring the same `clientReference` is used.  
- **Expected Result**:
  - Backend either processes the original request or the retry, but **never** double-charges.  
  - Wallet balance reflects a single successful payment or no change in case of failure.  
  - Transaction history shows at most one successful payment for the same `clientReference`.  

### MN-003 – Network lost during wallet transfer

- **Test ID**: MN-003  
- **Title**: Wallet transfer handles intermittent network and remains consistent  
- **Preconditions**:
  - Wallet `WALLET-5001` has sufficient balance.  
  - Wallet `WALLET-5002` is active.  
- **Steps**:
  1. Initiate a wallet transfer from `WALLET-5001` to `WALLET-5002`.  
  2. During submission or immediately after, interrupt network connectivity.  
  3. Observe app state and any error messages.  
  4. After restoring network, open **Transaction History** and check the transfer.  
- **Expected Result**:
  - No inconsistent intermediate UI states (e.g., both “failed” and “successful” messages).  
  - Wallet balances reflect a consistent state:
    - Either transfer applied once, or not applied at all.  
  - If transfer succeeded, it appears exactly once in history; if it failed, no duplicate attempts appear without user confirmation.

