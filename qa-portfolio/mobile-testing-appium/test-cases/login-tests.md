## Mobile App Login Test Cases (Appium)

Application under test: **SamplePay Wallet – Android/iOS Mobile App**  
Primary screen: Login screen (email/phone + password/OTP)

### ML-001 – Successful login with email and password

- **Test ID**: ML-001  
- **Title**: User can log in with valid email and password  
- **Preconditions**:
  - Test user account exists:
    - Email: `customer.qa+login@samplepay.com`
    - Password: `Password123!`
    - Status: `ACTIVE`, KYC verified  
  - App installed on device/emulator with clean state (no existing session).  
- **Steps**:
  1. Launch the SamplePay app.  
  2. On the login screen, enter:
     - Email: `customer.qa+login@samplepay.com`
     - Password: `Password123!`  
  3. Tap the **Login** button.  
  4. Wait for navigation to the **Wallet Dashboard**.  
  5. Verify the presence of:
     - User’s display name  
     - Current wallet balance  
     - Recent transactions list or placeholder text.  
- **Expected Result**:
  - User is authenticated and navigated to the dashboard within acceptable time (≤ 3 seconds on staging).  
  - No error messages displayed.  
  - Session token is persisted securely (verified through subsequent launches without re-login, if product behavior allows).

### ML-002 – Invalid password

- **Test ID**: ML-002  
- **Title**: Login fails with invalid password and shows generic error  
- **Preconditions**:
  - Same as ML-001, but use incorrect password.  
- **Steps**:
  1. Launch the app and navigate to login screen.  
  2. Enter:
     - Email: `customer.qa+login@samplepay.com`
     - Password: `WrongPassword!`  
  3. Tap **Login**.  
- **Expected Result**:
  - Login request is rejected.  
  - User remains on login screen.  
  - Error message is shown:
    - Generic and secure (e.g., “Invalid email or password”)  
    - Does **not** indicate whether email or password is incorrect individually.  
  - No session token is stored.

### ML-003 – Account locked after multiple failed attempts

- **Test ID**: ML-003  
- **Title**: Account is locked after configured number of failed login attempts  
- **Preconditions**:
  - Lockout policy configured (e.g., 5 consecutive failed attempts within 15 minutes).  
  - Test account initially unlocked.  
- **Steps**:
  1. Attempt login with valid email and invalid password **5 times** in a row.  
  2. On the 6th attempt, try logging in with the **correct** password.  
- **Expected Result**:
  - After 5 failed attempts:
    - Account is locked; subsequent attempts are rejected.  
  - On the 6th attempt with correct credentials:
    - Login still fails.  
    - Error message indicates account lockout and next steps (e.g., “Your account is locked. Please reset your password or contact support.”).  
  - Lockout event recorded in audit logs.

### ML-004 – Login with 2FA (OTP)

- **Test ID**: ML-004  
- **Title**: User completes login with mandatory OTP verification  
- **Preconditions**:
  - Test user configured with mandatory OTP on login.  
  - Access to OTP channel (SMS or email test inbox).  
- **Steps**:
  1. Enter valid email and password.  
  2. Tap **Login**.  
  3. Verify that OTP screen is displayed.  
  4. Retrieve valid OTP from test SMS/email channel.  
  5. Enter OTP and confirm.  
- **Expected Result**:
  - User is navigated to the wallet dashboard.  
  - If wrong OTP is entered:
    - Appropriate error is shown.
    - Remaining attempts (if configured) are decreased.  

### ML-005 – Session expiry and re-login

- **Test ID**: ML-005  
- **Title**: User is logged out after session expiry and required to log in again  
- **Preconditions**:
  - User logged in successfully.  
  - Session TTL configured (e.g., 30 minutes of inactivity).  
- **Steps**:
  1. Log in as in ML-001.  
  2. Leave the app inactive in the foreground or background for longer than the configured TTL.  
  3. Attempt to perform a sensitive action (e.g., open wallet details, initiate payment).  
- **Expected Result**:
  - User is redirected to login screen.  
  - New login is required before performing sensitive operations.  
  - No silent failures or inconsistent states when token has expired.

