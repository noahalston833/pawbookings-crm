# Frontend styling conventions

This document covers the visual design system introduced to make the
React frontend look and feel like a real product, rather than the raw
functional scaffold it started as. It complements
[docs/architecture.md](architecture.md) (system shape) and
[docs/testing.md](testing.md) (test pyramid) — this file is about "how
a screen should look and be built," not "why the system is shaped this
way."

**Nothing in this document changes API contracts, authorization,
tenancy, booking rules, or backend behavior.** Every rule below is
presentation-only.

## Dependencies

- **Bootstrap 5** (`bootstrap/dist/css/bootstrap.min.css`) — base
  styles, grid, and utility classes.
- **react-bootstrap** — accessible component behavior (focus
  management, keyboard handling, ARIA wiring) for interactive widgets
  (`Modal`, `Toast`, `Navbar`, `Form.*`, `Dropdown`). Prefer a
  react-bootstrap component over hand-rolled markup whenever one
  exists for the job.
- **bootstrap-icons** — icon font, used sparingly (icons are always
  paired with visible text; see Accessibility below).

All three are imported once, in `src/main.jsx`, in this order:
Bootstrap CSS → bootstrap-icons CSS → `src/styles/theme.css` (so the
app's overrides load last and win the cascade).

## Theme

`src/styles/theme.css` retints Bootstrap via CSS custom properties
(`--bs-primary`, `--bs-link-color`, `--bs-body-bg`, `--bs-border-radius`,
etc.) rather than a Sass rebuild — no build-time Bootstrap compilation
step exists in this project, so runtime CSS variables are the only
practical way to reskin it.

One gotcha: Bootstrap's *compiled* CSS hardcodes `.btn-primary`'s
hover/active shades at build time — they do not auto-derive from a
runtime `--bs-primary` change. `theme.css` explicitly overrides
`.btn-primary`/`.btn-outline-primary`'s own component-scoped custom
properties (`--bs-btn-hover-bg`, etc.) to compensate. Keep this in mind
if the primary color ever changes again.

Brand colors live as `--pawcare-*` custom properties at the top of
`theme.css` (e.g. `--pawcare-primary`) — change the palette there, not
by hunting for hex codes elsewhere.

## Status color mapping

A booking/availability/pet status is never conveyed by color alone.
`components/StatusBadge.jsx` always renders a small dot **and** a text
label, using Bootstrap 5.3's "subtle" utility classes
(`bg-{variant}-subtle text-{variant}-emphasis border-{variant}-subtle`)
— never hand-rolled hex codes. The status → variant mapping is
centralized, not duplicated per page:

- `lib/bookingStatus.js` — pending (warning), accepted (success),
  denied (danger), cancelled (secondary), completed (info)
- `lib/availabilityStatus.js` — derives Available/Limited
  availability/Full/Closed from a slot's remaining vs. total capacity

If a new status-like concept needs a color, add a mapping file under
`lib/`, don't inline `variant="..."` guesses at the call site.

## Shared component library (`src/components/`)

Reach for one of these before writing new markup:

| Component | Purpose |
|---|---|
| `AppShell` | Top navbar (brand, role-aware nav, user menu) + max-width main content area. Used by `BusinessLayout` and `MyBusinessesPage`. |
| `PageHeader` | Title + optional description + optional primary action + optional breadcrumbs, at the top of every page. |
| `SectionCard` | A white, bordered content surface with an optional title/action row. |
| `StatusBadge` | Dot + label status indicator (see above). |
| `EmptyState` | Centered, muted "nothing here yet" block with an optional action. |
| `LoadingState` | Spinner + label, used as the whole-page loading fallback. |
| `ErrorAlert` | One shared error renderer for both a plain message and a structured API error (`{ message, details }}`), including field-level validation messages. |
| `FormActions` | Right-aligned Cancel/Save button pair with consistent labels and disabled-while-submitting behavior. |
| `ConfirmationModal` | Replaces `window.confirm()`/`window.prompt()` for anything destructive or hard to undo. Supports a custom `body` node (e.g. a reason textarea) and an independent `confirmDisabled` (validation) vs. `isConfirming` (in-flight) state. |
| `ResponsiveTable` | Horizontally-scrollable wrapper around a Bootstrap `Table` for data lists. |
| `StatCard` | Label + big value, optionally a link, used on dashboards. |
| `ToastContext` (`ToastProvider`/`useToast`) | Brief, auto-dismissing (4s) success confirmations. Mounted once near the top of `App.jsx`; call `useToast()` from any page under it. |

## Centralized display helpers (`src/lib/`)

Formatting logic that would otherwise be copy-pasted per page lives
here: `bookingStatus.js`, `availabilityStatus.js`, `roleLabels.js`,
`serviceKind.js`, `dateTime.js` (date/time/age formatting, always
business-timezone-aware where a business context exists), `capacity.js`
(reserved/remaining capacity text), `businessNavigation.js` (role →
nav items).

## Layout and navigation

- One `AppShell` renders for every authenticated screen (including
  `MyBusinessesPage`, which has no business context yet and so passes
  an empty `navItems` array) — chrome is always consistent.
- Within a business, `lib/businessNavigation.js` is the single source
  of truth for which nav links a role sees. It's UX only: the backend's
  Pundit policies are the real authorization boundary, and routes are
  additionally gated with `RequireRole` as a second layer (see
  `auth/RequireRole.jsx`) so directly navigating to a URL a role
  shouldn't reach still gets blocked client-side, ahead of the
  server's own 403.
- Pages are role-aware, not role-forked: the same `BookingsPage`,
  `PetsPage`, etc. adapt their content/controls based on
  `useCurrentMembership()`, rather than maintaining parallel
  "CustomerBookingsPage"/"StaffBookingsPage" components. The one
  exception is the dashboard, where customer and business views are
  different enough to warrant two components (`CustomerDashboardPage`,
  `BusinessDashboardPage`) selected by a thin `DashboardPage` router.

## Forms

- Every form field uses react-bootstrap `Form.Group`/`Form.Label`/
  `Form.Control`/`Form.Select`, not native `<input>`/`<select>` with
  hand-written `<label>` pairing.
- A required field's label may include a visual `*`, but the marker
  **must** be `aria-hidden="true"` — the `required` attribute already
  conveys this to assistive tech, and a marker without `aria-hidden`
  gets read aloud redundantly (and, in our tests, changes the label's
  matched text — anchor test regexes loosely, e.g. `/^name/i` rather
  than `/^name$/i`, if a label might gain a decoration later).
- Long-running/complex forms (pet profile, booking request) group
  related fields under an `<h2 className="h6">` subheading rather than
  presenting one long flat list.
- End every form with `FormActions` (or, if there's genuinely no
  "cancel" destination, e.g. a persistent settings page, a lone
  primary submit button) — never a bare `<button>`.
- On success, call `useToast().showToast('X saved')` — don't render an
  inline "Saved." message that has to be manually reset on every field
  change.

## Confirmations and destructive actions

Every destructive or hard-to-undo action (archiving a pet, removing a
member, accepting/denying/cancelling a booking) goes through
`ConfirmationModal`, never `window.confirm`/`window.prompt`. A reason
that must be non-blank (e.g. denying a booking) is a controlled
textarea inside the modal body, with the confirm button disabled via
`confirmDisabled` (not `isConfirming`, which is reserved for "the
request is in flight" and disables both buttons).

## Responsiveness

- Page content is capped at a comfortable reading width (`.app-shell__main`,
  ~1140px) and centered — it does not stretch edge-to-edge on wide
  monitors.
- Any data table has two renderings: a `ResponsiveTable` for `md`
  and up, and a stacked card list for smaller screens (`d-md-none`
  cards next to a `d-none d-md-block` table), rather than relying on
  horizontal scrolling alone. See `PetsPage.jsx` for the pattern.
- Verify new pages at roughly 375px (phone), 768px (tablet), and
  1440px (desktop) widths.

## Accessibility

- Status is always color **and** text (see Status color mapping).
- Every icon is decorative (`aria-hidden="true"`) and paired with
  visible text — icons never carry meaning alone.
- Every form control has a real associated `<label>` (via
  `Form.Group`'s `controlId` + `Form.Label`, or `visuallyHidden` when a
  visible label would be redundant, e.g. a table cell's inline
  capacity input).
- Modals (`ConfirmationModal`) trap focus and are dismissible via the
  header close button, backdrop click, or Escape — all handled by
  react-bootstrap's `Modal`, not reimplemented.
- Interactive elements are real `<button>`/`<a>` elements (via
  react-bootstrap's `Button`, including `as={Link}` when it should
  navigate), never a `<div onClick>`.

## Adding a new page

1. Fetch data with a hook from that feature's `use<Feature>.js` file
   (TanStack Query) — don't fetch inside the component body directly.
2. Handle `isLoading` (`LoadingState`), `isError` (`ErrorAlert`), and
   empty (`EmptyState`) before the "happy path" render.
3. Start the happy-path render with `PageHeader`.
4. Group content into one or more `SectionCard`s.
5. Use `ResponsiveTable`/`StatusBadge`/`ConfirmationModal`/`FormActions`
   instead of new one-off markup wherever the content fits one of
   those shapes.
6. Add the route in `app/App.jsx`, wrapped in `RequireRole` if it's
   not available to every authenticated role, and add it to
   `lib/businessNavigation.js` if it should appear in the nav.
7. Write at least a loading/empty/populated smoke test alongside any
   new interactive behavior (mutations, role-gated controls).
