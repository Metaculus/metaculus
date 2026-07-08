# Prompt for Claude Design — Metaculus Mobile Consumer Prototypes

Copy everything below the line and give it to Claude Design.

---

## Mission

Prototype two mobile consumer flows for Metaculus (the forecasting platform). Metaculus is introducing a **lightweight account tier** for consumers (non-forecaster visitors): entering an email alone creates a working account, verified via a 6-digit code, no password ever required. Your job is to design how this feels on a mobile question page — high-fidelity, matching the existing product UI described below. You already have access to the design system tokens; this brief gives you the product context and the real page anatomy to design against.

Target viewport: mobile, 375–430px wide. Light mode required; dark mode variants are a bonus (the product supports both via `-dark` token suffixes).

## Product context: how lightweight accounts work

You need these mechanics to design the flows correctly:

- A visitor enters an **email only**. Behind the scenes this creates a real account in an *unverified* state.
- We immediately send one email containing a **6-digit code** (and a magic link — but on mobile, the code path is the primary UX you're prototyping, because the user's email app and browser may be separate contexts).
- Entering the code = email verified + signed in. This is double opt-in: until they verify, they receive nothing further.
- **No password. No username shown or asked.** A username is auto-generated internally and never surfaces; users are only asked to pick a name if they later do something public (commenting). Do not include username or password steps in these flows.
- If the email already belongs to an existing Metaculus account, the flow looks *identical* — they get a code, enter it, and are signed into their existing account. Never design a "this email already has an account" branch; the UX must not reveal that.
- Code mechanics for error states: 6 digits, ~10-minute expiry, limited attempts, resend available with a short cooldown.
- After verification, the user is signed in like any user — future visits can use "email me a code" to sign back in.

Tone guidance: consumers, not forecasters. Avoid jargon — never "CP", say "the community"; never "subscription", say "updates" or "notifications". The value exchange must be explicit at the email step: say exactly what they'll receive.

## The current mobile question page (match this)

This is the real, shipped anatomy of a binary question detail page on mobile (consumer variant), top to bottom:

1. **Meta row** — a compact flex row on a light gray (gray-200) strip: post voter (chevron up/down in a pill, mint accent when upvoted, salmon when downvoted), comment count, question status, forecaster count.
2. **Title** — question title, center-aligned on mobile, ~24px (text-2xl), Inter.
3. **Action row** — centered pill buttons: **Predict** (primary blue pill) plus Share. The Follow button exists on desktop (secondary pill, bell icon, "Follow"/"Following") but is **hidden on mobile** — meaning there is currently no subscribe affordance on the mobile page. Your Prototype 1 CTA fills this gap.
4. **Community prediction gauge** — the centerpiece: a custom SVG **radial gauge** (semicircular arc, ~110px), centered. Large bold percentage in the middle (e.g. "68%") with a small-caps "CHANCE" label beneath. The arc fill is color-coded by probability (olive/green tones when likely, salmon/red tones when unlikely). Labeled as the community's view.
5. **Timeline chart** — the forecast-history line chart is hidden on mobile (`hidden sm:block`); the gauge stands alone.
6. **Top Key Factors** — a small blue "Top Key Factors" section label with "View All (N)" on the right, then a full-bleed horizontal carousel of cards. Each card: 2–3 lines of text, a colored impact bar, thumb up/down vote buttons with counts (mint when up-voted, salmon when down-voted), author avatar + date.
7. **Comments** — compact comment feed with nested replies; each comment has the chevron voter.

Established interaction patterns to reuse:

- **Bottom sheets are the mobile modal pattern.** Forms and flows on mobile open as bottom-sheet drawers (the forecast flow uses a full-height accordion-style sheet below the header) over a blurred blue-tinted backdrop (blue-900/50 + backdrop blur). Design both flows as bottom sheets layered over the question page, not as separate pages.
- **Pill-shaped buttons** throughout: primary = blue fill, secondary = white/gray with blue text.
- **The binary forecast input** is a horizontal slider with a draggable handle, a floating "Community: X%" bubble above the track (olive background), and an editable numeric % field, submitted with a primary "Predict" pill button.
- Semantic colors: blues (blue-700/800/900) for primary/heads/dark surfaces, olive for community/positive, mint for upvotes/agreement, salmon for downvotes/disagreement, yellow for the follow bell, grays for surfaces. Typography is Inter.

---

## Prototype 1 — "Notify me when this resolves"

The most consumer-legible subscribe CTA: *find out how this turns out*. Design the full first-time flow.

**Entry point:** a prominent CTA on the question page, placed directly beneath the community prediction gauge (the mobile page currently has no follow affordance — this is the consumer replacement). Suggested framing: a bell icon + "Notify me when this resolves". Design the CTA itself in context on the page.

**Flow (each step a bottom sheet state):**

1. **Email entry** — one email field, one primary button. Must state the value exchange plainly (you'll get an email when this question resolves — and optionally note "occasional big changes in the forecast" if you include an expander for update preferences; keep preference-picking optional and collapsed, never a required step). Include a subtle reassurance: no password needed, unsubscribe anytime.
2. **Code entry** — "We sent a 6-digit code to {email}". Six auto-advancing digit boxes, "Resend code" (with cooldown state), "Use a different email" escape hatch. Design states: default, error (wrong code), resend-cooldown.
3. **Success** — confirmation that they're now watching this question ("We'll email you when this resolves"). This screen should also do light expectation-setting and offer one gentle next step (e.g. "Also get notified about big forecast changes" toggle, or a nudge toward one related question) — but keep it dismissible and celebratory, not a second funnel.

**Also design:** the post-success persistent state of the CTA on the question page (e.g. bell filled, "You'll be notified" / "Watching"), and the email-entry error state (invalid email).

## Prototype 2 — "Do you agree with the community?"

A zero-knowledge-required engagement primitive that escalates commitment step by step: opinion → forecast → email.

**Entry point:** directly under the community prediction gauge, a compact prompt: "Do you agree with the community?" with two buttons — **Agree** / **Disagree** (consider mint vs. salmon accents to match the product's vote semantics). Design it as part of the page, visually subordinate to the gauge.

**Branch A — Agree:**
- Instant, light acknowledgment in place (e.g. "You and the community both say 68% likely" or similar — feels good, no friction).
- Follow with a soft, dismissible email prompt: "Want to find out if you're right? Get notified when this resolves" → if tapped, reuse the exact email → code → success flow from Prototype 1 (same sheets, adjusted copy).

**Branch B — Disagree:**
1. Respond with an invitation, not a form: "What do you think the chances are?" Present a simplified forecast input in a bottom sheet — base it on the existing binary slider (track + draggable handle + floating "Community: 68%" bubble + editable % value), but feel free to simplify for a first-time consumer.
2. After they commit a number (primary button, e.g. "Lock in my forecast"), show the save prompt: their forecast is **not saved yet** — "Enter your email to save your forecast and find out if you beat the community." Their chosen number should stay visible on this screen (their commitment is the motivation to finish).
3. Email entry → code entry → success, reusing Prototype 1's sheets. The success state here is forecast-flavored: their number vs. the community's, side by side, and "We'll email you when this resolves so you can see who was right."

**Also design:** the post-vote persistent state of the agree/disagree module on the page (e.g. showing their stance or their number next to the community's), and what the module looks like if they abandon at the email step (forecast held locally, module shows "Your forecast isn't saved yet — finish saving" re-entry point).

Note: letting brand-new accounts forecast is a future capability we're exploring — design it as if it works end to end; don't design any restriction/warning states around it.

## Deliverables

- Both prototypes as complete mobile screen flows: every step, including error, loading, resend-cooldown, and post-completion persistent states listed above.
- The question page shown in context for both entry points (you can represent the rest of the page at lower fidelity, but the gauge + CTA/module area at full fidelity).
- Brief interaction annotations (what animates/transitions between sheet states, auto-advance behavior on code boxes, what's tappable).
- Shared components across the two flows (email sheet, code sheet, success sheet) designed once and clearly reused — these will become one component family in production.
