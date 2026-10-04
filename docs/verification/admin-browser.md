# Administration browser checks

Verified the local production build on port 7007 with the disposable backend on 7001.

- Anonymous access presents administrator sign-in. Normal-user access shows the administrator-only rejection.
- Administrator sign-in without a return path lands at /_admin.
- Project directory displays real rows; Manage opens the selected record. Saving a retained seeded project succeeds without replacing its image. The loaded category now displays Editorial design instead of a blank selection. Back returns to the directory.
- Remove opens an explicit confirmation; Keep it cancels.
- Mobile account search for Mina returns one matching account. Manage opens her role/account form.
- Website content form saves successfully. Public homepage retains the saved heading/subheading and approved design.
- Dashboard, directory and editor captures include 1440px desktop, 930px user width and 390px phone. Main document has no horizontal overflow at 930px or 390px; wide tables scroll inside the panel.
- Mobile drawer moves focus to its close button, hides background controls, and Escape closes it and returns focus to the menu button.

API coverage is separate from browser coverage. Every new protected API rejects anonymous and non-admin calls in scripts/check-admin.cjs.

Final review corrections were verified in one confirmation round. Category Edit at 930px scrolls the form into view and focuses Name; New category at 390px does the same. Reused category/event tables now use the administration palette, and event states use the shared status chip. The repeated heading eyebrow was removed. Final overview screenshots were captured at 1440px and 390px in a separate test tab; the phone document width remained 390px. Temporary viewport overrides were reset.

The independent reviewer's disposition is ship for the three scored fixes, all resolved. See admin-review.md. This verdict is limited to those fixes. The local design launcher/detector was unavailable; no detector clearance is claimed.
