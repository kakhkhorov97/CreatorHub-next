# Approved CreatorHub batch, 9 October 2026

## Applied

- Original inquiry briefs appear directly above conversation messages; the extra View original brief button is removed. Details still contains budget, deadline, service snapshot and workflow actions.
- Inquiry records retain transactional alert/read tracking for Inbox, but notification listing, total and unread count exclude inquiry events. Public activity notifications remain unchanged.
- The AI assistant introduces itself immediately on opening and greets signed-in members by name. The introduction remains visible with existing history.
- Login/signup placeholders are removed; visible labels, password requirements and confirmation remain.
- Help is now FAQ, with 14 answers translated into English, Korean and Uzbek. Existing /help links redirect permanently to the locale’s FAQ. Assistant reference links use /faq.
- Removed the footer’s nonfunctional social placeholders and replaced preview framing with content transparency. Cleaned remaining public seeded copy and repaired three missing/broken project covers. Fictional/AI disclosures remain; technical media routes and isDemo contracts are unchanged.
- Added four fictional creators, four services and 15 projects to the configured Atlas store. All 16 active categories have at least two published projects from visible active creators. Existing member passwords and private messages were unchanged.
- Generated 19 separate original assets with the built-in image_gen tool. Files are in backend public/demo-media and are packaged with the API; no frontend media duplication. Prompts and original paths are in PORTFOLIO_ASSETS_OCT9.json.
- Created a private Notion account directory for all 32 user records. Four new unique credentials were verified by logging in and logging out. Existing credentials are marked unavailable, and 23 records without identities are marked not configured. No existing password resets were performed; authorization to add identities to old fictional accounts is still pending. Passwords are not saved in repository documentation.

## Verification

Frontend 29 tests, typecheck, lint, all 109 API document contracts and production build passed. The build generated 204 localized static pages plus the legacy Help redirects. Backend 72 tests across nine suites, typecheck, lint, formatting and API/worker builds passed. The notification regression covers exclusion from listing/total/unread counts while Inbox remains unread. Initial test failures were corrected: the frontend test still expected /help and the added backend assertion lacked its Types import.

Disposable API integration exercised 85/109 generated operations and Socket.IO authentication, participant privacy, retry, stale-write rollback, read, reconnect and revoked/suspended-session checks. Operations not exercised remain listed in docs/verification/integration.json. No live private conversations were used for QA or screenshots.

Desktop/mobile capture checks cover eight public views, visible demo wording, overflow, eager image failures, auth placeholders and guest introduction. Capture results are in docs/presentation/2026-10-09/verification.json. Isolated Inbox checks are recorded separately there. The presentation package contains 11 views per device across nine main pages, including extra popular-project and creator-work views.

## Deployment limitations

This batch does not deploy the website or resolve the dependency audit, shared development/production database, mail/SMS delivery, persistent hosting, unfinished legal/contact configuration or disabled social sign-in. The deployment checklist on the private Notion review still applies. Reserved .example fictional accounts do not receive email. Concept projects and events are not represented as real commissions or scheduled events.

## Category coverage

- Graphic design: 2 published projects.
- Photography: 2 published projects.
- Video production: 2 published projects.
- Illustration: 2 published projects.
- Web development: 2 published projects.
- UI/UX design: 2 published projects.
- Branding: 3 published projects.
- Editorial design: 3 published projects.
- Product design: 2 published projects.
- Art direction: 2 published projects.
- Packaging: 2 published projects.
- Digital design: 2 published projects.
- Typography: 2 published projects.
- Motion design: 2 published projects.
- 3D design: 2 published projects.
- UX design: 2 published projects.

## Appearance correction

Removed the shared Light, Dark and System setting from Inbox and the AI assistant at the owner's request. Both surfaces use their original site appearance. Stored chat theme choices no longer affect rendering.

Verification for the appearance correction: all 29 frontend tests and the production build passed. Desktop and mobile browser checks passed with a dark operating-system preference and a previously saved dark chat setting. No selector or theme attribute remains, and neither viewport overflowed or raised a page error. The preview was restarted on port 7007. Previously exported screenshots document the preceding batch and may still show the removed selector.

## Compact mobile header

Mobile header Sign in and Sign up links use 12px text, 36px height and smaller horizontal padding. The mobile language trigger is a 20px globe in a 40px button, opening the existing English, Korean and Uzbek menu. Desktop language labels and buttons retain their previous size. The production build passed. Browser checks at 320px, 390px and 1440px passed without page errors or document overflow; switching to Korean and closing the menu with Escape worked.

## Desktop language globe

Extended the globe language trigger to desktop at the owner's request. The existing menu, locale switching, accessible language label and keyboard controls remain. Production build and browser checks at 320px, 390px and 1440px passed. Korean switching worked on both desktop and mobile.
