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


## Third approved batch, 5 October 2026

This section records that earlier approved batch. The messaging refinement below supersedes its Received/Sent tabs and permanent brief-column layout.

Completed the approved inbox, login, navigation and demo-content changes.

- Creators default to Received inquiries. Sent and Received use direction icons, From/To labels and separate active states. Lists show counterpart names, subjects, brief previews, status and dates instead of record identifiers.
- The Inbox icon shows unread incoming conversations and refreshes every 15 seconds. Opening a visible conversation marks only observed incoming events/messages read. A later reply stays unread. Notifications remain supplementary and do not control the Inbox badge.
- Messages, the original brief and inquiry composition have separate layouts. The brief keeps service, budget and deadline information apart from replies. Both list and conversation adapt to phone widths.
- Sign-in has one Email or phone number input. Registration keeps its separate methods. Sign out is compact and red, and Saved projects is text-only in the account menu.
- Main navigation uses stronger text and blue active/hover states. Categories use smaller regular text on a pale lower rail, including when the header compacts.
- Added Seoul, Gwangju and Busan fictional demo events. The online demo now identifies Korea. The homepage shows three cards; four Korean/online events are publicly available. Foreign demo records remain stored.
- Replaced twelve demo SVG project covers and matching galleries with seven realistic AI-generated portfolio concepts. Each updated record identifies fictional AI artwork. Asset sources and prompts are recorded in PORTFOLIO_ASSETS_OCT5.json.

Validation: frontend lint, typecheck, production build, twelve tests and all 108 GraphQL document checks passed. Backend API build, typecheck, lint and 67 tests across eight suites passed. The disposable generated-document workflow exercised 85/108 operations, including recipient isolation, unread replies and a stale read/reply race. Browser checks covered the unified login, creator Received default, unread clearing, separated conversation/brief, mobile conversation with no horizontal overflow, compact navigation, new artwork and three homepage events. The final frontend/API are available at ports 7007/7001. No public deployment was performed.

Backend source backups are in /private/tmp/creatorhub-before-inbox-batch. Restricted demo-record backups are /private/tmp/creatorhub-inbox-events-backup.json and /private/tmp/creatorhub-inbox-media-backup.json. Tests used a disposable database; private configured inquiries/accounts were not altered for testing.

## Approved messaging refinement, 5 October 2026

The latest approved inbox has one participant-only conversation sidebar and a selected chat on the right. Rows show counterpart names, inquiry previews, status, dates and unread indicators. Received and sent messages use left/right bubbles. The composer stays visible beneath the scrolling thread. Details contains the original brief and existing inquiry workflow actions. Phones show the list and selected chat separately with Back to inbox.

Enter sends and Shift+Enter inserts a newline. IME composition, empty messages, busy submissions and held Enter keys cannot cause an unintended or duplicate send. Version-bounded read acknowledgements retain the existing protection for replies that arrive after the observed inquiry version.

The user then approved removing pagination controls only. Downward scrolling loads more conversations. Upward scrolling loads older messages while preserving the reading position. Conversations open at their latest messages. There are no pinned conversations. The interface uses the existing HTTP GraphQL transport with 15-second polling; WebSockets remain deferred.

The optional `allConversations` argument on `getInquiries` merges participant sent and received records. Private drafts stay private, and the participant inbox does not expose other records to admins. Existing directional callers keep their previous behavior. The generated contract remains 108 operations.

Validation: frontend typecheck and lint passed, with 17 frontend tests. The backend passed 67 tests across eight suites. All 108 GraphQL documents validate, and the disposable integration exercised 85 operations with participant merging, draft privacy and admin isolation checks. Desktop and phone browser checks captured the new list/chat layout and Details. A 52-message history opened at the latest messages with no message pagination controls. Frontend and backend production builds passed. See [messaging verification](verification/messaging-redesign.md).


## Account photo and list refinements, 5 October 2026

Implemented the four approved changes: an Upload photo button replaces the avatar URL field; Following uses compact creator rows; clicking outside the account menu closes it; messaging Details no longer displays or requests conversation audit history. The original brief and workflow actions remain in Details.

Avatar uploads accept JPG, PNG and WebP up to 10 MB, preview the selected image, save the returned URL through updateMe and update the current header avatar. The Apollo transport supports multipart uploads with the required preflight header. Errors remain inline. Existing imageUploader and updateMe APIs are reused without backend changes.

Verification: production build, typecheck, lint and all 17 frontend tests passed. Disposable integration exercised 85/108 generated operations. A separate authenticated multipart check passed upload, account save and image delivery. Browser checks confirmed saved avatar display, menu outside-click dismissal, desktop/phone Following rows and history removal from Details. Browser file selection itself was blocked by the extension's file-URL permission, so the chooser-to-upload interaction was not verified end to end. All writes used disposable accounts.

## Navigation, languages and project uploads, 6 October 2026

Implemented the approved batch within the existing September 25 white-and-blue design system.

- Events, event details and Contact retain the main navigation without project search or categories.
- English is the default interface language. Korean and Uzbek use next-i18next with Pages Router locale routes. The native header language select remembers the choice in the NEXT_LOCALE cookie. Account preferredLocale accepts en, ko and uz. Stored creator content and private messages retain their original language.
- Project covers accept JPEG, PNG and WebP uploads. Galleries also accept MP4 and WebM, with a 10 MB limit per file, ten files per upload and twenty gallery items per project. The existing multipart API stores the files. Forms show previews, allow gallery removal and reordering, retain manual URL entry and display errors inline.
- Project publication continues through manual admin approval. Payments and commissions were not added. Inbox updates still use HTTP polling; WebSockets remain deferred.

Validation: all 19 frontend tests passed. The disposable generated-document integration exercised 85/108 operations, including all three account locale values. Separate authenticated checks passed image and video multipart upload, delivery of the stored bytes and project saving. Browser checks confirmed complete image loading, video readyState 4 and Korean/Uzbek page language. Project and Contact pages had no horizontal overflow at 1440px desktop and 390px phone widths.

The browser file-chooser interaction remains unverified because of the previously recorded extension file-URL permission restriction. No live Gemini key test was performed. The final production build passed, including lint and type checking. All 108 generated operation documents passed contract validation. Native video playback was verified.

DESIGN.md and .impeccable/design.json remain the visual authority for this extension. Their earlier description of simplified headers on informational pages predates the approved Events/Contact navigation adjustment; this batch records that behavior here without revising the design files.

Finish review scored the contact translation and settled video preview fixes resolved. Documentation preserves the incumbent design files. Local API 7001 and production frontend 7007 were restarted; disposable preview servers were stopped.

## Language menu style, 6 October 2026

Replaced the native language select with a compact flag/name button and a dropdown for English, Korean and Uzbek. Approved flags are US, South Korea and Uzbekistan. The selected item has a checkmark and blue styling. Outside click, Escape and leaving the menu close it; arrow keys navigate choices. Route preservation and the saved locale cookie remain. Production build and 19 tests passed; desktop/mobile browser checks verified keyboard switching, Escape, outside-click dismissal and remembered language. The mobile menu position was corrected after inspection.
