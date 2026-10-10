# CreatorHub project review

Reviewed 8 October 2026. Frontend: CreatorHUb-FrontEnd. Backend: creatorhub-backend-starter. This is a review of the local implementation and configured preview, not certification of a deployed service.

## Applied in this batch

- AI assistant sends with Enter, keeps Shift+Enter for a newline, ignores input composition and held Enter, and closes on outside clicks. Guests can ask questions. Signed-in members see their name in the welcome message and their avatar beside their messages. Conversation state clears when the account changes.
- Inbox and assistant share a browser-local Light, Dark or System preference. Public pages retain the approved white-and-blue style. Mobile Inbox width and dark message colors were corrected during browser QA.
- Simple publishing, upload and account-help questions avoid a public database round trip. Public lookup timeout is 3.5 seconds. Gemini overload gets one retry within the existing 25-second provider deadline. Quota, configuration, overload and connection failures have distinct messages; failed messages return to the input. This reduces avoidable waiting but cannot guarantee provider response times.
- Mobile avatar menu contains language, Inbox and notifications. Both desktop and mobile expose Followers & Following with separate tabs. The new authenticated getMyFollowers query returns only the current creator's active followers, using names and avatars. It cannot request another creator's follower list. Suspended/deleted members are excluded. Following retains existing Unfollow behavior.
- Follow sits beneath profile location details. Send inquiry remains in its existing action area.
- Signup has one email-or-phone field with automatic detection, a country-code selector, Your name, helpful placeholders, password requirements and Confirm password. A mismatch prevents registration. Login has a useful placeholder; verification links appear when needed rather than permanently at the bottom.
- Visible demo wording was replaced in public/admin components and translations. Public Atlas copy was cleaned in 67 records: two names, fourteen bios, twenty-one projects, twenty-four services and six events. Fictional and AI-generated disclosures remain. Technical isDemo fields, media paths and seed script names retain their contracts.
- Social sign-ups remain deferred for the next stage. No Redis was added.

## Unfinished work, in priority order

| Priority | Work | Evidence and completion requirement |
| --- | --- | --- |
| Before deployment | Dependency upgrades | Production-dependency audit reports 216 affected frontend package entries: 25 critical, 61 high, 118 moderate and 12 low. Backend has 31: one critical, 16 high and 14 moderate. Counts include transitive and inherited packages; they do not prove every advisory is reachable. Next.js 14.2.0, old Axios/Swiper/CRA dependencies and the backend Apollo/Nest/upload stack need staged review. Remove unused inherited packages after checking imports; upgrade compatible groups and rerun contracts, authentication, uploads and messaging tests. Do not use audit fix --force blindly. |
| Before deployment | Separate databases | MONGO_DEV and MONGO_PROD currently contain the same configured database setting. Create staging/dev databases, restricted credentials and separate secrets before real user onboarding. Development changes currently affect the shared Atlas dataset. |
| Before deployment | Real email delivery | MAIL_WEBHOOK_URL and MAIL_WEBHOOK_TOKEN are unset. Development verification/reset mail is written to .local/mail, not delivered. Configure delivery and verify registration, resend and reset links on the real domain. Production validation requires delivery settings. |
| Before deployment | Phone ownership and recovery | Phone/password signup accepts a number without SMS ownership verification. Phone-only recovery is unavailable. Add verified SMS flow or postpone public phone signup. This batch does not claim to verify numbers. |
| Next feature stage | Social sign-ups | Google, Kakao and Telegram controls are disabled. Backend exchange/verification code exists, but provider configuration, frontend authorization and callbacks need implementation and live verification. Add one provider at a time with account linking, nonce expiry, cancellation and duplicate-identity tests. |
| Before deployment | Persistent media and hosting | Backend packages 51 approved concept assets. Creator uploads still need persistent storage, backups, upload/media HTTPS origins and a production host. Configure frontend, API 7001, frontend 7007, worker 3002, reverse proxy and WebSocket upgrades. Production environment validation must pass. No remote deployment was performed. |
| Before deployment | Terms, privacy and public contact | Policy pages are unfinished and public team contact details remain unset. Complete operator/contact details, retention/deletion policy and disclosure of Gemini processing. Keep fictional members/artwork distinguishable from real members and commissions. |
| Before deployment | Monitoring and recovery | Redacted request logging exists. Add error alerts, API/worker uptime checks, Gemini quota monitoring, database/media backups and a tested restore procedure. Keep tokens, keys and private conversations out of logs. |
| Portfolio documentation | Current ER diagram | Backend registers 21 collection models; the ER guide still describes 17. Reconcile the diagram with SiteContent, CreativeEvent, ContentReview and ServiceFeedback and current inquiry/authentication rules. UI layout changes alone do not create collections. Followers reuses CreatorFollow. |
| Scope decision | International discovery | Public discovery and publication currently use Korean cities and KRW. International project concepts exist, but this is not full country/currency support. Decide the location/currency model before expanding public discovery; copy and backend validation must change together. |
| Later scaling | Multiple API instances | Socket.IO rooms, social challenges and rate counters are process-local. Keep one API process initially. Multiple instances require a deliberate shared adapter/quota design and reconnect tests. MongoDB remains message-history storage; Redis is not required for that history. |
| Later assistant quality | RAG evaluations | Current RAG retrieves short curated help entries and public GraphQL records by keywords. It is not model training or vector search. Add a multilingual evaluation set for correctness, relevant links, unsupported facts, prompt injection and latency before increasing complexity. |

Dependency evidence is stored in docs/verification/dependency-audit-2026-10-08.json in each repository. The [Next.js maintainer advisory](https://github.com/vercel/next.js/security/advisories/GHSA-f82v-jwr5-mffw) explains one middleware bypass affecting the installed version; CreatorHub also enforces authorization in backend guards. A single older patch does not resolve the whole current audit. Apollo upgrades need compatibility work; see [Apollo's migration guide](https://www.apollographql.com/docs/apollo-server/migration).

## Suggested features after social sign-ups

These are proposals, not implemented additions. Prioritize features that help the existing discovery-to-inquiry flow.

1. Report content or accounts, with an admin queue and decision history. Existing manual publication approval provides a starting point.
2. Block a member from starting new inquiries, with clear effects on existing conversations and notification delivery.
3. Optional email notifications for new inquiries and replies, with member preferences and duplicate-delivery protection. Implement real email first.
4. Search suggestions and saved search filters. Measure failed searches before changing ranking or claiming time-based trending. Popular projects currently rank by actual likes.
5. Event interest/bookmark controls, if people use the Events page. Keep registration/ticketing outside scope until real organizers and policies exist.
6. Admin two-factor authentication and audit trails for sensitive account changes before delegating administration to other people.

I would postpone payments, bookings and broad social-feed features. They add workflows beyond the current portfolio and inquiry product.

## Maintenance routine

For each change, work on a branch, describe the behavior and run frontend typecheck, lint, tests, contract checks and build. For backend changes run format, typecheck, lint, tests and build, plus the worker build when its dependencies change. Export schema and regenerate frontend contracts together. Run integration tests against a disposable MongoDB replica set on an unused port, never Atlas. Keep development and production build directories separate or stop the dev server before building.

Weekly, review dependency advisories, error rates, mail failures, moderation backlog and Gemini usage. Update assistant knowledge when Help or workflows change. Monthly, test backup restoration and account recovery, review admin access, clean orphan uploads carefully and check browser behavior at mobile and desktop sizes. Keep an environment-variable inventory with no secret values. Store secrets in ignored local files or the deployment secret manager; never in .env.example.

Before each deployment, verify real-domain HTTPS/CORS, email links, login/refresh/logout, creator approval, image/video uploads, inquiry send/retry/reconnect, follower privacy and phone restrictions. Record a rollback version and database/index migration plan. Introduce CI so those checks become repeatable rather than manual.

## Verification and limits

Backend: 72 tests across nine suites passed on a full rerun, plus typecheck, lint and API build. The initial failure came from using an already-revoked test session; the test now creates an independent active account. Followers tests cover unauthenticated access, owner-only results, admin/unrelated-account isolation and suspended-member filtering.

Frontend: 29 tests passed, including public-only RAG, provider overload retry and error classification, and matching translation catalogs. Typecheck, lint and all 109 generated API documents passed. The final production build passed and generated 204 localized pages. Backend worker build and formatting checks also passed. Disposable generated-document integration exercised 86 of 109 operations, including getMyFollowers and messaging privacy/retry/session/reconnect checks. The remaining 23 operations are not represented as newly tested live integrations.

Browser checks covered guest Enter sending and a live Gemini answer, outside closing, mobile account shortcuts, named greetings, shared dark preference, populated connection tabs, signed-in avatar images, signup password mismatch rejection and mobile/desktop Inbox colors. No real user inquiries were sent for validation. Provider OAuth, SMS, real email and remote deployment remain unverified.
