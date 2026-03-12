## Mobile Payment Flow Test Cases (Appium)

Application under test: **SamplePay Wallet – Mobile App**  
Scope: Payment initiation and confirmation from mobile app

### MP-001 – Successful payment from wallet balance

- **Test ID**: MP-001  
- **Title**: User completes payment using sufficient wallet balance  
- **Preconditions**:
  - Wallet `WALLET-3001` linked to test user.  
  - Wallet balance ≥ `100.00` in `USD`.  
  - Merchant `MRC-10001` active and available in merchant directory.  
- **Steps**:
  1. Log in to the app (reuse ML-001).  
  2. From the dashboard, tap **Pay Merchant**.  
  3. Select merchant `Sample Coffee Shop (MRC-10001)`.  
  4. Enter amount `15.00` and confirm currency `USD`.  
  5. Confirm payment on the review screen.  
  6. Observe success confirmation and updated balance on dashboard.  
- **Expected Result**:
  - Payment succeeds and shows `Payment successful` banner with unique reference.  
  - Wallet balance decreases by `15.00 USD`.  
  - Transaction appears in mobile transaction history with correct status and amount.

### MP-002 – Payment blocked due to insufficient balance

- **Test ID**: MP-002  
- **Title**: Payment attempt fails when wallet balance is insufficient  
- **Preconditions**:
  - Wallet `WALLET-3002` has balance `< 5.00 USD`.  
  - Attempted payment amount: `20.00 USD`.  
- **Steps**:
  1. Log in as user tied to `WALLET-3002`.  
  2. Navigate to **Pay Merchant** screen.  
  3. Select a merchant and enter amount `20.00`.  
  4. Tap **Confirm**.  
- **Expected Result**:
  - Payment is rejected before, or at, server validation.  
  - User sees clear error message and remains on payment screen.  
  - Wallet balance is unchanged.  
  - No successful transaction appears in history.

### MP-003 – Payment with wrong CVV on saved card

- **Test ID**: MP-003  
- **Title**: Payment via saved card fails with invalid CVV  
- **Preconditions**:
  - User has a saved Visa test card.  
  - Gateway sandbox configured for CVV-based decline.  
- **Steps**:
  1. Log in and navigate to **Pay Merchant**.  
  2. Select **Pay with saved card**.  
  3. Choose the saved Visa card.  
  4. Enter amount `25.00`.  
  5. When prompted for CVV, enter incorrect value (per gateway doc).  
  6. Confirm payment.  
- **Expected Result**:
  - Payment is declined.  
  - Error message is shown (e.g., “Payment declined by bank”).  
  - No wallet or card balance changes are applied.  
  - Transaction history either shows a failed transaction record or none, as per design, but must never show as `SUCCESS`.

### MP-004 – Payment with OTP / 3DS challenge

- **Test ID**: MP-004  
- **Title**: User completes card payment that requires OTP challenge  
- **Preconditions**:
  - Test card enrolled for 3DS/OTP.  
  - OTP test channel available (SMS/email simulator).  
- **Steps**:
  1. Start payment flow using 3DS-enrolled card.  
  2. When redirected to OTP screen within the app or webview, enter valid OTP.  
  3. Complete challenge and return to app.  
  4. Confirm payment success.  
- **Expected Result**:
  - User sees `Payment successful` screen.  
  - Payment status in backend is `SUCCESS` and type `CARD_3DS`.  
  - Transaction appears in history with correct indicator for 3DS/OTP.

