# Email signup confirmation and inline errors

Email signup now opens `/account/check-email`, retaining the email in session storage and any protected activity return path. The confirmation page explains the existing email link verification flow, provides a resend action, and links to sign-in. Direct visits without a pending email offer an email input for resending. Registration does not save the returned login tokens.

Authentication forms display required, format, length, password mismatch, and server submission errors under the relevant fields. Error text is red, invalid inputs are marked with aria-invalid, and aria-describedby links the error to its input. Editing an input clears its error; other input values remain intact.

New copy is translated in English, Korean, and Uzbek. No backend or database schema changes were made.

Verification: mocked successful registration confirms the redirect, retained email, protected return path, and absence of saved auth tokens. Browser checks confirm required errors and a real rejected login response under the password input. Desktop and 390px mobile confirmation views were inspected; mobile has no horizontal overflow. Production build, typechecking, lint, and all 36 tests passed. No accounts were created, and actual mail delivery was not tested.


## Simplified email link flow

The approved follow-up removes manual email verification token entry. Both `/verify-email` and `/account/verify-email` read the email link token and verify automatically. One request is made per token, including React Strict Mode effect replays. Success shows Email verified and a Sign in button; invalid/expired links show a red explanation and resend recovery. Transient failures offer Try again. The compact confirmation panel displays the signup email, a text resend action, and Back to sign in. Direct visits have no email field until Resend email is selected. The duplicate pending-signup banner is hidden on confirmation routes.

Verification: all 39 tests passed; production build and typecheck passed. Mocked success and expired-token tests cover the verification mutation and success state without altering accounts. Browser checks cover the compact desktop view, invalid-token recovery, absence of a token input, and required email errors under the recovery input. Mobile at 390px has no horizontal overflow. No live confirmation email was consumed and email delivery was not tested. The frontend runs the updated production build on port 7007.


## Global signup banner removed

Removed the pending-email banner and its session-storage listener from the shared header after user approval. The confirmation page and login verification guidance remain.
