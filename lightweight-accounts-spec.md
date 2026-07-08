# Lightweight Accounts & Email-First Engagement — Foundation Spec

**Status:** Draft for review
**Audience:** Backend engineering, Product
**Author:** Atakan (drafted with codebase analysis)
**Date:** 2026-07-06

---

## 1. What we're trying to achieve

Metaculus today has one kind of user: a forecaster who completes a full signup (username + email + password, or Google/Facebook), verifies their email, and then engages. Everyone else — the large majority of traffic — is a read-only visitor with no way to leave anything behind: no email, no saved state, no reason to return.

We want to introduce a **lightweight account tier**: a visitor enters an email address, and that alone creates a working account. They can immediately subscribe to updates on questions and topics, and later sign in with a one-click magic link (or a short code) — no password unless they ever want one. The account "hardens" progressively: verified on first link click, named when they first do something public, passworded only if they ask.

This spec covers **the foundation only**: the account model, the passwordless auth mechanics, the email-capture entry points, and the delivery/compliance groundwork. It deliberately does not spec any individual consumer feature — those come after, and they all sit on top of this.

### Why this is worth building (motivation)

Every consumer engagement idea we've evaluated ends the same way: *capture an email, then deliver value to it over time*. Examples of what this foundation unlocks (not specced here, listed to show the leverage):

- **"Subscribe to updates"** on a question page — comments, forecast movement, resolution.
- **"Notify me when this resolves"** — the most consumer-legible CTA we have.
- **Threshold alerts** ("email me if this goes above 50%") — the price-alert mental model.
- **Reminders** ("remind me about this in 3 months") — the backend for this (`SPECIFIC_TIME` subscriptions) already exists.
- **Post-action capture** — visitor votes on a comment or key factor, then: "your vote isn't saved yet — enter your email to keep it."
- **Digests** — weekly movers, topic digests, resolution recaps.

### Vision (longer arc, not in scope)

The foundation is phase one of a larger consumer arc: personalized sidebar with unread/movement chips, interactive embeds that capture forecasts on third-party sites, follow-the-forecaster, quizzes and shareable score cards, topic dashboards. Each of those is a separate spec; all of them assume this foundation exists.

---

## 2. The core architectural decision: shadow accounts, not a parallel system

**Decision: lightweight accounts are real `User` rows** — created from an email alone, with an auto-generated username and no usable password — rather than a separate `AnonymousEmailSubscription` table.

**Why:**

1. **The entire subscription and notification stack is user-bound and comes free.** `PostSubscription` (5 types: CP change, new comments, milestones, status change, specific time — `posts/models.py`), `ProjectSubscription` for topics/categories/tournaments (`projects/models.py`), the batched `Notification` model, the email templates, the cron delivery jobs (`notifications/jobs.py`, `posts/jobs.py`), and the per-tag unsubscribe system (`unsubscribed_mailing_tags` on User) all key off a `User` FK. A shadow account inherits all of it with zero duplication.
2. **Upgrade is a field update, not a migration.** When a lightweight user sets a username or password, nothing moves — same row, same subscriptions, same history.
3. **There is precedent in the codebase.** Social-auth users already live without usable passwords (social pipeline, `metaculus_web/settings.py`), and the simplified-signup flow already creates users with auto-generated identities (`authentication/urls.py` → `/auth/signup/simplified/`). We are extending an existing pattern, not inventing one.

**The alternative we rejected:** an email-only subscriber table. It would require re-implementing notification scheduling, batching, templates, and unsubscribe handling for a second identity type — and then migrating that data into `User` the moment anyone converts. All cost, no payoff.

---

## 3. Auth mechanics: magic link primary, 6-digit code fallback

**Decision: magic link is the primary sign-in; a 6-digit code is shown alongside it as a fallback** (for the mobile case where the email app and the browser are different contexts).

**Why magic link first:** it reuses the token infrastructure we already run. Account activation and password reset both use Django's `default_token_generator` with email-delivered links (`authentication/services.py`). A sign-in magic link is the same mechanism with a different landing behavior. The 6-digit code is the only genuinely new auth primitive, and it's small: a short-lived code in Redis (already deployed — it backs the JWT refresh grace-period dedup in `authentication/jwt_session.py`).

**Session issuance is unchanged:** on successful link/code verification, we issue the same JWT access/refresh pair through the same cookie flow (`front_end/src/services/auth_tokens.ts`). No changes to session handling, middleware, or revocation.

**Existing accounts get this for free — deliberately.** If the entered email matches an existing full account, we send that account a sign-in link/code instead of creating anything. This mirrors the `associate_by_email` step already in the social-auth pipeline and quietly gives every existing user passwordless login. Password and Google/Facebook login remain untouched as options.

---

## 4. Account lifecycle

A lightweight account moves through states. This is the model both audiences should hold:

```
  visitor enters email
        │
        ▼
  UNVERIFIED ──(clicks confirmation/magic link)──► VERIFIED
   shadow row,                                      can sign in via link/code,
   one email sent                                   receives ongoing emails,
   (double opt-in),                                 subscriptions active
   no further sends
        │                                               │
        │ (never clicks, ~30 days)                      │ (first public action)
        ▼                                               ▼
     PURGED                                      NAMED (chose username)
                                                        │
                                                        │ (sets password — optional, ever)
                                                        ▼
                                                   FULL ACCOUNT
```

Key properties:

- **Double opt-in is structural, not optional.** The first email is the verification. Until the link is clicked, we send nothing else. This is simultaneously our spam defense, our deliverability protection, and our GDPR consent record.
- **We do not overload `is_active`.** Account tier is a new, explicit field (see §6). `is_active=False` blocks login entirely in Django's auth machinery and is already loaded with meaning in activation logic — reusing it would be a bug farm.
- **Username is deferred, not skipped.** The `User` model requires a unique username at creation, so we auto-generate one (precedent: simplified signup generates `autouser+{username}` identities). But auto-generated names must never appear on public content — the first public action (comment, etc.) prompts for a real username.

---

## 5. What comes free vs. what we build

### Comes free (existing infrastructure we reuse as-is)

| Capability | Where it lives |
|---|---|
| Per-question subscriptions (5 types incl. reminders) | `posts/models.py`, `posts/services/subscriptions.py` |
| Topic/category/tournament subscriptions with auto-follow | `projects/models.py`, `projects/services/subscriptions.py` |
| Notification batching, digest emails, cron delivery | `notifications/`, `posts/jobs.py`, `misc/management/commands/cron.py` |
| Per-tag email unsubscribe | `users/models.py` (`unsubscribed_mailing_tags`), `notifications/constants.py` |
| Email sending (Mailgun via anymail, async via dramatiq) | `utils/email.py`, `misc/tasks.py` |
| Link-token generation & validation | `authentication/services.py` (`default_token_generator` pattern) |
| JWT session issuance, refresh, revocation | `authentication/jwt_session.py`, `front_end/src/services/auth_tokens.ts` |
| Bot protection (Turnstile) already wired into signup | `authentication/views/common.py` |
| Redis for short-lived state | already deployed (JWT grace-period cache) |
| Anonymous-visitor analytics & funnels | PostHog with `person_profiles: "always"` (`front_end/src/contexts/posthog_context.tsx`) |
| A single frontend intervention point for gated actions | the `if (!user) setCurrentModal({type: "signin"})` pattern (e.g. `front_end/src/components/comment_feed/comment_voter.tsx`) |

### We build (the actual scope of this project)

| Item | Size | Notes |
|---|---|---|
| Account-tier field + lifecycle states on `User` | S | New enum/flag; migration; see §6 |
| Email-capture endpoint (create-or-match shadow account + first subscription atomically) | M | Rate-limited, Turnstile-gated, enumeration-safe |
| Magic-link sign-in (issue, land, verify, session) | M | Reuses token pattern; new endpoint + frontend landing route |
| 6-digit code issue/verify | S–M | Redis-backed, attempt-limited |
| Auto-username generation for email-only signups | S | Precedent exists in simplified signup |
| "Claim your account" upgrade flow (choose username, optional password) | M | Password-set reuses the password-reset mechanics |
| Email-capture UI: subscribe CTA component + swap-in replacement for the signin modal on gated actions | M | One modal, used everywhere the signin gate fires today |
| Confirmation/sign-in email templates | S | Follow existing MJML templates in `authentication/templates/emails/` |
| Unverified-account purge job (~30 days) | S | New cron job; pattern matches existing jobs |
| One-click unsubscribe headers (RFC 8058) on notification mail | S–M | Compliance prerequisite — see §8 |
| Guardrails: rate limits, per-email send caps, code attempt limits | S | Cross-cutting |

**Explicitly out of scope for this phase:**

- **Forecasting by lightweight accounts.** Lightweight accounts start with subscriptions and lightweight actions only. Whether/how unverified or verified lightweight accounts can forecast — and how that interacts with the Community Prediction — is a separate decision with its own integrity analysis. Nothing in this foundation forecloses it.
- Sidebar personalization/badges, digest products, interactive embeds, follows — all downstream features.
- Any change to existing password/social login flows.

---

## 6. For the backend engineer

### Data model

- Add an **account tier** to `User` — recommend a small enum field (e.g. `account_tier`: `LIGHTWEIGHT_UNVERIFIED` / `LIGHTWEIGHT_VERIFIED` / `FULL`) rather than booleans, so future states don't multiply flags. Existing users backfill to `FULL`.
- Lightweight accounts: `set_unusable_password()`, auto-generated unique username, `is_active=True` (they are real, loginable-via-link users — tier gates capabilities, not `is_active`).
- Audit every place that filters or branches on `is_active`, `has_usable_password()`, or user visibility (serializers in `posts/`, `questions/`, leaderboards in `scoring/`) to decide how lightweight tiers should behave. Default stance: lightweight users are invisible on public surfaces until NAMED.

### Known trap: `check_can_activate()`

The current activation logic requires `not last_login` (`authentication/services.py` → `user.check_can_activate()`). A magic-link sign-in sets `last_login`, which would permanently break the legacy activation path for that user. The tier field must fully replace any reliance on `check_can_activate()` for lightweight accounts; don't mix the two lifecycles.

### Endpoints (new)

- `POST /auth/lightweight/start/` — body: email (+ optional initial subscription payload: post/project + subscription types). Behavior:
  - Email matches existing user → send sign-in link/code to that account. **Response is identical in shape and timing to the new-account case** (no enumeration).
  - No match → create shadow `User`, create the requested subscription(s) in the same transaction, send confirmation email (which doubles as the first magic link).
  - Turnstile-validated; rate-limited per IP and per email; hard cap on outbound sends per address per day.
- `POST /auth/lightweight/verify/` — accepts either the link token (user_id + token, same shape as `ConfirmationTokenSerializer`) or email + 6-digit code. On success: mark tier `LIGHTWEIGHT_VERIFIED` if first time, issue standard JWT pair.
- Code specifics: 6 digits, ~10-minute TTL in Redis, max ~5 attempts then invalidate, single-use, constant-time compare.

### Token/link details

- Reuse the `default_token_generator` pattern for links. Note it derives from the password hash — fine for unusable passwords, and it means link tokens invalidate if the user ever sets a password (desirable).
- Sign-in links should carry a redirect target so "subscribe on question X → confirm → land back on question X" works. Follow the `redirect_url` handling already present in activation email context.

### Subscriptions & delivery

- No changes to subscription models or notification jobs. The only integration point: the capture endpoint creates `PostSubscription` / `ProjectSubscription` rows using the existing factory functions (`create_subscription_*` in `posts/services/subscriptions.py`, `subscribe_project()` in `projects/services/subscriptions.py`).
- Gate all notification sending on tier ≥ `LIGHTWEIGHT_VERIFIED` (one filter in the scheduling layer, e.g. where `schedule()` respects `unsubscribed_mailing_tags` in `notifications/services.py`).
- Purge job: new cron entry (pattern: `misc/management/commands/cron.py`) deleting `LIGHTWEIGHT_UNVERIFIED` accounts older than 30 days, cascading their subscriptions.

### Frontend integration points

- New email-capture modal added to the modal registry (`front_end/src/contexts/modal_context.tsx`); gated-action components currently open `{type: "signin"}` — those call sites switch to the new modal (or the signin modal grows an email-first default tab; UX call, see §7).
- Magic-link landing route that calls verify and hydrates the session via the existing cookie flow (`front_end/src/services/auth_tokens.ts`, `auth_context.tsx`).
- All user-visible strings go through the translation mechanism (`useTranslations()` + keys in all six `front_end/messages/*.json` files).

### Abuse & safety checklist

- Turnstile on capture; per-IP and per-email rate limits; daily send cap per address.
- No enumeration: identical responses whether the email is new, existing-full, or existing-lightweight.
- Code brute-force: attempt limits + TTL as above.
- Lightweight accounts excluded from anything that confers standing (leaderboards, public profiles) until NAMED.

---

## 7. For the product lead

### The funnel this creates

```
visit → engage-intent moment → email field (one input) → confirmation email
     → click (= verified + signed in) → ongoing emails → return visits
     → first public action → choose username → (maybe, someday) password
```

Every step is measurable in PostHog today (anonymous profiles are already on). Baseline instrumentation to have before launch: capture-modal impressions, email submits, confirmation clicks (verification rate), link sign-ins, upgrade events.

### Decisions we need from you

1. **Capture-modal UX on gated actions.** When a logged-out visitor votes/acts, do we show email-first with "or use password/Google" as secondary (recommended), or keep the current signin modal with an email-first tab added? This decides how aggressively we lead with the new path.
2. **Copy & positioning of the confirmation email.** It's doing three jobs at once: verify, deliver first value (e.g. current forecast snapshot for the question they subscribed to), and set expectations for future email. Worth real copy attention — it's the highest-leverage email in the product.
3. **Username prompt timing.** Recommendation: never at capture; only at first public action. Confirm.
4. **Purge window** for never-verified accounts (spec assumes 30 days).
5. **What lightweight accounts can do at each tier.** This spec assumes: UNVERIFIED = exists, holds pending subscriptions, receives nothing beyond the confirmation; VERIFIED = subscriptions live, can sign in, can take private actions (votes); NAMED = public actions (comments). Forecasting is out of scope entirely for now. Confirm this ladder.

### Compliance & deliverability (needs coordination, not just code)

- **Deliverability timing is a real constraint.** The codebase shows an email-domain warm-up in progress (`NOTIFICATIONS_DOMAIN_RAMP_PCT` at 10% in `utils/email.py`). Launching a new consumer email stream mid-warm-up risks the sender reputation of *all* Metaculus mail. Sequence the launch with whoever owns email ops.
- **One-click unsubscribe (RFC 8058 `List-Unsubscribe` headers)** must ship before volume scales — Gmail/Yahoo bulk-sender rules treat this as mandatory, and consumer subscription mail is exactly the traffic they police.
- **GDPR:** double opt-in is our consent record; the purge job is our retention policy for non-consenting addresses. Privacy policy likely needs a line about lightweight accounts.

### What success looks like (suggested)

- Primary: verified lightweight accounts created per week; confirmation-click rate (email quality signal — healthy double-opt-in rates are typically well above half when the ask is clear).
- Retention: % of verified lightweight accounts that return via a magic link within 30 days.
- Conversion: lightweight → NAMED rate (are they graduating to participants?).
- Guardrail: spam-complaint rate and bounce rate on the new stream (deliverability health).

Event-level definitions for all of these are in §8.

---

## 8. Events & metrics

Instrumentation groundwork: PostHog is already initialized with `person_profiles: "always"` (`front_end/src/contexts/posthog_context.tsx`), so anonymous visitors have person profiles *before* they ever enter an email — which is exactly what these funnels need, since every one of them starts anonymous. Pageviews are captured manually (`capture_pageview: false`) and there's a centralized event util (`front_end/src/utils/analytics.ts`) with existing events like `commentVoted` and `questionVoted`; new events below follow that camelCase convention. On verification we call the existing `identify()` path (`auth_context.tsx`), which merges the anonymous profile into the new user — this is what stitches the pre-signup funnel steps to the account.

Two standing rules:

- **No raw email addresses in event properties, ever.** The person profile carries identity; events carry context (surface, post id, trigger).
- **Measurement caveat:** without analytics cookie consent, PostHog persistence is memory-only, so cross-pageview funnels undercount for non-consenting users. Design funnels to complete within a session where possible (all capture flows do), and treat absolute counts on multi-visit funnels (retention, upgrade) as floors.

### Conversions we track

| # | Funnel | Steps | Primary metric |
|---|---|---|---|
| F1 | **Capture** (per surface) | CTA shown → CTA clicked → email submitted → verified | Verification rate (submitted → verified), split by surface |
| F2 | **Post-action capture** | Gated action attempted → capture sheet shown → email submitted → verified → action saved/replayed | Action-save rate; comparison vs. old signin modal (A/B) |
| F3 | **Retention** | Verified → first notification email delivered → email clicked → return session via link/code | 30-day return rate of verified lightweight accounts |
| F4 | **Upgrade** | Lightweight verified → username chosen (NAMED) → password set or social linked | Lightweight → NAMED rate |
| F5 | **Returning sign-in** | Code requested → code entered → session issued | Sign-in completion rate; code failure/resend rates |

North-star: **weekly verified lightweight accounts created**, with F1's verification rate as the leading quality signal. Guardrails (from Mailgun webhooks, see below): bounce rate, spam-complaint rate, and weekly purge counts of never-verified accounts.

### Client events (new, via `analytics.ts`)

| Event | Fired when | Key properties |
|---|---|---|
| `notifyCtaShown` | Capture CTA enters viewport (once per pageview) | `post_id`, `surface`, `variant` |
| `notifyCtaClicked` | Any capture CTA tapped | `post_id`, `surface`, `variant` |
| `emailCaptureShown` | Email sheet/modal rendered | `trigger` (`cta`, `gated_action:comment_vote`, `gated_action:post_vote`, `gated_action:key_factor_vote`, `forecast_save`), `post_id` |
| `emailSubmitted` | Email form submitted successfully (request accepted) | `trigger`, `post_id` |
| `emailSubmitFailed` | Submission rejected client- or server-side | `reason` (`invalid_email`, `rate_limited`, `captcha_failed`) |
| `codeEntryShown` | Code sheet rendered | `trigger` |
| `codeSubmitted` | Code accepted | `trigger`, `attempt_number` |
| `codeFailed` | Code rejected | `reason` (`wrong`, `expired`, `attempts_exceeded`) |
| `codeResendClicked` | Resend tapped | `resend_count` |
| `verificationSucceeded` | Session issued after verify | `method` (`code`, `link`), `trigger` |
| `captureAbandoned` | Sheet dismissed before completion | `step` (`email`, `code`), `trigger` |
| `magicLinkLanded` | Magic-link landing route rendered | `outcome` (`success`, `expired`, `invalid`) |
| `pendingActionReplayed` | Held gated action saved post-auth | `action_type`, `post_id` |
| `accountUpgradeShown` / `accountUpgradeCompleted` | Username/password prompt shown / completed | `step` (`username`, `password`) |

`surface` is the enum that makes every dashboard sliceable — start with `question_page_cta`, `gated_action_modal`, `login_form`, and extend as new surfaces ship (embeds, feed cards).

Existing events to keep firing unchanged (`commentVoted`, `questionVoted`, predict events) — F2 joins them with the new capture events, so no renaming.

### Server-side events (backend capture — source of truth)

Client events measure the funnel; server events measure reality. Emit via PostHog server-side capture from the relevant service functions:

| Event | Fired from | Why server-side |
|---|---|---|
| `lightweightAccountCreated` | capture endpoint | Client can't distinguish new account vs. existing-email match (by design — no enumeration) |
| `lightweightAccountVerified` | verify endpoint | The billable truth for the north-star metric |
| `subscriptionCreated` | subscription factories | Carries `subscription_type`, `object_type` (post/project) |
| `lightweightAccountPurged` | purge cron job | Weekly guardrail counts |
| Email lifecycle: `delivered`, `opened`, `clicked`, `bounced`, `complained` | Mailgun webhooks via anymail signal handlers | Deliverability guardrails + F3's "email clicked" step; anymail's webhook support is already available with the existing Mailgun backend |

Where a client and server event describe the same moment (`verificationSucceeded` vs. `lightweightAccountVerified`), dashboards use the server event for counts and the client event for funnel joins.

### Experiments

The A/B surface that matters first is F2: email-first capture sheet vs. the current signin modal on gated actions (rollout step 3, behind a flag). Use PostHog feature flags — there's already an experiments type stub (`front_end/src/types/experiments.ts`) — and include the flag/variant key on every event in the funnel so experiment analysis needs no joins. Success criterion for the experiment: action-save rate (F2 end-to-end), not email-submitted rate — capturing emails that never verify is not a win.

### Pre-launch checklist

- [ ] All F1/F2 events implemented and visible in a PostHog funnel before the first surface ships (rollout step 2).
- [ ] Mailgun webhook handlers wired and tested (bounce/complaint events flowing).
- [ ] `identify()` called on verification and confirmed to merge the anonymous profile (check a test user's event history stitches pre- and post-signup).
- [ ] Dashboards: one funnel per surface + weekly cohort view of verified accounts and 30-day return.

---

## 9. Rollout sketch

1. **Backend foundation** — tier field, capture + verify endpoints, templates, purge job, guardrails. Shippable dark (no UI).
2. **First surface** — "Subscribe to updates" CTA on question pages using the capture endpoint. Single surface, easy to watch.
3. **Gated-action capture** — swap the signin modal on vote-type actions for the email-first modal. This is one intervention point covering many actions; ship behind a flag and A/B against the current modal.
4. **Passwordless for existing users** — surface "email me a sign-in link" on the login form (the backend already supports it by construction).

Each step is independently valuable and independently reversible.

---

## 10. Variant for consideration: instant sign-in, deferred verification

Everything above assumes **verify-first**: email → code → signed in. There is a real alternative worth a deliberate product decision — **instant-session**: the moment a visitor enters an email, they are signed in on that device with an *unverified* session and can act immediately; verification happens later, asynchronously, when they tap the link in the confirmation email (which we were sending anyway). The code-entry step disappears from the signup happy path and relocates to the rare occasions that genuinely need proof: returning on a new device, first public action, account/email changes.

This works because the code step in the primary design is doing two separable jobs: proving email ownership, and creating a session. Only the first needs the email round-trip.

### Two things stay non-negotiable in either model

1. **No ongoing email until verified.** Double opt-in remains our spam defense, deliverability protection, and GDPR consent record. Consequence: in the instant-session model, the "notify me" promise is *unfulfilled* until they confirm — the success screen must honestly say "tap the link in the email we sent so notifications actually reach you," and an unverified account carries a persistent "confirm your email" banner.
2. **An unverified session never touches an existing account.** Anyone can type anyone's email. If the address belongs to an existing user, instant access to that account's identity, history, or subscriptions is out of the question.

### The design problem the variant introduces: existing-email collisions

If new emails get an instant session but existing emails get "check your inbox first," the visible branch reveals which emails have accounts. Two honest options:

- **Accept the enumeration leak.** Note the current signup already reveals email uniqueness at registration, so this is no worse than the status quo — but the primary design deliberately closed that hole.
- **Provisional identity + merge-on-verify (the clean fix).** Create the shadow row with a placeholder email (precedent: simplified signup's `autouser+…` addresses), hold the claimed address as an unverified attribute, and give *everyone* the identical instant session. On verification: if the address is free it becomes the account's email; if it belongs to an existing account, the provisional row's votes/subscriptions/actions merge into it. Cost: the merge logic is real new engineering, and it's the main build delta of this variant.

### Trade-offs at a glance

| | Verify-first (primary design) | Instant-session (this variant) |
|---|---|---|
| Signup friction | Two steps (email + code) | One step (email only) |
| Emails captured | Fewer, all verified | More, a fraction never verify |
| Verification rate | Very high — user is in-context, engaged | Lower — inbox inertia; needs good confirmation copy + nudges |
| Email typos | Caught in seconds ("no code arrived") | Silent failure — user believes they're subscribed and never hears from us |
| Time-to-value feeling | Delayed by one step | Immediate — actions (votes, saved state) land instantly |
| Existing-account handling | Identical flow, no enumeration | Requires merge-on-verify machinery, or accepting the enumeration leak |
| Cross-device access | Works immediately (verified email can receive codes) | None until verified — identity lives in a ~30-day cookie on one device |
| Metrics | "Accounts created" ≈ "emailable accounts" | Two very different numbers; funnel must track both |
| Engineering delta | Baseline | + merge-on-verify, + unverified-session capability gating, + confirm-email banner states |

### Recommendation

The instant-session variant is the stronger conversion design *if* we commit to its supporting cast: the provisional-identity/merge approach for collisions, the persistent confirm-your-email state as a first-class UI element, real copy investment in the confirmation email, and re-prompting on return visits. It particularly strengthens post-action capture (a vote or saved state lands the instant the email is typed — the commitment loop closes immediately). If we want to minimize scope for v1, ship verify-first and treat instant-session as a fast-follow — nothing in the foundation forecloses it, but the merge logic is easier to design in from the start than to retrofit. This is a product call on friction vs. certainty; engineering should scope the merge work either way.

## 11. Open questions

- **Verify-first vs. instant-session (§10)** — the highest-leverage open decision; it shapes the signup UX, the collision handling, and the engineering scope.
- Product decisions listed in §7 (modal UX, email copy, username timing, purge window, capability ladder).
- Engineering: full audit results of `is_active` / visibility assumptions (§6) — expect a short list of serializer/leaderboard touch points.
- Email ops: warm-up status and go/no-go timing for a new consumer stream.
- Legal/privacy: confirmation that double opt-in + purge policy satisfies our GDPR posture; privacy-policy update.
