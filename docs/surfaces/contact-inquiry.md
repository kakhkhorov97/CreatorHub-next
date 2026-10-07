# First inquiry dialog

This document records the October 7 first-inquiry redesign based on the user's Contact Creator screenshot. The approved scope is the inquiry dialog and removal of the budget filter from creator discovery. The creator profile keeps its existing implementation.

## Relationship to the design system

The dialog extends the existing white-and-blue interface in `DESIGN.md`. It uses the shared paper, ink, muted, line and primary-action colors, the current font stack, visible form labels and blue keyboard focus.

The dialog has local geometry and depth. Its desktop shell has 16px corners and a shadow over a dark translucent backdrop. Fields and the Send Inquiry button have 9px corners. These are dialog-specific choices from the supplied reference, not changes to the shared 5px control corners or flat-frame rule. The root `DESIGN.md` and `.impeccable/design.json` remain unchanged.

## Content and behavior

- The heading names the task. The recipient row shows the creator's avatar and name, with a profile link that opens in another tab.
- Service Selection supports a general inquiry and the creator's existing services. A service ID supplied in the route selects that service initially.
- Your Inquiry Message is required and accepts 20 to 10,000 characters. The optional preferred deadline sits in a disclosure below it.
- Estimated Budget has optional minimum and maximum inputs in KRW. Each accepts whole numbers from zero to 1,000,000,000. Submission reports an error when both values exist and the maximum is below the minimum.
- Send Inquiry uses the existing `sendInquiry` mutation. It retains the client request key, sends the brief and optional service, budget and deadline values, and opens the resulting inquiry in the Inbox.
- Cancel, Escape, the close button and a backdrop click dismiss to the creator profile. Dismissal is blocked while submission is pending. The native modal dialog supplies modal focus behavior; the component also locks body scrolling and restores the previous scroll setting and focus on cleanup.
- Service-loading failures have a retry control. Submission errors appear in the dialog. Creators marked unavailable cannot receive an inquiry through the submit action.
- The form has English, Korean and Uzbek copy. The footer describes delivery to the private inbox without a response-time promise. Attachments are outside this dialog's scope.

## Responsive layout

The desktop dialog is at most 640px wide, with 20px viewport clearance on either side and a maximum height that leaves 48px of vertical clearance. Its contents scroll when needed. The budget range and Send Inquiry action share the bottom row.

At 600px and below, the dialog leaves 12px clearance on each side, uses 12px shell corners and 20px form insets, and stacks the budget range above the send action. The title changes from 28px to 24px. The content entrance moves upward by 8px over 180ms only when reduced motion is not requested.

## Discovery budget filter

Creator discovery has no budget input and does not send a budget filter. Service discovery retains its maximum-budget input and filter. This distinction lives in `libs/components/discovery/SearchFilters.tsx`.

## Implementation and review evidence

- `libs/components/inquiry/ContactCreator.tsx` owns dialog content, dismissal and submission.
- `pages/inquiries/new.tsx` resolves the recipient and supplies the profile dismissal destination.
- `scss/creator-contact.scss` owns the local dialog styles and responsive rules.
- `.impeccable/review/contact-inquiry/desktop.png` records the 1440 by 900 view.
- `.impeccable/review/contact-inquiry/mobile.png` records the 390 by 844 view.

The finish review disposition is ship, with no material fixes. Detector evidence is unavailable because its engine/cache was missing. No new raster assets were added. This document records the narrow extension; it does not refresh the global design system or repair pre-existing documentation drift.
