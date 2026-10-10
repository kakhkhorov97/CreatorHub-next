# CreatorHub frontend

Converted from Nestar-next while preserving its Pages Router, Apollo, MUI, TypeScript, layout/component organization, and SCSS structure.

## Run locally

1. Install the dependencies using the existing yarn.lock, or use the dependencies already installed in this folder.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_GRAPHQL_URL` to the CreatorHub GraphQL endpoint.
3. Start the CreatorHub backend with `FRONTEND_URL=http://localhost:7007` and a configured MongoDB replica set.
4. Run `npm run dev` and open http://localhost:7007.

The normal frontend reads real backend data. It does not seed accounts or insert demonstration content.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm test`
- `npm run contract:check`

`docs/operations.json` contains all 108 schema-validated GraphQL operations. `docs/API_COVERAGE.md` records where they are used. The schema was copied from the backend's `docs/schema.graphql`. To regenerate documents and types after replacing that schema, run `npm run contract:generate`.

For isolated backend checks, set `CREATORHUB_BACKEND_PATH` to the backend checkout and run `node scripts/integration.cjs`. The script uses a disposable MongoDB replica set and the backend's existing test dependencies. On this machine it uses the cached macOS ARM MongoDB 7.0.24 binary. It never uses the configured application database. It exercises 85 operations, including the manual review APIs. Four provider-specific social operations and two upload operations remain untested.

## Current limits

- Google, Kakao, and Telegram controls remain disabled. `libs/auth/social.ts` defines the backend exchange; real browser authorization adapters must be configured and verified before enabling them.
- Direct file uploads are unavailable. Project media must use HTTPS URLs under the backend's MEDIA_BASE_URL/account-id prefix.
- The backend sends verification and reset links to `/verify-email` and `/reset-password`; both routes are included.
- Email integration is tested with an in-memory mail adapter, not a production provider.
- Sessions use tab-scoped sessionStorage because the backend returns bearer tokens. Closing a tab ends local persistence. Production security review remains separate.
- Project hearts load viewer state with `getMyProjectLike` and toggle through the existing like/unlike mutation. Saved/followed state uses the available paginated APIs.
- Profile lookup by ID is not exposed. Project and following views resolve visible identities through paginated creator discovery. A backend batch lookup would avoid this extra work at larger scale, but no backend changes were made.
- Administration now provides searchable record directories and comment context through protected admin APIs.
- Privacy and terms pages require approved content before public launch. The interface is English; the stored language preference does not claim a complete Korean translation.

See `docs/verification/` for the actual check results and captured browser evidence.

## Current reference implementation

The approved September 25 white-and-blue references replace the earlier warm palette. `scss/reference.scss` loads after shared, desktop, and mobile styles. The homepage shows Popular projects, distinct Recently added projects, an introduction video, categories, and demo events. See `DESIGN.md`, `docs/REFERENCE_BRIEF.md`, and `docs/MEDIA_PROVENANCE.md`.

The local frontend runs on port 7007 and backend on 7001. List responses use the backend list/metaCounter wrappers; frontend hooks normalize those responses and page-based requests. The 108-operation contract includes the protected admin APIs, `getMyProjectLike` and both upload operations, although direct-upload UI remains unavailable.

### Expanded fictional demo content

After the existing seed and style scripts, run `node scripts/expand-demo.cjs` to restore the portrait expansion. It targets only the local disposable preview database recorded in `.preview-db.json`. The preview has fourteen demo creators, fourteen categories and four demo clients. Each creator has an AI-generated portrait. Credentials are in `docs/DEMO_ACCOUNTS.md`; image origins and exact prompts are in `docs/portrait-assets.json`. Restart the frontend after adding new public assets.

### Community preview additions

The homepage shows six Popular projects, the looping introduction video, six distinct Recently added projects, category links, three fictional demo events, and About/join content. The navbar links separate Projects, Creators, Services, Events, and Contact pages. About and Contact pages and the expanded footer use drafted factual product copy. The footer address is Gwangju, Korea. Social icons are clearly marked as demos.

After restoring the original demo and running scripts/expand-demo.cjs, run `node scripts/seed-community.cjs` to add the three international concepts and demo events. This script only accepts the local disposable creatorhub_frontend_test database and is idempotent. Run `node scripts/check-community.cjs` against that preview to exercise the new operations. See docs/verification/community.json. A preview backend restart normally resets the disposable database; fixtures must be restored or seeded again.

The supported city list currently includes 17 Korean cities. Public discovery excludes creators outside Korea and their work. Service prices remain in KRW. Public event times use KST; admin date inputs explicitly use UTC. No event registration or payment flow is implemented.

## Administration

Open `http://localhost:7007/_admin` and sign in with an ADMIN account. Normal accounts cannot use admin pages or APIs. Administrator sign-in without an explicit return path lands in the dashboard.

The dashboard manages accounts and roles, creator profiles, projects, services, categories, events, public comments and website copy. Search and filter a directory, then choose Manage to edit a record. Project/service creation selects an existing creator. Status and removal controls require confirmation. Removed accounts and content remain recoverable; restoring content does not publish it automatically. Media replacements must belong to the actual creator's storage folder.

Website content controls save the homepage heading/subheading, About text, contact email/text and footer copy to the backend. Contact details may remain unset. The public website keeps its approved design. The administrative design is scoped in scss/admin.scss and described in docs/ADMIN_BRIEF.md.

`node scripts/check-admin.cjs` tests the new API flows against the explicitly guarded local disposable preview database. It restores edited fixtures and removes its own temporary test records. Evidence is in docs/verification/admin.json and admin-browser.md. API integration, community checks and admin checks cover 92 of 98 operations; provider browser flows and GraphQL uploads are outside these frontend runs.

### Current Atlas-connected local site

The local frontend at http://localhost:7007 calls the backend on port 7001. The running backend uses the configured Atlas `CreatorHub` database. On 4 October 2026, the user approved importing the fictional preview profiles and public content into Atlas while preserving its existing records. The imported public user profiles, creator profiles, services, projects, categories, events, likes, comment and website text are now persistent there. The current administrator account uses a newly generated credential supplied in chat; it is not stored in this repository.

The fictional imported profiles have no copied sign-in identities. They appear in discovery and administration, but their old disposable-preview passwords do not grant access to Atlas. New visitors can register normally. The backend configuration currently names the same Atlas database for development and production, so changes made through the local admin panel affect that shared database. See `docs/verification/atlas-import.md`.


## Approved October changes

See [the implementation notes](docs/APPROVED_CHANGES.md) for page/component organization, manual approval, the segmented homepage search, compact sticky navigation, Sonner feedback, and Gemini setup. The current local API uses the configured Atlas database. Existing foreign records remain stored but are hidden from public discovery. Demo seeding instructions above target disposable databases only; their old demo login identities were not imported into Atlas.

The Gemini assistant uses server-side retrieval over curated public help entries and current public GraphQL content. Set server-only `GEMINI_API_KEY` and `GEMINI_MODEL` in `.env.local`, then restart the frontend. Never use a `NEXT_PUBLIC_` prefix for the key. See `docs/ASSISTANT_RAG.md` for the retrieval design and setup. Tests cover public retrieval and provider failures. A guest publishing/upload question received a live Gemini answer locally on 8 October 2026.

### Backend-served demo images

The 51 approved demo portraits and project images are included in the CreatorHub backend's `public/demo-media/` folder and packaged with its API build. The frontend keeps the same `/demo-media/<filename>` paths in its database records. A Next.js `beforeFiles` rewrite forwards those requests to the backend origin derived from `NEXT_PUBLIC_API_GRAPHQL_URL`. Set that variable to the deployed backend's HTTPS GraphQL URL before building and starting the frontend. Deploy the backend's bundled media folder with the API. The backend folder is the only project copy of these images; local demo seed scripts also use that folder. Creator-uploaded files use the separate backend `uploads/` directory and still need persistent storage on the deployment host.

See [the October 8 project review](docs/PROJECT_REVIEW_2026-10-08.md) for the applied account/chat batch, unfinished work, suggested features and maintenance plan.
