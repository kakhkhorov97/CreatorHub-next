# CreatorHub frontend

CreatorHub is a portfolio discovery website for finding creators, exploring projects and services, and starting private project inquiries. Members can save and like projects, follow creators and write comments. Creators submit their profiles and content for administrator approval.

The frontend adapts the Nestar-next structure with Next.js Pages Router, React, TypeScript, Apollo Client, MUI and SCSS. The backend is a separate NestJS repository.

## Run locally

Use Node.js 22 and npm. Start the backend on port 7001 with a MongoDB replica set before using the website.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:7007. Set `NEXT_PUBLIC_API_GRAPHQL_URL` in `.env.local` to the backend GraphQL endpoint. Environment files containing credentials must remain outside Git.

## Structure

| Path                                          | Purpose                                                            |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `pages/`                                      | Public discovery, account, workspace, administrator and API routes |
| `libs/components/`                            | Components organized by feature                                    |
| `libs/hooks/`                                 | GraphQL access and pagination hooks                                |
| `apollo/`                                     | Client, cache, reactive session state and operation exports        |
| `libs/auth/`                                  | Session refresh and social authentication helpers                  |
| `libs/messaging/`                             | Authenticated inquiry messaging and refresh scheduling             |
| `libs/server/`                                | Server-only assistant retrieval and provider requests              |
| `scss/`                                       | Shared, desktop, mobile and administrator styles                   |
| `tests/`                                      | Automated frontend regression tests                                |
| `docs/schema.graphql`, `docs/operations.json` | GraphQL contracts used by verification scripts                     |

## Accounts and integrations

Email registration requires a name, contact phone number and password. Email confirmation activates email access. Phone numbers are contact details, not login identifiers. Google, Telegram and Kakao sign-in are implemented; each requires provider configuration for the website's actual origin. New social accounts complete their name and contact phone before signup finishes.

Sessions currently use per-tab `sessionStorage`. Access tokens refresh before expiry. Temporary refresh errors preserve saved credentials, and a later request can retry. A failed startup user lookup may require a reload after connectivity recovers. Sharing one account across tabs is a pending deployment decision.

Set public Google and Telegram client IDs using the names in `.env.example`. Kakao uses the backend authorization flow. Keep provider secrets on the backend.

The optional Gemini assistant uses `GEMINI_API_KEY` and `GEMINI_MODEL` on the server. It retrieves curated help and public GraphQL content. The key must never have a `NEXT_PUBLIC_` prefix.

The optional PostHog integration uses a public project token and ingestion host. It records public-page views only. Private routes, account identification, automatic interaction capture and session recordings are excluded.

English, Korean and Uzbek translation files are in `public/locales/`.

## Media and demo content

Creator avatars and project images use authenticated GraphQL uploads and the backend's persistent upload directory. Bundled fictional demo artwork is served by the backend at `/demo-media/`. Next.js forwards these paths to the origin configured by `NEXT_PUBLIC_API_GRAPHQL_URL`.

The app does not seed a database during normal startup. Demo scripts are development tools for disposable preview data. Fictional profiles and generated artwork do not represent real clients or commissions. See [media provenance](docs/MEDIA_PROVENANCE.md).

## Verify changes

```bash
npm test
npm run typecheck
npm run lint
npm run contract:check
npm run build
```

After exporting a new schema from the backend, copy it to `docs/schema.graphql` and run `npm run contract:generate`. Keep the schema and operation files in Git.

For integration and preview tools, set `CREATORHUB_BACKEND_PATH` to the backend checkout. It defaults to a sibling folder named `creatorhub-backend-starter`. Install the backend dependencies first.

`node scripts/integration.cjs` creates a disposable MongoDB replica set. Set `TEST_API_PORT` to an unused port before running it, for example 7003 when the normal API occupies 7001. MongoDB Memory Server downloads its test binary on the first run. `MONGOMS_SYSTEM_BINARY` can select an existing binary. Demo and preview scripts are not deployment commands; inspect their database guards before running them.

## Deployment status

Deployment preparation is in progress. Dependency security upgrades and live social-provider acceptance checks remain pending. Production requires HTTPS, separate development and production databases, verified email delivery and persistent uploads. Configure public environment variables before building, then use `npm run start` to serve the build on port 7007.

On a shared VPS, use separate CreatorHub directories and services, available assigned ports and a domain-specific reverse-proxy configuration. Do not replace another application's configuration or restart its services.
