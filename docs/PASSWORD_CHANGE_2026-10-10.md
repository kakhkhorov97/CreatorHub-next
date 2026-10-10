# Password change and footer, 10 October 2026

## Applied

Account Settings and Sign-in methods share a Change password form. Members enter the current password, a new password of 6–30 characters and confirmation. Multiple verified email/phone methods show a selection list. The single-method case selects its identity automatically. Social-only accounts see provider-managed password guidance.

The guarded changePassword mutation accepts an identity ID, current password and new password. It checks identity ownership, usable email/phone credentials, active account and live session inside a transaction. Existing bcrypt, Unicode-prehashed bcrypt and legacy scrypt comparisons remain supported. Wrong current passwords and unchanged new passwords produce validation errors. Successful changes revoke every account session and outstanding authentication token. Protected requests and refreshes reject the old session. No account password was changed on the configured Atlas database for verification. No collection/index migration is needed. The older changePhonePassword mutation remains for compatibility, but the previous replacement-only frontend form now uses this normal flow.

The footer displays Instagram, LinkedIn and YouTube icons as named images. They have no links or click action until the owner supplies social profile URLs. Existing /terms and /privacy links now read Terms of service and Privacy policy. The pages still require owner-approved policy text before deployment; this change does not publish invented legal policies. FAQ language guidance no longer refers to removed appearance modes, and the assistant's account knowledge includes password changes.

## Verification

All 76 backend tests across nine suites and all 29 frontend tests passed. Backend typecheck, lint, formatting and API build passed. Frontend production build includes lint/type validation and passed; generated documents validated against all 110 schema operations. Four new backend scenarios cover wrong current credentials, foreign identity attempts, short/unchanged passwords, email and phone-only changes, all-session/refresh/reset-token revocation, social/pending/revoked identities and concurrent changes.

Desktop 1440px and mobile 390px browser checks used a real disposable API/database. Confirmation mismatch sent no mutation. Wrong current password left the member signed in. Successful changes cleared browser sessions and old access tokens failed. The linked-method selection was present for email+phone accounts. Footer icons and both policy destinations passed, with no page errors or document overflow. Browser GraphQL calls were routed to the temporary API and its WebSocket was isolated from the main server. Earlier fixture failures came from a main-server WebSocket rejection; an actual validation issue discovered in this check was corrected so incorrect current credentials no longer signal UNAUTHENTICATED. Final screenshots and structured checks are in docs/verification/password-change-2026-10-10.

Email delivery, phone ownership/recovery and social sign-in configuration remain separate unfinished integrations. Changing a known password does not require an email provider. Main preview uses API 7001 and frontend 7007.
