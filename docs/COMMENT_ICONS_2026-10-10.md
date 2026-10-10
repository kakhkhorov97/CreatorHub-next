# Comment controls, 10 October 2026

Replaced the visible Edit/Delete words with pencil/trash icons on the right of owned project comments. Accessible labels and title tooltips retain action names. Editing and deletion still use the existing APIs and confirmation.

Production build and all 29 frontend tests passed. Desktop 1440px and mobile 390px browser checks covered posting, owner-only visibility, icon-only rendering, right alignment, editing, cancelling deletion and confirming deletion. No page errors or comment overflow. Browser-only comment fixtures were used; no live comments were changed. Screenshots are in docs/verification/comment-icons-2026-10-10.
