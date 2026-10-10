---
{
  "name": "CreatorHub",
  "description": "White-and-blue CreatorHub interface based on the approved September 25 references.",
  "colors": {
    "background": "#fdfcfb",
    "paper": "#ffffff",
    "ink": "#0b1020",
    "muted": "#626878",
    "line": "#e5e7eb",
    "white": "#ffffff",
    "field-border": "#c8c3bd",
    "secondary-border": "#bdb9b4",
    "secondary-hover": "#eae6df",
    "focus": "#0859ec",
    "danger": "#a1332a",
    "status-neutral": "#e5e2de",
    "status-neutral-text": "#4c4842",
    "status-active": "#e1e9dd",
    "status-active-text": "#315b35",
    "status-draft": "#f2e4d0",
    "status-draft-text": "#79511b",
    "message": "#f4f2ef",
    "message-mine": "#e2edff",
    "blue": "#0859ec",
    "blue-hover": "#0645bb",
    "like": "#d24b59",
    "inbox-active": "#edf4ff",
    "admin-sidebar": "#111d31",
    "admin-canvas": "#f3f5f9",
    "admin-ink": "#172033",
    "admin-muted": "#576377",
    "admin-line": "#dde3ec",
    "admin-blue": "#1459df",
    "admin-blue-hover": "#1049ba",
    "admin-focus": "#82acff",
    "admin-secondary-ink": "#26364f",
    "admin-control-border": "#cbd4e2",
    "admin-secondary-hover": "#edf2fa",
    "admin-danger": "#b52b31",
    "admin-nav-ink": "#cbd5e6",
    "admin-nav-hover": "#1c2d47",
    "admin-nav-active": "#244985",
    "admin-table-head": "#f7f9fc",
    "admin-row-line": "#e7ebf2",
    "admin-status-neutral": "#eef1f6",
    "admin-status-neutral-text": "#445166",
    "admin-status-active": "#e8f5ed",
    "admin-status-active-text": "#19663d",
    "admin-status-paused": "#fff1d9",
    "admin-status-paused-text": "#805510",
    "admin-status-removed": "#fce8e9",
    "admin-status-removed-text": "#922e35",
    "admin-confirm": "#fff4ef",
    "admin-confirm-border": "#e9c2b0"
  },
  "typography": {
    "headline": {
      "fontSize": "clamp(28px, 2.65vw, 42px)",
      "fontWeight": 700,
      "lineHeight": 1.16,
      "letterSpacing": "-0.025em"
    },
    "title": {
      "fontSize": "22px",
      "fontWeight": 700,
      "lineHeight": 1.3,
      "letterSpacing": "-0.015em"
    },
    "body": {
      "fontFamily": "Arial, Helvetica, sans-serif",
      "fontSize": "15px",
      "fontWeight": 400,
      "lineHeight": 1.5
    },
    "label": {
      "fontSize": "14px",
      "fontWeight": 600
    },
    "caption": {
      "fontSize": "13px",
      "fontWeight": 400
    },
    "hero": {
      "fontSize": "clamp(32px, 3.4vw, 52px)",
      "fontWeight": 700,
      "letterSpacing": "-0.035em",
      "lineHeight": 1.16
    },
    "admin-headline": {
      "fontSize": "28px",
      "fontWeight": 700,
      "lineHeight": 1.22,
      "letterSpacing": "-0.02em"
    },
    "admin-headline-mobile": {
      "fontSize": "24px"
    },
    "admin-title": {
      "fontSize": "18px",
      "fontWeight": 700,
      "lineHeight": 1.35
    },
    "admin-body": {
      "fontFamily": "Arial, Helvetica, sans-serif",
      "fontSize": "14px",
      "lineHeight": 1.5
    },
    "admin-label": {
      "fontSize": "13px",
      "fontWeight": 600
    },
    "admin-table": {
      "fontSize": "12px"
    },
    "admin-count": {
      "fontSize": "32px",
      "fontWeight": 700,
      "lineHeight": 1.5
    }
  },
  "rounded": {
    "small": "4px",
    "control": "5px",
    "panel": "6px",
    "message": "11px",
    "status": "20px",
    "avatar": "50%",
    "card": "7px",
    "search": "36px",
    "filter": "24px",
    "admin-control": "6px",
    "admin-panel": "8px",
    "admin-status": "5px"
  },
  "spacing": {
    "8": "8px",
    "10": "10px",
    "12": "12px",
    "14": "14px",
    "16": "16px",
    "18": "18px",
    "20": "20px",
    "22": "22px",
    "24": "24px",
    "25": "25px",
    "28": "28px",
    "30": "30px",
    "admin-panel": "24px",
    "admin-panel-mobile": "18px",
    "admin-gap": "24px",
    "admin-field-gap": "6px",
    "admin-nav-gap": "5px"
  },
  "components": {
    "button-primary": {
      "backgroundColor": "{colors.blue}",
      "textColor": "{colors.white}",
      "rounded": "{rounded.control}",
      "padding": "10px 24px"
    },
    "button-primary-hover": {
      "backgroundColor": "{colors.blue-hover}",
      "textColor": "{colors.white}"
    },
    "button-secondary": {
      "backgroundColor": "transparent",
      "textColor": "{colors.ink}",
      "rounded": "{rounded.control}",
      "padding": "10px 24px"
    },
    "button-danger": {
      "backgroundColor": "{colors.danger}",
      "textColor": "{colors.white}",
      "rounded": "{rounded.control}",
      "padding": "10px 24px"
    },
    "input": {
      "backgroundColor": "rgba(255, 255, 255, 0.28)",
      "textColor": "{colors.ink}",
      "rounded": "{rounded.control}",
      "padding": "10px 13px"
    },
    "panel": {
      "backgroundColor": "rgba(255, 255, 255, 0.3)",
      "rounded": "{rounded.panel}",
      "padding": "25px"
    },
    "tag": {
      "rounded": "{rounded.status}",
      "padding": "3px 9px",
      "backgroundColor": "#f0f1f3",
      "textColor": "#444b58"
    },
    "navigation": {
      "textColor": "{colors.ink}",
      "padding": "20px 9px 17px"
    },
    "message": {
      "backgroundColor": "{colors.message}",
      "rounded": "{rounded.message}",
      "padding": "16px 18px"
    },
    "admin-button-primary": {
      "backgroundColor": "{colors.admin-blue}",
      "textColor": "{colors.white}",
      "rounded": "{rounded.admin-control}",
      "padding": "9px 14px"
    },
    "admin-button-primary-hover": {
      "backgroundColor": "{colors.admin-blue-hover}"
    },
    "admin-button-secondary": {
      "backgroundColor": "{colors.paper}",
      "textColor": "{colors.admin-secondary-ink}",
      "rounded": "{rounded.admin-control}",
      "padding": "9px 14px"
    },
    "admin-button-danger": {
      "backgroundColor": "{colors.admin-danger}",
      "textColor": "{colors.white}",
      "rounded": "{rounded.admin-control}",
      "padding": "9px 14px"
    },
    "admin-input": {
      "backgroundColor": "{colors.paper}",
      "textColor": "{colors.admin-ink}",
      "rounded": "{rounded.admin-control}",
      "padding": "10px 11px"
    },
    "admin-panel": {
      "backgroundColor": "{colors.paper}",
      "rounded": "{rounded.admin-panel}",
      "padding": "24px"
    },
    "admin-navigation": {
      "textColor": "{colors.admin-nav-ink}",
      "rounded": "{rounded.admin-control}",
      "padding": "12px 14px"
    },
    "admin-navigation-active": {
      "backgroundColor": "{colors.admin-nav-active}",
      "textColor": "{colors.white}"
    },
    "admin-status-active": {
      "backgroundColor": "{colors.admin-status-active}",
      "textColor": "{colors.admin-status-active-text}",
      "rounded": "{rounded.admin-status}",
      "padding": "4px 8px"
    },
    "admin-confirm": {
      "backgroundColor": "{colors.admin-confirm}",
      "rounded": "{rounded.admin-control}",
      "padding": "14px"
    }
  }
}
---

# Design System: CreatorHub

## Overview

**Creative North Star: "September 25 CreatorHub references"**

CreatorHub follows the user-approved September 25 white-and-blue discovery, profile, and inbox references. Near-white pages, white content regions, dark navy text, and blue actions replace the earlier warm coral direction. Thin dividers and generous public-page spacing frame portfolio imagery.

The homepage combines centered discovery search with Popular projects, a looping introduction video, Recently added projects, category links, creative events, and an About/join section. Profiles give work imagery priority; inquiries join a conversation sidebar and selected chat inside one bordered frame. Details opens from the chat header. Workspace editing retains its established functional layout.

**Key Characteristics:**

- White and near-white backgrounds with blue actions and selected navigation.
- Borderless portfolio cards with rounded images and plain captions.
- Pill-shaped discovery search, filters, and skill tags.
- One joined conversation frame with pale-blue sent messages.

- Administration uses a navy sidebar, cool light workspace and compact white record panels.

### Administration scope

Administration has its own visual scope under `/_admin`. A fixed navy sidebar and white toolbar frame a cool light workspace with compact directories and editing panels. This approved admin world is separate from the September 25 public references. Its rules and prefixed tokens apply only inside the administration shell.

## Colors

Blue is the primary action and selected-navigation color. Dark navy carries primary text; muted slate carries supporting text. White fills content regions against a near-white page. Pale blue identifies the active inbox item and sent messages. Current chat received bubbles use white against a pale neutral message area. Shared message tokens elsewhere retain their earlier warm neutral. Red marks a liked heart and destructive actions; green and amber retain their status meanings.

Frontmatter records implemented values. The source variables still call the primary accent `$coral` and `$coral-hover`; those names now resolve to blue. They are legacy identifiers, not palette guidance. Neutral field borders and secondary-button hover fills retain some earlier warm values in shared controls.

**The action color rule.** Use blue for primary actions and selected navigation; preserve explicit status colors and the red liked heart.

### Administration palette

Admin-prefixed frontmatter colors record the administration palette. Navy fills the sidebar; cool gray fills the workspace; white fills tables and editor panels. Admin blue marks primary actions and links. A darker blue identifies the active sidebar entry. Green, amber and red status fills retain visible text labels. Red also identifies removal actions; a pale warm confirmation region separates pending actions from ordinary editing.

**The administration scope rule.** Apply admin-prefixed tokens only within the administration shell; retain the public and workspace tokens outside it.

## Typography

The current body stack is Arial, Helvetica, sans-serif at 15px with a 1.5 line height. This records shipped behavior without establishing system-font display text as a new identity. General headings retain their measured hierarchy; the discovery hero has its own responsive hero token. Its supporting line is 21px on desktop and 17px below 900px. Home section headings are 29px, then 26px below 900px. The introduction heading retains 36px from the base stylesheet.

Project titles are 18px with line height 1.35. Creator lines use 14px and supporting metadata 13px. Profile names use 40px and role lines 25px, becoming 32px and 21px below 900px. The hero uses 34px below 560px. Existing 11px metadata elsewhere remains an observation, not a recommended minimum size.

### Administration hierarchy

The admin body uses the existing Arial/Helvetica stack at 14px with a 1.5 line height. Implemented page headings use 28px, with 24px below 760px; panel titles use 18px. Form labels and controls use 13px; directory cells use 12px. Count numerals use 32px, then 28px below 760px. The frontmatter records these measured roles. Small existing metadata, table headers and brand/navigation labels are observations, not a reusable minimum type scale.

## Layout

Public content has a 1600px maximum width, 4.2% horizontal padding, and desktop vertical padding of 56px above and 60px below. The header is at least 76px tall. Discovery search is centered within 860px. Its field and attached action are at least 58px tall. The homepage requests up to six Popular projects, followed by up to six Recently added projects that exclude the Popular IDs. Other discovery views request twelve per page. This is a page-content decision, not a global design token.

Project grids retain three desktop columns, change to two at 1200px, and use 26px gaps. Below 560px all grids become one column with 30px gaps. Reference styles load after desktop/mobile styles and therefore override the older two-column mobile project treatment. Project covers use a 1.7 aspect ratio.

Profiles use a 3:1 main/detail split with a minimum 260px detail column and 32px gap. Their work gallery uses a 1.5:1 split and 390px-tall images. At 900px the detail column stacks and gallery images become 300px tall; below 560px the gallery becomes one column with a 1.5 image ratio. Profile avatars step from 144px to 100px to 84px at those breakpoints.

The current inquiry frame joins a 340px sidebar and flexible chat column, with no gap. It has a 540px minimum height, viewport-relative height and an 820px maximum. The sidebar narrows to 290px below 900px. Below 700px the list and selected chat occupy separate views; Back to inbox restores the list. Details opens over the right side of the chat, up to 360px wide, and fills the chat width on phones. The header and composer stay visible while messages scroll between them.

Workspace navigation, editor forms, and publishing panels preserve the established layouts. The 215px workspace rail becomes horizontal navigation below 900px. The editor's publishing panel stacks at that breakpoint. Fields become single-column below 600px. Public page padding becomes 30px 22px 40px below 900px and uses 20px horizontal insets below 560px.

### Administration layout

The fixed sidebar is 232px wide. The white toolbar is 80px tall and the main content has a 1640px maximum width with 32px 36px 60px padding. White panels use 24px insets; retained category/event form panels use 22px. Dashboard totals form four columns with 16px gaps. The overview uses a 1.65:1 main/detail split; record editors pair a flexible form with a 300px control column, separated by 24px. Form fields use two columns with a 16px horizontal gap.

At 1150px, totals become three columns, overview/editor/category/event layouts stack, filters wrap, and main padding becomes 28px 24px 45px. At 760px the sidebar becomes a drawer, the toolbar becomes 70px tall, main padding becomes 24px 16px 40px, panels use 18px insets, totals become two columns with 12px gaps, and form fields become one column. Directory tables scroll inside their own panel with a visible mobile scrolling hint. These are the implemented breakpoints, including the stacked 930px verification view.

## Elevation & Depth

Shared and reference styles use thin borders and tonal fills without box shadows. Portfolio cards have no outer border or background fill; their imagery supplies the visual emphasis. Creator and service cards remain white, bordered containers. The inbox is one white frame with internal vertical separators.

**The flat frame rule.** Keep depth in borders, white regions, and state fills; preserve borderless portfolio cards.

### Administration depth

Administration uses white panels and thin cool-gray borders without panel shadows. The navy sidebar establishes the navigation layer. Its mobile drawer moves over a half-opacity dark scrim; the scrim distinguishes the open navigation from the inactive workspace. Drawer movement lasts 200ms with ease timing and is disabled for reduced motion.

## Shapes

General controls retain 5px corners. Portfolio images, creator/service cards, and the inquiry frame use 7px corners. Conversation bubbles use 11px corners. Discovery search uses a 36px radius, filters 24px, and skill tags 20px. Profile primary actions use 9px corners. Circular avatars remain distinct from rectangular work imagery.

### Administration shapes

Admin panels and total cards have 8px corners. Controls, sidebar links and confirmation regions have 6px corners. Status labels use compact 5px corners rather than public skill-tag pills. Record thumbnails remain rectangular and account avatars remain circular.

## Components

### Buttons

Primary controls use blue with white 14px semibold text, a 42px minimum height, and 10px 24px padding. Their hover darkens the blue. Secondary controls retain a transparent fill and neutral border. Destructive controls retain dark red. Disabled controls use 0.55 opacity. Global keyboard focus uses a 2px blue outline with a 4px offset. Background and border changes take 0.15s.

### Inputs / Fields

Shared fields retain visible labels, a 7px label gap, thin borders, and 42px minimum input height. The discovery search specializes this into a white pill with an attached blue action. Filters below it are centered and wrap. Error notices remain explicit text regions.

### Navigation

Desktop main links use 15px text and blue active underlines. Content tabs also use blue underlines. Workspace navigation retains icons, labels, and neutral active fills. Projects, Creators, Services, Events, and Contact us link to distinct pages. At 1150px the header navigation moves onto a separate row and authentication actions keep an automatic left margin. At 560px navigation links wrap and center. The workspace rail retains horizontal scrolling.

### Chips

Skills use pale-gray filled pills with dark slate text and the existing thin border. Status labels preserve textual meaning and green, amber, or neutral fills. These are informational labels without invented hover interactions.

### Cards / Containers

Project cards are transparent and borderless. Rounded covers sit above captions with 15px top padding and no horizontal inset. Creator avatars in captions are 43px circles. Creator and service cards retain their 22px inset and white bordered treatment. Service entries in the profile detail column instead use horizontal dividers.

### Likes

Project hearts reflect the backend viewer-like state through `getMyProjectLike`; the like/unlike mutation toggles that state. Liked hearts are red. The control remains distinct from the saved-project action and has a minimum height of 44px.

### Video introduction

The local introduction video uses a 16:9 contain frame with a poster image. The desktop section places text beside the player. Visible play/pause and sound controls are at least 44px. Playback behavior follows the implemented viewport and reduced-motion handling, including a user's pause choice. A direct video link appears when playback fails. Asset origins and missing provenance are recorded in `docs/MEDIA_PROVENANCE.md`.

### Private conversation

The conversation header groups an avatar, counterpart name, inquiry context and a Details toggle. Received bubbles align left on white; pale-blue sent bubbles align right. Desktop bubbles use at most 78% of the message area or 540px, with 12px corners and a smaller corner toward their sender. Below 900px they may use 90% width. Message text uses 14px with a 1.55 line height; existing 10px timestamps record the implemented chat treatment rather than a global type rule.

The composer has a labeled textarea and blue Send action in one row. The field starts at 58px tall and allows vertical resizing up to 140px. Enter sends and Shift+Enter inserts a newline. IME composition and held Enter keys cannot send accidentally. Details contains the original brief, workflow actions and event history. Downward sidebar scrolling loads more conversations; upward message scrolling loads older messages and preserves the reading position. A newly opened conversation shows the latest messages at the bottom. There are no conversation or message page controls and no pins.

### Administration controls and fields

Admin primary buttons use blue and white text; secondary buttons use white, a cool border and darker text. Removal buttons use admin red. Controls have a 40px minimum height, 6px corners, 13px semibold text and 9px 14px padding. Primary hover darkens the blue; secondary hover adds a pale cool fill. Disabled actions retain 0.55 opacity. Admin keyboard focus uses a 3px pale-blue outline with a 3px offset. Fields retain visible labels, a 6px gap, white fill and cool borders; their minimum height is 40px and padding is 10px 11px.

### Administration navigation

Sidebar entries pair an SVG icon with a text label. The active entry uses a filled blue region and white text; hover uses a lighter navy fill. Below 760px the closed drawer hides its links. Opening it moves focus inside, traps keyboard focus, makes the workspace inert, supports Escape, and returns focus on close.

### Administration directories and editors

White bordered panels group filters, real records and pagination. Tables use pale header fills and horizontal row dividers. Thumbnail/name cells lead each record; a visible Manage action opens its editor. Status labels always include text. Counts and recent-project rows use connected backend records. Category and event editors retain their existing forms within the same admin shell. Website content uses a grouped form.

A record editor separates content fields from publication, account access and recovery controls. Unsaved edits disable state actions. A pending action opens an inline confirmation region with confirm/cancel controls. Restoring a retained record does not publish it automatically.

**The explicit state rule.** Keep publication, access and removal actions separate from saving content, with visible confirmation and disabled state controls while edits are unsaved.

### Approved October adjustments

The hero search groups keyword, category, Korean location and a blue search button in one segmented control. On phones the keyword and button occupy full rows, with category/location between them. Category shortcuts sit below search and above Popular projects.

After the homepage search leaves the viewport, the sticky header uses a compact logo, project search and a horizontally scrolling row of navigation/category links. It expands again near the top. Unfollow uses the existing red danger color. Sonner displays action feedback; inline form errors and confirmation regions remain visible.

The footer has five desktop columns including Gwangju, Korea and labeled demo social icons, then adapts to fewer columns on smaller screens. The assistant panel fits phone widths and preserves keyboard focus. The stylesheet entry is scss/main.scss, which fixes base/reference/admin/change ordering in one place.

### Approved account and interaction refinements, 5 October 2026

Main discovery links occupy the logo/search row, with creative categories below. Unrelated pages use the logo and account actions without discovery controls. At 1100px main links move onto their own scrolling row. The account menu uses compact 14px entries, text-only Saved projects and a red 32px sign-out control. Fallback avatars remain visible on phones.

Sign-in method panels have a 640px maximum width, smaller content tabs and compact social-provider controls. Email verification offers a blue outlined resend action beneath a divider. Confirmation prompts use a fixed top position, up to 460px width, 17px titles and 34px actions. Destructive controls use red throughout both app and administration. Errors remain inline.

Clickable portfolio, creator and service cards lift 3px on hover, show pointer cursors, and retain normal links for keyboard access. Focus outlines use the existing blue. Reduced-motion preferences disable lifts. Creator profile actions use smaller aligned controls. Customer reviews use star icons and readable feedback with author/date.

The chatbot uses a compact launcher, a 360px panel with a 480px maximum height, a pale-blue header and a smaller composer. It fits the viewport on phones. Existing white-and-blue visual authority remains unchanged.

### Approved inbox and navigation refinements, 5 October 2026

Main navigation uses bold 14px links, blue hover/active states and padded hit areas. The category rail uses regular 13px gray text on a pale background. The Inbox badge remains visible when text labels hide on phones. Account sign out has red text and a pale red background; Saved projects has no icon.

The current inbox uses one sidebar for sent and received conversations. Rows show counterpart avatars and names, subject, brief preview, status, date and a text description of who contacted whom. A dot marks unread conversations; the selected row uses pale blue. The latest approved chat layout and scrolling behavior are documented in Layout and Private conversation above. Inquiry composition keeps its bounded form and creator context. This replaces the earlier Received/Sent tabs and permanent original-brief column.

## Do's and Don'ts

### Do:

- Do use the approved September 25 references as the visual authority.
- Do preserve visible keyboard focus, labels, disabled states, and reduced-motion behavior.
- Do keep portfolio media tied to backend records and identify fictional demo media.
- Do retain the existing architecture and backend-supported actions.

- Do apply the dedicated admin palette, compact controls and responsive drawer only to administration.
- Do keep admin table scrolling inside its panel and retain visible status text and confirmation controls.

### Don't:

- Don't restore the previous coral palette as the product identity.
- Don't add invented service thumbnails or unsupported payment and booking flows.
- Don't treat generated demo artwork as real client work.
- Don't propagate admin styling into public discovery, profiles, inbox or creator workspace pages.

### Account photo and Following refinements, 5 October 2026

Account settings uses a 72px photo preview beside an Upload photo action and format/size hint. Following uses a single list of 48px avatars, linked creator names and headlines, and compact red Unfollow actions. The account menu dismisses on outside pointer input and route changes. Messaging Details keeps the brief and workflow actions, without the audit history disclosure. These changes retain existing color and type tokens.

## Conversation appearance, 9 October 2026

Inbox and the AI panel use the original reference appearance, with no appearance selector or automatic system theme. Stored chat theme preferences no longer affect these surfaces. Public pages and administration retain their existing appearance. Mobile connection lists use compact avatar rows and a single Followers & Following entry.

## Mobile header controls, 9 October 2026

Mobile authentication links are compact at 12px text and 36px height. A 20px globe in a 40px button opens the language menu. Desktop uses the same globe language trigger; its authentication links keep their existing sizing.

## Assistant design, 10 October 2026

The assistant uses a compact CreatorHub Assistant heading with a circular chat emblem. Pale neutral assistant bubbles and pale blue user bubbles have separate avatars and 20px spacing. The rounded input and blue send button stay visible below a scrollable transcript. Desktop uses a 410px panel with up to 620px height. Mobile uses the available viewport height up to 680px with space for its launcher. No theme modes return.

## Password settings and footer, 10 October 2026

Account Settings uses the existing panel and labelled password controls for current password, new password and confirmation. A linked-method selector appears only when needed. The footer bottom includes Instagram, LinkedIn and YouTube icons without placeholder links, plus Terms of service and Privacy policy links in Get started.

## Comment controls, 10 October 2026

Owned project comments show a pencil and trash icon on the right of the author/date row. Controls retain accessible Edit comment and Delete comment names, native title tooltips and keyboard focus rings. Other members' comments show no actions. Delete still requires confirmation.


## Password requirements and footer placement, 10 October 2026

New-password fields show an accessible localized requirement and example directly beneath the input: 6–30 characters with a letter, number and symbol, for example River7!Cloud. Confirmation fields avoid duplicate guidance. Sign-in and current-password fields accept existing credentials without the new composition rule. The password icon reflects current visibility, with a tooltip naming its next action. Instagram, LinkedIn, YouTube and Telegram icons sit beneath the location in Find us. Social URLs remain unset pending the owner's real links.


## Email confirmation and auth errors, October 10

The approved auth change adds a Check your email page using the existing auth panel and envelope icon. Confirmation copy explains link verification, resend and sign-in. Signup and login submission errors appear as red secondary text directly under their inputs, with invalid borders and accessible error associations. Desktop and 390px mobile views were checked.


### Simplified email link confirmation

The approved follow-up uses a compact 440px confirmation panel, an inline recipient email, text resend and sign-in links, and no default email form. Verification links automatically show progress, success, or recovery; the technical token is never shown as an input. Duplicate signup banners are hidden on these routes.
