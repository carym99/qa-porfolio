## Bug Report – Duplicate Wallet Credit Due to Retry Logic

- **Title**: Duplicate customer credit when retrying failed wallet funding call  
- **Environment**:
  - Environment: `staging-eu-central`  
  - Wallet Service: `v3.5.0`  
  - Public API Gateway: `edge-gw v1.15.0`  
  - Webhook Consumer: `wallet-webhook-consumer v1.8.1`  
  - Date/Time Observed: 2026-03-09 09:40–10:05 UTC  

### Steps to Reproduce

1. Using the public API, initiate a wallet top-up:
   - Endpoint: `POST /v1/wallets/topup`
   - Request body:
     - `walletId` = `WALLET-777001`
     - `amount` = `100.00`
     - `currency` = `EUR`
     - `clientReference` = `TOPUP-RETRY-20260309-001`  
2. During the request, simulate a transient network error between the client and API gateway:
   - Client receives either a timeout or `502`/`503` error.  
   - It is **unclear** to the client whether the request was processed.  
3. Client automatically **retries** the call with the **same** payload and **same** `clientReference` (idempotent retry as recommended).  
4. Observe behavior:
   - Both attempts are accepted by the API (see logs/metrics).  
   - Settlement and webhook processing happen for both underlying operations.  
5. Check:
   - `GET /v1/transactions?clientReference=TOPUP-RETRY-20260309-001`  
   - `GET /v1/wallets/WALLET-777001`  

### Expected Result

- When both the **original** and **retry** requests use the same `clientReference`:
  - The system should treat them as **idempotent**.  
  - Only **one** logical transaction should be created and settled.  
  - Wallet `WALLET-777001` should be credited **once** for `100.00 EUR`.  
  - Any duplicate webhook events from the acquirer should be handled idempotently and not lead to multiple credits.  

### Actual Result

- Observed behavior:
  - `GET /v1/transactions?clientReference=TOPUP-RETRY-20260309-001` returns **two** separate transactions:
    - `TXN-20260309-1001` with `status` = `SUCCESS` and amount `100.00 EUR`  
    - `TXN-20260309-1002` with `status` = `SUCCESS` and amount `100.00 EUR`  
  - `GET /v1/wallets/WALLET-777001` shows wallet balance increased by `200.00 EUR` instead of `100.00 EUR`.  
  - Logs show two different internal operation IDs created for the same `clientReference`.  
  - No uniqueness or idempotency constraint is enforced at the data layer for `clientReference` within a given time window.  

### Severity

- **Severity**: Critical  
- **Priority**: P1  

Rationale:
- Leads directly to **over-crediting customer wallets** for a single intended top-up.  
- Can cause significant financial loss and complex reconciliation efforts.  
- Common in real-world conditions (mobile network drops, intermittent connectivity, user retries).

### Impact

- Potentially impacts:
  - All wallet top-up operations using `POST /v1/wallets/topup` where:
    - Clients apply retry logic, and  
    - The platform fails to enforce idempotency on `clientReference`.  
  - Any external partner integrations that rely on fire-and-retry strategies during network instability.  

- Business impact:
  - Financial exposure due to duplicated credits.  
  - Reconciliation complexity between external payment processors and internal ledger.  
  - Risk of customer confusion and disputes if duplicate credits are later reversed.

### Additional Notes / Attachments

- Recommended remediation:
  - Enforce a **unique constraint** on (`clientReference`, `walletId`) at the persistence layer for top-up operations.  
  - Implement idempotency keys at API gateway level, backed by a centralized store (e.g., Redis) with safe TTLs.  
  - Add tests that simulate client retries and verify a **single** logical transaction and credit.  

