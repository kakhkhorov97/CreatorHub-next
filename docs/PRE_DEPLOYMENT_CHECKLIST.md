# CreatorHub pre-deployment checklist


## Shared account across browser tabs — deferred by owner, 10 October 2026

Keep the current independent per-tab sessions during testing so multiple accounts can be tested together. Before deployment, remind the owner and obtain approval to share a single signed-in account across tabs in the same browser profile. New tabs should inherit the account, logout/account switching should synchronize, account-specific caches should clear, and concurrent token refresh must be coordinated across tabs. Separate browser profiles and incognito sessions remain independent. This is a reminder, not authorization to implement now.
