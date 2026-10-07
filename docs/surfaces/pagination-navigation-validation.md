# Pagination, navigation and inquiry validation

This document records the approved October 7 extension to page navigation and first-inquiry validation. It preserves the white-and-blue interface described in `DESIGN.md`, the product behavior in `PRODUCT.md`, and the dialog geometry recorded in `docs/surfaces/contact-inquiry.md`. It does not change `DESIGN.md` or `.impeccable/design.json`.

## Comparison with the existing interface

Events, event details and Contact retain the main navigation links. They have no discovery search or category rail. This implements the route distinction already recorded in `PRODUCT.md`; it does not introduce another header design. Discovery and task-focused headers retain their existing route roles.

The existing Previous and Next buttons retain their labels, secondary styling and disabled states. Next now checks whether the requested page contains records before advancing. Empty responses and request failures leave the current records and scroll position in place. Successful navigation returns to the top as before.

The first-inquiry dialog retains its existing recipient, service selection, optional deadline, budget fields and immediate-send behavior. Message validation now uses visible inline feedback in place of the browser validation popup. Attachments remain outside the dialog's scope.

## Checked page advancement

`libs/hooks/usePageAdvance.ts` owns the shared check, request lock and checking, end-of-results and error states. It ignores results from a check whose route or filter context has changed. An empty next page shows "No more results" and disables further advancement in that context. A failed check shows an inline error and leaves Next available for retry. A context change clears the end and error states.

`libs/hooks/usePaged.ts` requests the next page with the current query and filters using a network-only check. It changes the offset only after a nonempty response. Pages that use the shared paged hook inherit this behavior. The separate administration directory uses the same checker in `libs/components/admin/ContentDirectory.tsx`.

`libs/components/common/Display.tsx` renders the shared page controls and notices. Checking and end notices use `role="status"`; failed checks use `role="alert"`. Pending checks disable the page controls. The administration directory renders equivalent notices alongside its existing controls. These states use the existing muted text and red error treatment rather than new design tokens.

## First-inquiry message feedback

`libs/components/inquiry/ContactCreator.tsx` requires at least 20 characters after trimming surrounding whitespace. Blank, short and whitespace-only messages cannot send. Blur, a native invalid event or a rejected submit reveals "Please enter at least 20 characters." The error clears when the trimmed message reaches the minimum.

The textarea retains `required`, `minLength={20}` and `maxLength={10000}`. Its visible counter shows the raw entered length against 10,000; the minimum and submitted brief use the trimmed value. `aria-invalid` identifies the invalid field, and `aria-describedby` connects it to the feedback and counter. Feedback uses a polite live region. Invalid submission focuses the message field and suppresses the native popup.

`scss/creator-contact.scss` supplies the local red invalid border, focus outline and error text. Existing dialog layout, type and field geometry remain in effect.

## Implementation and review evidence

The evidence directory is `.impeccable/review/pagination-validation/`. It contains `desktop.png`, `mobile.png`, `contact-desktop.png`, the refreshed `contact-mobile.png`, the new `services-mobile.png` and `pagination.png`. A fresh reviewer confirmed that restoration of the original responsive selector specificity resolved the sole responsive finding and returned a ship disposition for that fix's scope.

The root browser session verified that blank, short and whitespace-only inquiry messages block submission, and that a valid-length message clears the inline error. Twenty whitespace characters produced `aria-invalid="true"`; a corrected 48-character brief produced `aria-invalid="false"`. On the Services page, an empty Next check from page 2 showed "No more results", retained all 12 visible records and preserved a scroll position of 1305.5 pixels instead of returning to the top. `pagination.png` records that state. Source inspection establishes the shared check for paged lists and the administration directory. It does not establish individual browser coverage for every protected page.

The reported verification run passed 26 unit tests, the final production build after the responsive CSS correction, integration checks 85 through 108, and the socket checks. Detector evidence is unavailable because its engine exited with code 127. The regular API on port 7001 and frontend on port 7007 were restored, the test account was signed out, and the disposable API was stopped after validation.

The incumbent design artifacts contain earlier navigation descriptions alongside later approved refinements. This document records the local route behavior without reconciling that pre-existing documentation drift or turning local validation styles into global rules.
