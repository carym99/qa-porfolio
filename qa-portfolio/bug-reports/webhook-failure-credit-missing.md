## Bug Report – Wallet Credit Missing After Webhook Failure

- **Title**: Wallet credit not applied when settlement webhook fails on first attempt  
- **Environment**:
  - Environment: `staging-eu-west`  
  - Wallet Service: `v3.4.2`  
  - Payments Processor Integration: `Acquirer-X Sandbox v2.1`  
  - Webhook Worker: `wallet-webhook-consumer v1.8.0`  
  - Date/Time Observed: 2026-03-05 14:32–15:05 UTC  

### Steps to Reproduce

1. Initiate a wallet funding transaction via card:
   - Endpoint: `POST /v1/payments/authorize` then `POST /v1/payments/capture`
   - Amount: `50.00`  
   - Currency: `USD`  
   - Customer Wallet: `WALLET-90123`  
2. Confirm that the payment is captured successfully at the acquirer:
   - Acquirer dashboard shows transaction in `CAPTURED` / `SETTLED` state
   - Acquirer reference: `ACQ-REF-20260305-77821`  
3. Wait for settlement webhook from Acquirer-X to hit the internal endpoint:
   - Webhook target: `POST /internal/webhooks/acquirer-x/settlement`  
4. On the first webhook attempt, intentionally simulate a transient failure:
   - Temporarily block outbound calls from the load balancer to `wallet-webhook-consumer` pod (e.g., apply a short-lived network policy) **or**  
   - Force the consumer process to restart at the time of the first webhook.  
5. After the failure, allow traffic normally and confirm that Acquirer-X re-sends the webhook (per their retry policy).  
6. Query:
   - `GET /v1/transactions/{paymentReference}`  
   - `GET /v1/wallets/WALLET-90123`  
   using `paymentReference` returned from the original capture API.  

### Expected Result

- Even if the **first** webhook attempt fails:
  - At least one of the subsequent retries from Acquirer-X is **processed successfully** by `wallet-webhook-consumer`.  
  - The internal transaction status transitions from `PENDING_SETTLEMENT` to `SUCCESS`.  
  - The customer wallet `WALLET-90123` balance increases by `50.00 USD`.  
  - Audit trail and settlement records show a linked settlement event using `ACQ-REF-20260305-77821`.  

### Actual Result

- Observed behavior:
  - Acquirer dashboard: transaction marked as `SETTLED` with reference `ACQ-REF-20260305-77821`.  
  - Internal `GET /v1/transactions/{paymentReference}`:
    - `status` remains `PENDING_SETTLEMENT` even 30 minutes after acquirer settlement.  
  - `GET /v1/wallets/WALLET-90123`:
    - Wallet balance is **not** credited by `50.00 USD`.  
  - Logs from `wallet-webhook-consumer` show:
    - First webhook attempt failed with `503 Service Unavailable`.  
    - No subsequent processing logs for the same `acquirerReference`.  
  - There is **no reconciliation job** that picks up this stuck `PENDING_SETTLEMENT` transaction automatically.

### Severity

- **Severity**: Critical  
- **Priority**: P1  

Rationale:
- Funds have actually moved at the acquirer level, but the customer wallet remains uncredited on our platform.  
- Leads to **financial loss** and reconciliation discrepancies if not caught manually.  
- Affects customer trust and can trigger regulatory reporting if replicated in production.

### Impact

- Impacted scope:
  - All card-funded wallet transactions processed via Acquirer-X where the first webhook attempt fails and retries are not correctly processed.  
  - Potentially impacts a subset of customers on unstable network segments or during deployments/restarts of `wallet-webhook-consumer`.  

- Business and user impact:
  - Customers see successful debit from their bank/card but **no corresponding wallet top-up**.  
  - Increased load on support and operations teams to manually reconcile and credit affected wallets.  
  - Financial reporting and ledger systems show mismatches between external settlement and internal ledger.

### Additional Notes / Attachments

- Logs (redacted) show missing correlation for `ACQ-REF-20260305-77821` after the initial failure.
- Recommend:
  - Implementing **idempotent** webhook handling keyed by `acquirerReference`.  
  - Ensuring **retry-safe** processing so any successful webhook retry triggers wallet credit.  
  - Adding a **daily reconciliation job** using acquirer re-query APIs to correct stuck `PENDING_SETTLEMENT` transactions.

