# Live inquiry messaging

The browser opens one authenticated Socket.IO connection per signed-in tab to the API origin's `/messaging` namespace using WebSocket transport only. The Engine.IO upgrade endpoint is `/socket.io/` on the API port. The origin is derived from NEXT_PUBLIC_API_GRAPHQL_URL. FRONTEND_URL on the backend must match the browser origin.

## Rooms and events

| Channel | Purpose |
| --- | --- |
| `account:<userId>` | Joined automatically after authentication; receives `inbox:changed` with inquiry ID, kind and version, without message bodies. |
| `inquiry:<inquiryId>` | Joined after active-session and participant checks. Receives `inquiry:changed` with the saved message or read/status invalidation. A tab follows one selected conversation. |

Clients request `inquiry:join`, `inquiry:leave` and `message:send`. Acknowledgements have either `{ ok: true, data }` or `{ ok: false, error: { code, message } }`. Message inputs reuse SendMessageInput, including expectedVersion and clientMessageKey. Retrying the same key/content returns the existing saved message; a reused key with different content is rejected. The existing MongoDB transaction commits before live publication or successful acknowledgement.

Room names are chosen by the server. An account cannot join another account's room. Nonparticipant administrators receive no special chat access. Drafts have no conversation room. Validation, active-account checks, message length limits, request limits and optimistic concurrency apply to WebSocket sends. The backend revalidates the session before actions and private broadcasts. Expiring sockets reauthenticate; revoked/suspended sockets cannot receive private updates.

## Recovery and interface behavior

MongoDB remains authoritative for message history. The conversation list, selected inquiry and loaded message history reload on reconnect or return to the visible page. There is no 15-second messaging poll. Background event invalidations are grouped over 300 ms with one non-overlapping follow-up when updates arrive during a request. Message bodies render immediately, and acknowledged sends/read events do not repeat the same HTTP refresh. Public notifications unrelated to inquiries retain their existing refresh behavior.

Enter sends; Shift+Enter inserts a newline. Sends require a connected channel. Connection interruptions show an inline reconnect status, preserve the draft, and keep the retry key when delivery cannot be confirmed. The draft is not saved across a full browser reload. An expired session must sign in again. Missed server events are recovered from the database rather than relying on temporary socket buffers.

## Deployment

Use HTTPS/WSS publicly. Configure the reverse proxy to forward WebSocket upgrades on `/socket.io/` to the API and allow long-lived connections. Keep FRONTEND_URL set to the actual website origin. No separate chat database is needed.

The current Socket.IO adapter is local to one API process. For multiple API replicas, configure a shared adapter such as the Socket.IO Redis adapter before scaling. Redis would coordinate live room delivery; MongoDB would still store messages. No multi-instance adapter or remote proxy deployment was configured or tested in this batch.

## Verification

`TEST_API_PORT=7019 node scripts/integration.cjs` runs the existing generated-document checks and the real Socket.IO checks against a disposable MongoDB replica set. Set CREATORHUB_BACKEND_PATH when the backend lives elsewhere. The harness uses that backend's configured local MongoDB test binary and never connects to the main database.

The checks cover transport, authentication/origin rejection, room privacy, persistence, read receipts, closure, missed-history recovery, malformed inputs, rollback and sequential/concurrent duplicate sends. Session checks include expiry, reauthentication, revocation and suspension. KEEP_TEST_SERVER=1 is only for disposable browser preview; TEST_FRONTEND_URL must then match the preview origin. Stop it when finished.

Results are recorded in docs/verification/integration.json. Browser proof uses disposable accounts only. Production frontend/API builds and 19 frontend/67 backend tests passed for this batch.
