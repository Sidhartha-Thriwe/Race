# Security Specification & Invariants

## 1. Data Invariants

1. **Default Deny Catch-all**: All collection paths not explicitly permitted are strictly closed (`allow read, write: if false`).
2. **Contact Inquiries (`/contact_inquiries/{inquiryId}`)**:
   - Anyone (including unauthenticated landing page visitors) can submit legitimate contact inquiries using `create`.
   - Incoming payload must satisfy `isValidContactInquiry`: string length bounds (name <= 100, email <= 150, company <= 120, interest <= 60, message <= 2000), valid email format, and status must be initialized to `'new'`.
   - Inquiries cannot be updated or deleted by arbitrary unauthenticated callers.
   - Reading or listing inquiries requires authentication.
3. **Campaigns (`/campaigns/{campaignId}`)**:
   - Creating or updating campaigns requires an authenticated user (`request.auth != null`).
   - The campaign ID must be valid (`isValidId(campaignId)`).
   - Valid string bounds and numeric bounds (budgetPerDay >= 0, totalBudgetCap >= budgetPerDay, targetCAC >= 0).
   - Campaigns can be read by authenticated users.
   - Deleting campaigns requires administrative role or the owning user.
4. **User Profiles (`/users/{userId}`)**:
   - Each authenticated user can only read and write their own profile (`request.auth.uid == userId`).
   - Self-escalation of roles is forbidden: standard users cannot change their `role` to `'admin'`.

## 2. The Dirty Dozen Malicious Payloads

1. **Payload 1 (Ghost Field Injection)**:
   Attempt to create a campaign with unauthorized shadow keys: `{ id: "c1", name: "Campaign", ...validFields, isAdminBypass: true, backdoor: 1 }`.
   *Expectation*: Rejected by `hasOnly()` key allowlist constraint.
2. **Payload 2 (Unauthenticated Campaign Injection)**:
   Attempt to create a campaign with `request.auth == null`.
   *Expectation*: Rejected with `PERMISSION_DENIED`.
3. **Payload 3 (Oversized Payload / Denial-of-Wallet)**:
   Attempt to submit a Contact Inquiry with a 50KB `message` string.
   *Expectation*: Rejected by `message.size() <= 2000`.
4. **Payload 4 (Identity Spoofing in Profile)**:
   User `user_A` attempts to write directly to `/users/user_B`.
   *Expectation*: Rejected by `isOwner(userId)` condition (`request.auth.uid == userId`).
5. **Payload 5 (Unchecked Query / Blanket Scraping)**:
   Unauthenticated user attempts `list` on `/contact_inquiries`.
   *Expectation*: Rejected by `isSignedIn()`.
6. **Payload 6 (Terminal Status Mutation Gap)**:
   Attempt to set status of a campaign to an illegal value `"HackedStatus"`.
   *Expectation*: Rejected by enum verification `status in ['Active', 'Paused', 'Draft', 'Completed']`.
7. **Payload 7 (Path Injection / ID Poisoning)**:
   Attempt to create a document at `/campaigns/../../etc/passwd` or using illegal non-alphanumeric characters.
   *Expectation*: Rejected by `isValidId(campaignId)`.
8. **Payload 8 (Negative Budget Attack)**:
   Attempt to create a campaign with `budgetPerDay: -50000`.
   *Expectation*: Rejected by `budgetPerDay >= 0`.
9. **Payload 9 (Privilege Escalation on User Role)**:
   A standard viewer attempts to update their own role from `viewer` to `admin`.
   *Expectation*: Rejected by role immutability constraint for non-admins.
10. **Payload 10 (Contact Inquiry Tampering)**:
    Unauthenticated visitor attempts to delete an existing inquiry at `/contact_inquiries/inq123`.
    *Expectation*: Rejected by `isSignedIn() && isAdmin()`.
11. **Payload 11 (Campaign Owner Hijacking)**:
    User `user_A` attempts to update a campaign created by `user_B` and alter `ownerId` to `user_A`.
    *Expectation*: Rejected by `incoming().ownerId == existing().ownerId`.
12. **Payload 12 (Client-Forged Server Timestamp)**:
    Creating a record attempting to backdate `createdAt` into the past.
    *Expectation*: Rejected by strict timestamp or server-side schema constraints.
