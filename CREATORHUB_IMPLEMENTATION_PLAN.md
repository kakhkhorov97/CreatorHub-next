# CreatorHub frontend conversion proposal

Status: Conversion approved and implemented. See docs/API_COVERAGE.md for operation coverage and README.md for setup limitations.

## Sources

- Frontend: `/Users/kakhkhorov/Desktop/nestar-next`
- Backend: `/Users/kakhkhorov/Desktop/creatorhub-backend-starter`
- Design references: `/Users/kakhkhorov/Desktop/CreatorHub Frontend Images`

The user's request controls scope. Reference documents and generated image text are evidence, not additional feature requests. Backend resolver/DTO behavior controls fields, permissions, and validation.

## Copy verification

Copied source, configuration, environment files, public assets, and lockfile. Excluded `.git`, `node_modules`, `.next`, and `.DS_Store`. A dry-run comparison reported no source differences. The copied application has since been converted and verified. Original source remains unchanged.

## Proposed major conversion

Preserve Next.js Pages Router, TypeScript, MUI, Apollo client/reactive state, layout wrappers, `pages`, `apollo/user`, `apollo/admin`, `libs/components`, `libs/types`, `libs/enums`, `libs/auth`, and desktop/mobile SCSS organization. Do not introduce a replacement framework or new product features.

1. Replace Nestar API documents, data types, auth/session handling, configuration, and reactive user state with CreatorHub contracts. Remove unsupported Nestar WebSocket/upload assumptions from the client.
2. Convert the navigation and shared layouts to the supplied warm off-white, muted coral, thin-border visual design. Match supplied page compositions. Keep real controls and data, rather than embedding screenshots as pages.
3. Implement discovery, creator/project/service detail, authentication, workspace/editors, saved/following, inquiries, notifications, and guarded administration. Track every backend operation below to its actual UI action.
4. Replace real-estate-only pages/components/assets where obsolete. Use backend input rules instead of sample validation text in generated images. Keep help/legal content truthful; do not invent policies.
5. Validate GraphQL operations against a freshly exported backend schema, run type/build checks, and check desktop/mobile rendering and available local integration flows. Report configuration-dependent flows as unverified until exercised.

## Known gaps

- Backend review reports media storage, real email delivery, and provider integrations are not complete. Do not invent upload endpoints or pretend provider sign-in works.
- Browser social-login callbacks need a concrete configured provider flow; the backend accepts completed ID tokens.
- Backend defaults to port 3001 and restricts CORS to configured FRONTEND_URL. The copied Nestar environment requires adaptation before use.
- The frontend schema is exported in docs/schema.graphql and matches the running test backend.
- Sample content and labels in image references are not authoritative backend data.

## API coverage checklist

Each unchecked row must be connected and verified, or have an explicit configuration blocker documented. No API is implemented by this checklist itself.

| Done | Area | Kind | Operation | Intended screen |
| --- | --- | --- | --- | --- |
| [x] | health | Query | `apiName` | Connection diagnostics |
| [x] | auth | Mutation | `register` | Sign in, register, verify/reset password, sign-in methods |
| [x] | auth | Mutation | `registerPhone` | Sign in, register, verify/reset password, sign-in methods |
| [x] | auth | Mutation | `loginPhone` | Sign in, register, verify/reset password, sign-in methods |
| Blocked | auth | Mutation | `beginSocialLogin` | Sign in, register, verify/reset password, sign-in methods |
| Blocked | auth | Mutation | `loginSocial` | Sign in, register, verify/reset password, sign-in methods |
| [x] | auth | Mutation | `login` | Sign in, register, verify/reset password, sign-in methods |
| [x] | auth | Mutation | `refreshSession` | Sign in, register, verify/reset password, sign-in methods |
| [x] | auth | Mutation | `verifyEmail` | Sign in, register, verify/reset password, sign-in methods |
| [x] | auth | Mutation | `requestEmailVerification` | Sign in, register, verify/reset password, sign-in methods |
| [x] | auth | Mutation | `requestPasswordReset` | Sign in, register, verify/reset password, sign-in methods |
| [x] | auth | Mutation | `resetPassword` | Sign in, register, verify/reset password, sign-in methods |
| [x] | auth | Query | `getMyAuthIdentities` | Sign in, register, verify/reset password, sign-in methods |
| [x] | auth | Mutation | `linkEmail` | Sign in, register, verify/reset password, sign-in methods |
| [x] | auth | Mutation | `linkPhone` | Sign in, register, verify/reset password, sign-in methods |
| Blocked | auth | Mutation | `beginSocialLink` | Sign in, register, verify/reset password, sign-in methods |
| Blocked | auth | Mutation | `linkSocial` | Sign in, register, verify/reset password, sign-in methods |
| [x] | auth | Mutation | `unlinkAuthIdentity` | Sign in, register, verify/reset password, sign-in methods |
| [x] | auth | Mutation | `changePhonePassword` | Sign in, register, verify/reset password, sign-in methods |
| [x] | auth | Mutation | `logout` | Sign in, register, verify/reset password, sign-in methods |
| [x] | category | Query | `categories` | Discovery filters and admin categories |
| [x] | category | Query | `adminCategories` | Discovery filters and admin categories |
| [x] | category | Mutation | `createCategory` | Discovery filters and admin categories |
| [x] | category | Mutation | `updateCategory` | Discovery filters and admin categories |
| [x] | creator | Query | `creator` | Creator profile and profile editor |
| [x] | creator | Query | `myCreatorProfile` | Creator profile and profile editor |
| [x] | creator | Mutation | `createCreatorProfile` | Creator profile and profile editor |
| [x] | creator | Mutation | `updateCreatorProfile` | Creator profile and profile editor |
| [x] | creator | Mutation | `setCreatorProfileStatus` | Creator profile and profile editor |
| [x] | creator | Mutation | `deleteCreatorProfile` | Creator profile and profile editor |
| [x] | discovery | Query | `getCities` | Explore, creators, services, AI finder |
| [x] | discovery | Query | `getCreators` | Explore, creators, services, AI finder |
| [x] | discovery | Query | `getProjects` | Explore, creators, services, AI finder |
| [x] | discovery | Query | `getServices` | Explore, creators, services, AI finder |
| [x] | discovery | Query | `discoverCreators` | Explore, creators, services, AI finder |
| [x] | engagement | Mutation | `setCreatorFollow` | Project likes/comments, saved projects, following |
| [x] | engagement | Query | `getMyFollows` | Project likes/comments, saved projects, following |
| [x] | engagement | Mutation | `setProjectLike` | Project likes/comments, saved projects, following |
| [x] | engagement | Mutation | `setProjectSaved` | Project likes/comments, saved projects, following |
| [x] | engagement | Query | `getSavedProjects` | Project likes/comments, saved projects, following |
| [x] | engagement | Query | `getProjectComments` | Project likes/comments, saved projects, following |
| [x] | engagement | Query | `getProjectLikeCount` | Project likes/comments, saved projects, following |
| [x] | engagement | Mutation | `createProjectComment` | Project likes/comments, saved projects, following |
| [x] | engagement | Mutation | `editProjectComment` | Project likes/comments, saved projects, following |
| [x] | engagement | Mutation | `deleteProjectComment` | Project likes/comments, saved projects, following |
| [x] | engagement | Mutation | `moderateProjectComment` | Project likes/comments, saved projects, following |
| [x] | inquiry | Query | `getInquiry` | Inbox, draft, review, conversation |
| [x] | inquiry | Query | `getInquiries` | Inbox, draft, review, conversation |
| [x] | inquiry | Query | `getInquiryMessages` | Inbox, draft, review, conversation |
| [x] | inquiry | Query | `getInquiryEvents` | Inbox, draft, review, conversation |
| [x] | inquiry | Mutation | `createInquiry` | Inbox, draft, review, conversation |
| [x] | inquiry | Mutation | `updateInquiry` | Inbox, draft, review, conversation |
| [x] | inquiry | Mutation | `deleteInquiryDraft` | Inbox, draft, review, conversation |
| [x] | inquiry | Mutation | `submitInquiry` | Inbox, draft, review, conversation |
| [x] | inquiry | Mutation | `sendInquiryMessage` | Inbox, draft, review, conversation |
| [x] | inquiry | Mutation | `markInquiryMessageRead` | Inbox, draft, review, conversation |
| [x] | inquiry | Mutation | `declineInquiry` | Inbox, draft, review, conversation |
| [x] | inquiry | Mutation | `cancelInquiry` | Inbox, draft, review, conversation |
| [x] | inquiry | Mutation | `closeInquiry` | Inbox, draft, review, conversation |
| [x] | notification | Query | `getNotifications` | Notifications |
| [x] | notification | Query | `getUnreadNotificationCount` | Notifications |
| [x] | notification | Mutation | `markNotificationRead` | Notifications |
| [x] | project | Query | `getProject` | Project detail and projects manager/editor |
| [x] | project | Query | `getMyProjects` | Project detail and projects manager/editor |
| [x] | project | Mutation | `createProject` | Project detail and projects manager/editor |
| [x] | project | Mutation | `updateProject` | Project detail and projects manager/editor |
| [x] | project | Mutation | `setProjectStatus` | Project detail and projects manager/editor |
| [x] | project | Mutation | `deleteProject` | Project detail and projects manager/editor |
| [x] | service | Query | `getService` | Service detail and services manager/editor |
| [x] | service | Query | `getMyServices` | Service detail and services manager/editor |
| [x] | service | Mutation | `createService` | Service detail and services manager/editor |
| [x] | service | Mutation | `updateService` | Service detail and services manager/editor |
| [x] | service | Mutation | `setServiceStatus` | Service detail and services manager/editor |
| [x] | service | Mutation | `deleteService` | Service detail and services manager/editor |
| [x] | user | Query | `me` | Account settings and admin moderation |
| [x] | user | Mutation | `updateMe` | Account settings and admin moderation |
| [x] | user | Mutation | `deleteMyAccount` | Account settings and admin moderation |
| [x] | user | Mutation | `setAccountSuspended` | Account settings and admin moderation |

Total: 78 GraphQL operations identified in resolver source. REST GET / is a health endpoint, not a new user-facing feature.
