# Pending approval badge — 10 October 2026

The admin navigation and Content approval header display the protected backend PENDING count. One query refreshes every 30 seconds. Review decisions refetch the count immediately. Empty/error counts are hidden, and the count is independent of the queue filter and 100-row list limit. The accessible label is translated into English, Korean and Uzbek.

Verification: frontend typecheck, lint, contract validation (111 operations), and Prettier checks passed. Backend content-review integration tests (six), typecheck, lint and Prettier passed. Desktop and 390px mobile previews used the actual frontend and API with a disposable MongoDB and disposable admin credentials; the count automatically decreased from 3 to 2 and disappeared at zero. Fixed the existing mobile span-hiding rule to preserve the badge. No live account or submission was changed.
