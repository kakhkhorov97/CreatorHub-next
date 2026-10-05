# Backend operation coverage

All 108 generated GraphQL documents validate against the backend schema. The current disposable generated-document workflow executes 85 operations, including all three manual review APIs. The event and admin rows below also retain evidence from earlier dedicated checks; they do not claim every operation was rerun in this batch. Four social flows need configured providers, and the two upload operations remain outside these frontend integration runs. Checked rows indicate API execution, not complete browser coverage.

| API tested | Area | Kind | Operation | Screen |
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
| [x] | inquiry | Query | `getInquiry` | Unified inbox, retained drafts, conversation and Details |
| [x] | inquiry | Query | `getInquiries` | Unified inbox, retained drafts, conversation and Details |
| [x] | inquiry | Query | `getInquiryMessages` | Unified inbox, retained drafts, conversation and Details |
| [x] | inquiry | Query | `getInquiryEvents` | Unified inbox, retained drafts, conversation and Details |
| [x] | inquiry | Mutation | `createInquiry` | Unified inbox, retained drafts, conversation and Details |
| [x] | inquiry | Mutation | `updateInquiry` | Unified inbox, retained drafts, conversation and Details |
| [x] | inquiry | Mutation | `deleteInquiryDraft` | Unified inbox, retained drafts, conversation and Details |
| [x] | inquiry | Mutation | `submitInquiry` | Unified inbox, retained drafts, conversation and Details |
| [x] | inquiry | Mutation | `sendInquiryMessage` | Unified inbox, retained drafts, conversation and Details |
| [x] | inquiry | Mutation | `markInquiryMessageRead` | Unified inbox, retained drafts, conversation and Details |
| [x] | inquiry | Mutation | `declineInquiry` | Unified inbox, retained drafts, conversation and Details |
| [x] | inquiry | Mutation | `cancelInquiry` | Unified inbox, retained drafts, conversation and Details |
| [x] | inquiry | Mutation | `closeInquiry` | Unified inbox, retained drafts, conversation and Details |
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
| [x] | media/likes | Query | `getMyProjectLike` | Project heart state |
| Not tested | media/likes | Mutation | `imageUploader` | No upload UI |
| Not tested | media/likes | Mutation | `imagesUploader` | No upload UI |

## Public creative events

All five new operations passed the real-resolver community checks in docs/verification/community.json.

| API tested | Area | Kind | Operation | Screen |
| --- | --- | --- | --- | --- |
| [x] | event | Query | `getEvents` | Homepage and Events directory |
| [x] | event | Query | `getEvent` | Event detail |
| [x] | event | Query | `adminEvents` | Admin events |
| [x] | event | Mutation | `createEvent` | Admin event editor |
| [x] | event | Mutation | `updateEvent` | Admin event editor |

The community checks also verified getProjects actual-like sorting, publication tie-breaks, exclusion of Popular IDs from Recently added, and bounded identifier validation.

| [x] | admin | Query | `adminOverview` | Dedicated administration / saved public copy |
| [x] | admin | Query | `adminDirectory` | Dedicated administration / saved public copy |
| [x] | admin | Query | `getSiteContent` | Dedicated administration / saved public copy |
| [x] | admin | Mutation | `adminUpdateUser` | Dedicated administration / saved public copy |
| [x] | admin | Mutation | `adminSetUserStatus` | Dedicated administration / saved public copy |
| [x] | admin | Mutation | `adminUpdateCreator` | Dedicated administration / saved public copy |
| [x] | admin | Mutation | `adminCreateProject` | Dedicated administration / saved public copy |
| [x] | admin | Mutation | `adminUpdateProject` | Dedicated administration / saved public copy |
| [x] | admin | Mutation | `adminCreateService` | Dedicated administration / saved public copy |
| [x] | admin | Mutation | `adminUpdateService` | Dedicated administration / saved public copy |
| [x] | admin | Mutation | `adminSetRemoved` | Dedicated administration / saved public copy |
| [x] | admin | Mutation | `adminUpdateSiteContent` | Dedicated administration / saved public copy |
| [x] | review | Query | `myContentReviews` | Owner submission status and preview |
| [x] | review | Query | `adminContentReviews` | Admin content approval queue |
| [x] | review | Mutation | `adminDecideContentReview` | Approve/reject a submitted revision |


| API tested | Area | Kind | Operation | Screen |
| --- | --- | --- | --- | --- |
| [x] | inquiry | Mutation | `sendInquiry` | Direct inquiry form |
| [x] | inquiry | Mutation | `completeInquiry` | Completed engagement confirmation |
| [x] | feedback | Mutation | `createServiceFeedback` | Customer review form |
| [x] | feedback | Query | `getInquiryFeedback` | Private inquiry feedback |
| [x] | feedback | Query | `getCreatorFeedback` | Creator profile Reviews tab |
| [x] | inquiry | Query | `getUnreadInquiryCount` | Inbox unread conversation badge |
| [x] | inquiry | Mutation | `markInquiryRead` | Version-bounded reading of incoming inquiry events |

## Messaging refinement, 5 October 2026

`getInquiries` now accepts optional `allConversations: Boolean = false`. The inbox requests `true` to merge participant sent and received conversations. Existing callers retain their directional behavior. Private drafts stay with their author, and an administrator receives only their own participant conversations through this inbox query. This adds an argument to an existing operation, so the generated-document count remains 108.

The disposable integration executed 85/108 operations and checked unified participant merging, draft privacy and admin isolation. All 108 documents validate against the schema. Conversation and message loading continue to use the existing paged HTTP queries internally; the interface loads more records on scroll. HTTP polling remains at 15 seconds. WebSockets are deferred. See [messaging verification](verification/messaging-redesign.md).
