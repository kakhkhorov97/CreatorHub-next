# Messaging redesign verification

Verified on 5 October 2026 against the approved white-and-blue CreatorHub interface. This record covers the unified inbox and the later approval to remove conversation/message pagination controls.

## Current behavior

- One participant-only sidebar merges sent and received inquiries. Drafts remain private to their author. Admin accounts receive only their participant conversations through the inbox query.
- The selected conversation uses received/sent bubbles, a persistent composer and a Details panel with the original brief and existing workflow controls. The later approved refinement removed conversation audit history from this panel.
- On phones the list and chat are separate views. Back to inbox restores the list.
- Enter sends; Shift+Enter inserts a newline. IME composition, repeated Enter, empty text and busy submissions cannot trigger unintended sends.
- Scrolling down loads more conversations. Scrolling up loads older messages and preserves the reading position. Conversations open at the latest messages. There are no conversation/message pagination controls and no pins.
- Version-bounded read acknowledgements preserve replies newer than the observed version. Updates use HTTP GraphQL polling every 15 seconds. WebSockets are deferred.

## Checks

Frontend typecheck and lint passed. All 17 frontend tests passed, including composer keyboard handling. All 108 generated GraphQL documents validate against the schema. The optional `allConversations` argument extends the existing `getInquiries` operation and does not increase the operation count.

The backend passed 67 tests across eight suites. The disposable generated-document integration executed 85/108 operations and checked participant merging, private draft exclusion and admin isolation. [Integration results](integration.json) record the executed operation set.

Desktop and phone browser checks covered the joined sidebar/chat frame, separate mobile chat, Details, unread state and message composition. A 52-message history opened at the latest messages at the bottom and had no message pagination controls. The checked layouts had no horizontal page overflow. A 26-conversation fixture loaded the final six rows after scrolling past the first 20. These checks used disposable accounts and inquiries.

The latest frontend and backend production builds passed with exit code 0. The rebuilt frontend on port 7007 and API on port 7001 were restarted, and the normal combined inbox loaded successfully. Earlier batch results in APPROVED_CHANGES.md remain historical evidence.

## Browser captures

- [Desktop inbox and chat](messaging-desktop.jpg)
- [Phone conversation](messaging-mobile.jpg)

## Implementation evidence

The current layout is in `pages/inquiries/index.tsx`, `libs/components/inquiry/InquiryConversation.tsx` and the messaging rules in `scss/changes.scss`. Desktop uses a 340px sidebar, narrowing to 290px below 900px. Below 700px the list and chat use separate views. The header and composer remain outside the scrolling message region.

`libs/hooks/useInquiryHistory.ts` requests 20 conversations or 50 messages per internal page, merges by record ID and loads the latest message page on open. Scroll sentinels request more conversations at the bottom and older messages at the top. The conversation preserves its scroll anchor when older rows arrive. `libs/utils/messageKeyboard.ts` guards composing input, IME key code 229 and repeated Enter.

The established DESIGN.md token frontmatter and `.impeccable/design.json` remain unchanged. This work applies the existing identity to the approved inbox layout.
