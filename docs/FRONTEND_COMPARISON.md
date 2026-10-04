# CreatorHub frontend comparison

Reviewed on October 3, 2026.

Reference: `/Users/kakhkhorov/Desktop/nestar-next`.
Target: `/Users/kakhkhorov/Desktop/CreatorHUb-FrontEnd`.
Business-rule reference: the current source in `/Users/kakhkhorov/Desktop/creatorhub-backend-starter`.

## Completed, approved cleanup

Applied the installed Prettier 2.7.1 and existing configuration to eight files: pages/index.tsx; discovery Cards, Discovery, HomeSections, LikeButton; layout LayoutBasic; mobile and desktop main.scss. No architecture or business-rule fixes have been applied.

Prettier passes for pages, libs, apollo, and scss. Comparing emitted JavaScript syntax trees before and after formatting, ignoring redundant parentheses, confirms equivalent JavaScript structure for all six formatted TSX files. Original files are backed up in `/private/tmp/creatorhub-frontend-before-prettier`.

The nestar-next reference was not edited. Its existing changes were preserved.

## Differences and proposed decisions

### 1. Repair backend compatibility and business-rule handling

**Pagination is incompatible.** Nestar uses page/limit and list/metaCounter. CreatorHub still sends offset/limit and reads arrays. The updated backend uses page/limit and list/metaCounter. Validating the frontend documents against a schema freshly exported from backend source rejects 12 operations:

getCreators, getProjects, getServices, getMyFollows, getSavedProjects, getProjectComments, getInquiries, getInquiryMessages, getInquiryEvents, getNotifications, getMyProjects, getMyServices.

Affected code includes `libs/hooks/usePaged.ts`, `useMembership.ts`, `useOwnedItem.ts`, `useCreatorDirectory.ts`, and direct list consumers in discovery, workspace, account collections, and inquiries. Fixing only the pagination hook would leave these other consumers broken.

Proposed fix: refresh the schema and operation types, convert all affected consumers to page/limit and list/metaCounter, and calculate whether another page exists from the total count. Preserve ordinary arrays for APIs that still return arrays.

**Contract checks can falsely pass.** `scripts/check-contract.cjs` validates against the frontend's stored schema only. It reports 78 valid documents even though 12 do not match current backend source. The backend's stored docs/schema.graphql is also stale: LikeResolver already defines getMyProjectLike, but the stored schema omits it. The frontend LikeButton calls that missing generated query, causing two TypeScript errors.

Proposed fix: export the current backend schema, synchronize the frontend contract, generate getMyProjectLike and upload documents, and add a repeatable comparison against current backend source or its freshly exported contract. Keep live introspection as an optional check when a server is running. No new like API is needed.

**Local uploads are absent.** Nestar uses apollo-upload-client. CreatorHub uses HttpLink, although apollo-upload-client is still installed. Settings and portfolio forms require URLs and say direct uploads are unavailable. Neither imageUploader nor imagesUploader has a frontend document. `safeUrl` in common/UI.tsx accepts HTTPS only, so local HTTP upload URLs cannot display through Picture.

Proposed fix: use the existing upload package, retain CreatorHub's refresh-token authentication link, merge existing request headers, add avatar and project file controls, and display URLs from the configured upload origin. Match backend file types, ten-file limit, and 10 MB limit. Continue to validate URLs and do not permit arbitrary schemes. Service thumbnails remain outside the current product scope.

**Creator permissions do not match the backend.** Guard checks login and optional admin access only. ContentEditor allows editing when a profile exists, including a draft profile owned by a USER. The backend project and service management APIs require CREATOR or ADMIN. Backend profile publication promotes USER to CREATOR. ProfileEditor already refreshes me after publication.

Proposed fix: guard project/service management and their actions with the same roles, show a clear path to publish a profile, and keep profile setup accessible to ordinary users. Preserve backend rules for publication, ownership, active accounts, visibility, and inquiry transitions.

### 2. Restore familiar Nestar code organization

**Layouts changed.** Nestar uses withLayoutBasic and other layout wrappers, separate Top and Footer components, and useDeviceDetect. CreatorHub uses one Layout component, inline navigation/footer/sidebar, and CSS breakpoints. Both still use Next Pages Router.

Proposed fix: restore named layout wrappers and separate Top, Footer, and workspace/admin navigation components. Restore the familiar device hook where useful while retaining CreatorHub's current responsive appearance. Do not restore Chat or WebSockets.

**Shared API calls changed.** Nestar components call useQuery/useMutation with named GraphQL constants. CreatorHub dispatches operations by string through useApi/useAction and combines all documents into a registry.

Proposed fix: use explicit named query/mutation constants and direct Apollo hooks for shared account, discovery, profile, content management, likes, follows, saves, and comments. Keep reusable helpers only where they reduce repeated logic. Preserve mutation locking, session refresh, error feedback, and retries.

**Types changed.** Nestar has domain folders with model, input, and update files and separate enum files. CreatorHub combines models, inputs, operation mappings, and enum unions in generated creatorhub.ts files.

Proposed fix: split types and enums by CreatorHub domain in the Nestar style. Keep contract generation and validation compatible with the split output so regeneration cannot undo the organization.

**Components became large aggregate files.** Examples include Inquiries.tsx at 567 lines, Details.tsx at 413 lines, combined account pages, and shared UI.tsx containing controls, display helpers, dialogs, and formatting utilities.

Proposed fix: split components by screen and responsibility. Keep page wrappers small. Separate forms, list cards, filters, detail sections, confirmation dialogs, and utility functions. Keep new inquiries and notifications in their own domain folders.

**UI package usage changed even though packages did not.** Nestar uses MUI components and SweetAlert2 helpers throughout shared screens. CreatorHub retains the MUI provider but often uses native controls and custom Confirm/Feedback components.

Proposed fix: restore familiar MUI controls and SweetAlert2 helpers for appropriate shared interactions. Keep inline field errors and accessible loading/error states. Preserve CreatorHub styling and new workflows.

### 3. Decide whether to restore localization

Nestar wraps its app in appWithTranslation and uses translation hooks. CreatorHub removed the provider and largely hardcodes English, although next-i18next, i18next, and react-i18next are still declared and user types still include preferredLocale.

Recommendation: restore the Nestar translation setup and translate shared screens first, followed by CreatorHub-specific screens. This is a separate user-facing decision and requires approval.

## Keep these CreatorHub differences

Refresh-token rotation, session checks, safe return paths, current-user loading, and role updates support CreatorHub's backend and should remain. Copying Nestar's access-token-only login behavior would lose those requirements.

Private inquiries, notifications, creator publication, project/service status workflows, categories, and moderation are CreatorHub domain behavior. Organize them consistently with Nestar without replacing their rules with property-marketplace rules.

Keep views/history, rankings, public follower/following lists, profile likes, board articles, and WebSockets removed, as previously requested.

Both declared dependencies and devDependencies match nestar-next exactly, including version ranges. No frontend package replacements were found. Some inherited dependencies may now be unused; do not remove or upgrade them during this alignment without further approval.

## Verification and limits

- Prettier check passed for the four source/style folders.
- Five session tests passed, including refresh concurrency, logout during refresh, invalid refresh, and safe redirects.
- TypeScript check failed with two existing errors in LikeButton around missing getMyProjectLike generated types. Formatting preserved that code's JavaScript structure.
- Existing local contract check passed for 78 operations, but fresh backend-source validation rejected the 12 paginated documents and found three missing operations: getMyProjectLike, imageUploader, imagesUploader.
- Backend schema was exported to a temporary directory for this review without editing backend source or stored contracts.
- No browser, full build, running-server integration, or live database checks were performed. This is a source and contract review, not a claim that every screen works.

Project documentation was treated as reference material. Its architecture claims and historical verification records were not treated as authorization or as fresh test results.

## Approval boundary

Only formatting was applied. Items 1, 2, and 3 above await the user's decision. The project's AGENTS.md states: "Approval covers only the changes described. Ask again for additional changes." The original request also asked to review differences and seek approval before changing them.
