# Firebase Security Spec

## 1. Data Invariants
- `users/{userId}/private/info`: Can only be created and read by the authenticated user whose `request.auth.uid` matches the `{userId}`.
- `markets/{marketId}`: Read-only for authenticated users. Cannot be written by clients without admin rights.
- `products/{productId}`: Read-only for authenticated users.
- `orders/{orderId}`: Users can only create an order where `userId == request.auth.uid`. Users can only read orders where `userId == request.auth.uid`. Status updates are limited to transitions up to terminal states.

## 2. The Dirty Dozen Payloads
1.  **Identity Spoofing**: User A tries to create an order with `userId` = User B.
2.  **ID Poisoning**: User A sends `{orderId}` of 1MB junk.
3.  **PII Leak Read**: User A tries to read `users/{userB}/private/info`.
4.  **PII Write**: User A tries to write to User B's private info.
5.  **Schema Bypass (Shadow Field)**: User A creates an order with a ghost field `isPaid: true`.
6.  **Type Attack**: User A updates order `total` to a large String.
7.  **Terminal State Bypass**: User tries to update an order that is `finished`.
8.  **Status Skip**: User tries to update a `pending` order directly to `finished` (if we lock it).
9.  **Array Size Attack**: User sends order with 10_000 items.
10. **Admin Spoofing**: User tries to insert `isAdmin: true` into their private info.
11. **Timestamp Forgery**: User creates order with `createdAt` = future or past time.
12. **Blanket Query Scraping**: User runs `allow list` without restricting to their `userId`.

## 3. Strict Rules Plan
- Define `isValidId()`, `isSignedIn()`.
- Validations: `isValidUserPrivateProfile(data)`, `isValidOrder(data)`.
- Use `affectedKeys().hasOnly()` for updates.
