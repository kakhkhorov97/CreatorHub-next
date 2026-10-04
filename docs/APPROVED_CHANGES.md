# Approved CreatorHub changes

Completed 5 October 2026. The local frontend is at http://localhost:7007 and the API is on port 7001. The backend uses the configured Atlas database. Its existing records and private environment files were preserved.

## Pages and shared code

Public discovery, details, account collections/settings, workspace management, inquiries and admin page composition now live in pages. Reusable cards, forms, field/button/feedback controls, review previews and layout elements live in libs/components. Shared queries/state helpers stay in libs/hooks. Top and Footer are separate components, with named basic/home layout wrappers. Intentional route aliases reuse the same workflow.

Removed obsolete wrappers that imported pages back into components. Organized imports, formatted source folders and separated function declarations. scss/main.scss fixes stylesheet ordering so the approved reference theme loads before the October changes.

## Website behavior

- Korea-only city choices, public creator/project/service discovery and Korean or online events. Foreign records remain stored. Public event times use KST.
- Segmented keyword/category/location search with a blue button and a phone layout.
- Explore creative categories below search, before Popular projects.
- A sticky navbar with compact logo/search and scrolling navigation/category links after the homepage search leaves view. It expands near the top.
- Follow changes to a red Unfollow button and resets on unfollow.
- Sonner action notifications, with persistent instructions, inline errors and confirmation controls retained.
- Wider footer with Gwangju, Korea and explicitly labeled demo social icons.
- Gemini assistant for public website discovery and workflow questions. It sends no account token, private inquiry, saved list or account credential to Gemini.

## Manual approval

Owners save a new profile/project/service draft and submit it for approval. Edits to a currently public record submit a private candidate while its approved copy remains visible. Admins review submissions at /_admin/moderation and approve or reject with a reason. Owners see their status and submitted preview in the workspace. Stale revisions, removed records and inactive owners cannot be approved. Profile approval promotes USER to CREATOR; ADMIN keeps its role.

The new ContentReview collection and unique target index were created in the configured database. Existing content was not modified. This is manual publication review, not automatic adult-content detection. Existing static uploads and external media remain accessible by direct URL. Account identity edits and comments retain their existing behavior; this queue covers creator-profile fields, portfolio projects and services. The initial queue shows the latest 100 entries per status.

## Gemini setup

Add GEMINI_API_KEY and GEMINI_MODEL to the frontend's private .env.local, then restart the frontend. Use a generateContent model available in your Gemini account. Neither variable should use NEXT_PUBLIC_. See .env.example. A missing configuration produces a readable setup message in the chatbot.

The server checks input and same-origin requests, limits requests to eight per IP per minute and a configurable daily cap per process, and bounds request history/context. A shared rate-limit store is needed across multiple instances. No live Gemini call was tested because the key/model were not configured.

## Verification

- Frontend typecheck, lint and production build passed. All 11 frontend tests passed.
- All 101 generated GraphQL documents validate against the schema.
- The generated-document workflow executed 78 operations against a separate disposable MongoDB/API on port 7019, including all three review operations.
- All 64 backend tests across seven suites passed against a disposable replica set. The final typed review implementation also passed its five moderation integration tests.
- Backend typecheck, lint with the existing flat configuration, formatting, API build and batch build passed.
- Browser checks covered desktop search, compact/expanded navigation, Korean city choices, footer/demo Sonner feedback, 390px phone search and chat layout, and the unconfigured chatbot response. The phone layout had no horizontal page overflow.

Backups are under /private/tmp/creatorhub-before-agreed-changes for the frontend and /private/tmp/creatorhub-before-korea-moderation for replaced backend files. No public deployment was performed.

## Second approved batch, 5 October 2026

Completed the later account and interaction changes after the user approved the full list.

- Main navigation is between logo and search; only categories occupy the lower row. Discovery controls are hidden on unrelated routes and authentication pages.
- Normal registration returns home. Authentication for a protected activity resumes its requested route, including through verification/sign-in links. Email verification remains required for protected actions.
- Confirmations use compact prompts at the top with keyboard focus and cancellation.
- New inquiries send directly in one transaction, with no Save draft button, review step or sending confirmation. Existing drafts remain sendable/removable. Creator profile links open in a new tab while composing.
- Resend email has a smaller blue outlined action beneath the verification form.
- Action errors appear inline without a duplicate toast. Success notifications remain where explicitly used.
- The account dropdown includes Workspace, Account settings, Saved projects with its bookmark icon, Inquiries, Following, the creator profile when available, and Administration for admins. Sign out is smaller. The header saved shortcut is removed.
- Sign-in method panels, tabs and provider controls are compact and responsive.
- Project, creator, service and event cards have hover/pointer and focus behavior. Interactive links/buttons retain their own actions.
- Pagination scrolls back to the top. Remove/Delete controls are red throughout the app and admin. Creator-profile inquiry/follow actions have tighter placement.
- Customers mark agreed work completed, then leave one 1–5 star rating and written feedback. Reviews appear on the creator profile. The backend rejects outsiders, unfinished work and duplicate reviews.
- Creator onboarding retains the existing user ID, credentials and engagement records. The account role changes when the existing profile is approved.
- The chatbot has a smaller launcher, panel, header, messages and composer.
- New passwords use 6–30 characters across frontend and backend registration, linking, reset and change forms. Legacy stored credentials remain compatible. Korean Unicode passwords work without truncation.

Verification: frontend production build, typecheck and lint passed; 12 frontend tests and 67 backend tests passed. All 106 generated API documents validate; the disposable frontend integration exercised 83 operations, including all five new inquiry/review operations. Browser checks covered desktop/mobile navigation, sign-in return routing, compact account settings, account menu, top confirmation, inline-only errors, direct inquiry sending, public customer reviews and pagination returning to the top. Authenticated browser writes used only disposable test data.

The tested backend changes were applied and rebuilt. Review and inquiry retry indexes were activated in the configured database without editing existing content records. The main frontend preview is port 7007 and its API is port 7001. Gemini still needs the previously documented local key/model configuration; this batch does not add credentials.
