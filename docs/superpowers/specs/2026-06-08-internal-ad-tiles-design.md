# Internal Ad Tiles — Backend Design

**Date:** 2026-06-08
**Status:** Approved for planning
**Scope:** Backend only. Frontend rendering, exposure-rate dice-roll, every-n-tiles interleave
frequency, and `internalAdClicked` analytics are explicitly out of scope (handled on the frontend).

## Summary

Admins can create **AdTile**s in Django admin to self-promote initiatives (Labour Hub, indexes,
election map, tournaments, external URLs, etc.). Ad tiles are served ahead of the existing
auto-generated project feed tiles. The existing `get_feed_project_tiles()` mechanism and its
`/projects/feed-tiles/` endpoint become the **fallback** source, kept intact for backward
compatibility. A new endpoint returns a single priority-ordered list combining ad tiles (first)
and the auto-generated project tiles (fallback). Both the question feed and the question-detail
"Similar Questions" sidebar consume this endpoint; the frontend controls interleave frequency
(roughly every `n` tiles in the feed, `n/2` in the sidebar).

## Decisions (from brainstorming)

- **Ad model:** standalone content tile with its own fields, plus an **optional** `Project` FK.
  When a project is linked, the tile inherits sensible defaults (title, image). A project id is
  also derived from the `url` (best-effort) when the FK is absent, for dedup purposes.
- **Dismissals:** filtered **server-side** for authenticated users; anonymous users do **not** get
  a dismiss button. Stored in **Redis** (TTL'd), not a DB table.
- **Universal dismissal:** users can dismiss **both** ad tiles and auto-generated project tiles, so
  dismissal is keyed by a single opaque identifier carried on every tile (see `id` below).
- **Placement:** all active ads are eligible in both places; no per-ad placement targeting.
- **Endpoint shape:** one combined, ordered endpoint at `/api/ad-tiles/`.
- **Module placement:** the `misc` app. `get_feed_project_tiles()` stays where it is, untouched
  except for a docstring note marking it as the legacy/fallback source.
- **Deferred / out of scope:** custom HTML or coded-component escape hatch; categories /
  interest-matching; homepage hero promo slot; `internalAdClicked` analytics (frontend); exposure
  and frequency logic (frontend).

## Data model — `AdTile` (in `misc/models.py`)

```python
class AdTile(TimeStampedModel):
    title       = CharField(max_length=200, blank=True, default="")  # required unless `project` set (see clean())
    description = TextField(blank=True, default="")                  # optional
    image       = ImageField(null=True, blank=True)                  # optional (S3 ImageField, like Project)
    cta_text    = CharField(max_length=100, blank=True, default="")  # optional; FE renders CTA button only if set
    url         = CharField()                                        # mandatory

    project     = ForeignKey(Project, null=True, blank=True, on_delete=SET_NULL)
                  # optional; provides default title/image + powers dedup against auto project tiles

    is_active     = BooleanField(default=False)                      # admin master on/off switch
    publish_at    = DateTimeField(null=True, blank=True)             # optional scheduled start
    expires_at    = DateTimeField(null=True, blank=True)             # optional auto-hide ("Expiration Date")

    order         = PositiveIntegerField(default=0)                  # lower = higher priority (matches SidebarItem)
    exposure_rate = PositiveSmallIntegerField(default=100)           # 1..100, % shown; dice-roll on FE

    class Meta:
        ordering = ("order", "-created_at")
```

### Naming rationale: `is_active` vs `publish_at`

`is_active` is the admin's master enable switch ("approved to run at all"), kept distinct from the
schedule window so that "active, scheduled to start tomorrow" is not self-contradictory the way
`is_published=True` + future publish date would be. `is_active` also serves as an instant
kill-switch independent of dates.

### Effective-value inheritance (mirrors `SidebarItem.display_name`)

```python
@property
def display_title(self):
    return self.title or (self.project.name if self.project_id else "")

@property
def display_image(self):
    return self.image or (self.project.header_image if self.project_id else None)
```

### "Active" predicate

```python
is_active
and (publish_at is None or publish_at <= now)
and (expires_at is None or expires_at > now)
```

### Exposure rate

Integer **1–100, default 100**. Backend only stores and returns it. The show/hide probability roll
happens on the frontend.

## Dedup against auto-generated project tiles

When an ad points at a project that would also surface via `get_feed_project_tiles()`, the ad wins
and the auto-tile for that project is dropped. Ad → project links are gathered two ways:

1. The explicit `project` FK.
2. Best-effort parse of a project slug from `url` (regex for `/(tournament|index|...)/<slug>/`,
   then `Project.objects.filter(slug=...)`). Purely best-effort: if it doesn't resolve, no dedup
   and no error.

## Serving logic — new file `misc/services/ad_tiles.py`

`get_feed_project_tiles()` (in `projects/services/common.py`) and `/projects/feed-tiles/` are left
intact; only a docstring note is added marking them as the legacy/fallback source. The new service
composes on top:

```python
def get_active_ad_tiles(user) -> list[AdTile]:
    # active-predicate filter, ordered by (order, -created_at);
    # for authenticated users, drop tiles whose dismiss id is in the user's Redis set

def get_combined_feed_tiles(user) -> list[dict]:
    ads = get_active_ad_tiles(user)
    excluded_project_ids = {derived project ids from ads}
    project_tiles = [
        t for t in get_feed_project_tiles()
        if t["project_id"] not in excluded_project_ids
    ]
    # for authenticated users, also drop dismissed project tiles
    return serialize(ads) + serialize(project_tiles)   # ads first, fallback second
```

## Dismissals — Redis, authenticated users only

- **Unified opaque identifier (`id`):** every tile in the response — ad **and** auto project tile —
  carries an `id` that is both the React key and the dismiss handle. The frontend treats it as
  opaque.
  - Ad tile → `id = "ad:{pk}"`
  - Auto project tile → `id = "project:{project_id}:{rule}"`
- **Storage:** per-(user, id) Redis keys, e.g. `tile:dismissed:{user_id}:{id}`, with a TTL
  (proposed 90 days). Serving does one `cache.get_many` over the active tiles' keys to filter —
  cheap, since the active set is small.
- **Why Redis over a DB table:** ads are ephemeral, TTL lets a dismissal naturally lapse, and we
  avoid an ever-growing join table. (The `BulletinViewedBy` model is the existing DB-based
  precedent; we intentionally diverge.)

### TODO (not implemented now): re-fire-safe dismissal keys for project tiles

Once `get_feed_project_tiles()` is extended to emit an **event date** per rule trigger, mix it into
the project tile id (`project:{project_id}:{rule}:{event_date}`). This prevents a stale dismissal
from permanently suppressing a re-fired rule — e.g. Project A gets `NEW_QUESTIONS`, the user
dismisses it, and later a *second* round of new questions fires the same rule again. With the event
date in the key, the new occurrence has a fresh id and reappears. Documented here; do **not**
implement in this iteration.

## Endpoints (in `misc/urls.py`, mounted under `api/`)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET  | `/api/ad-tiles/`         | AllowAny | Combined ordered list `[ads…, fallback project tiles…]`, each item carrying `id`. |
| POST | `/api/ad-tiles/dismiss/` | Authed   | Body `{ id }`; persist dismissal in Redis. Anonymous → no-op `200` (mirrors `cancel_bulletin`). |

### Response shape

```jsonc
[
  {
    "type": "ad",
    "id": "ad:5",
    "ad": {
      "title": "...",           // display_title (own title or inherited project.name)
      "description": "...",
      "image": "https://...",   // display_image (own image or inherited project.header_image)
      "cta_text": "...",        // empty string if no CTA
      "url": "https://...",
      "exposure_rate": 100,
      "project_id": 12           // null if no linked project
    }
  },
  {
    "type": "project",
    "id": "project:12:NEW_QUESTIONS",
    "project": { /* serialize_tournaments_with_counts output */ },
    "rule": "NEW_QUESTIONS",
    "recently_opened_questions": 4,
    "recently_resolved_questions": 0,
    "all_questions_resolved": false,
    "project_resolution_date": null
  }
]
```

The `project` payload reuses `serialize_tournaments_with_counts` (the same serializer
`/projects/feed-tiles/` uses), preserving frontend compatibility for the project-tile branch.

## Admin (`misc/admin.py`)

`@admin.register(AdTile)` `ModelAdmin`, following the `SidebarItemAdmin` pattern:

- `list_display`: `title` (or display_title), `is_active`, `order`, `exposure_rate`, `publish_at`,
  `expires_at`, `project`.
- `list_filter`: `is_active`.
- `ordering`: `("order",)`. Search on `title`.
- `AdTileAdminForm.clean()` validations (mirrors `SidebarItemAdminForm`'s project↔fields checks):
  - **title required unless `project` is set** (inherits `project.name` otherwise).
  - `exposure_rate` within 1–100.
  - if both `publish_at` and `expires_at` set, require `expires_at > publish_at`.

## Components & boundaries

- `misc/models.py` — `AdTile` model + `display_title` / `display_image` properties + active-predicate
  helper.
- `misc/services/ad_tiles.py` — `get_active_ad_tiles`, `get_combined_feed_tiles`, dismissal
  read/write helpers, project-id-from-url parser, tile `id` builders. Imports
  `get_feed_project_tiles` from `projects/services/common.py`.
- `misc/serializers.py` — `AdTileSerializer` and the combined-tile response assembly.
- `misc/views.py` — `ad_tiles_api_view` (GET), `dismiss_ad_tile_api_view` (POST).
- `misc/urls.py` — two new routes.
- `misc/admin.py` — `AdTileAdmin` + `AdTileAdminForm`.
- Migration for the new model.

## Testing

- Model: active-predicate across `is_active` / `publish_at` / `expires_at` combinations; inheritance
  properties with and without a linked project.
- Service: ordering (ads first, then fallback); dedup by explicit FK and by url-parsed slug;
  per-user dismissal filtering for ads and project tiles; anonymous users see no filtering.
- Dismiss endpoint: authed persists to Redis and the tile disappears on the next GET; anonymous is a
  no-op 200.
- Admin form: title-required-unless-project, exposure-rate range, date ordering.
- URL-slug parser: matches tournament/index URLs, ignores unrelated URLs.
