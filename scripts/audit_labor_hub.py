"""
Labor Hub narrative audit script.

Fetches live forecast data from the Metaculus API and checks it against
hardcoded claims in the labor hub page source. Prints a pass/fail report.

Usage:
  python3 audit_labor_hub.py           # hits live Metaculus API (requires network access)
  python3 audit_labor_hub.py --mock    # uses synthetic data to validate assertion logic
"""

import sys
import requests

API_BASE = "https://www.metaculus.com/api"

USE_MOCK = "--mock" in sys.argv

# ── Job post IDs (from data.ts) ────────────────────────────────────────────
JOBS = {
    "Laborers and Movers":          42626,
    "Construction Workers":         42625,
    "Janitors and Cleaners":        42624,
    "Restaurant Servers":           42623,
    "Law Enforcement":              42622,
    "Physicians":                   42621,
    "Registered Nurses":            42620,
    "K-12 Teachers":                42619,
    "Lawyers and Law Clerks":       42618,
    "Services Sales Representatives": 42617,
    "Designers":                    42615,
    "Engineers":                    42614,
    "Software Developers":          42613,
    "Financial Specialists":        42612,
    "General Managers":             41308,
}

# ── Other question post IDs (from page.tsx) ────────────────────────────────
OTHER_POSTS = {
    "ai_daily_usage":        42215,   # % workers using AI daily
    "youth_unemployment":    42212,   # unemployment rate for recent grads
    "hours_worked":          41574,   # average weekly hours worked
    "trade_school_growth":   42856,   # trade school & CC degrees change
    "overall_employment":    41307,   # overall employment change
}

# ── Hardcoded narrative vs. chart data mismatches (static, no API needed) ──
STATIC_ASSERTIONS = [
    {
        "claim":    "12% of workers using AI daily as of late 2025",
        "source":   "page.tsx:326",
        "narrative_value": 12,
        "chart_value":     10,
        "tolerance":       0.5,
    },
    {
        "claim":    "current 6% youth unemployment",
        "source":   "key_insights.tsx:152",
        "narrative_value": 6.0,
        "chart_value":     5.4,
        "tolerance":       0.5,
    },
    {
        "claim":    "down from 38 now (hours worked)",
        "source":   "key_insights.tsx:139",
        "narrative_value": 38.0,
        "chart_value":     38.3,
        "tolerance":       0.5,
    },
]


def scale_internal_location(x, scaling):
    """Port of scaleInternalLocation from utils/math.ts"""
    range_min = scaling.get("range_min")
    range_max = scaling.get("range_max")
    zero_point = scaling.get("zero_point")

    if range_max is None or range_min is None:
        return x

    if zero_point is not None:
        deriv_ratio = (range_max - zero_point) / (range_min - zero_point)
        return range_min + ((range_max - range_min) * (deriv_ratio ** x - 1)) / (deriv_ratio - 1)
    else:
        return range_min + (range_max - range_min) * x


def get_median_for_label(post, year_label):
    """Extract the scaled median forecast for a given year label from a post."""
    questions = (post.get("group_of_questions") or {}).get("questions", [])
    for q in questions:
        if q.get("label") == year_label:
            method = q.get("default_aggregation_method", "recency_weighted")
            aggs = q.get("aggregations", {})
            latest = (aggs.get(method) or {}).get("latest") or {}
            centers = latest.get("centers")
            if not centers:
                return None
            center = centers[0]
            if center is None:
                return None
            scaling = q.get("scaling", {})
            return scale_internal_location(center, scaling)
    return None


def fetch_posts(post_ids):
    """Fetch all posts in one batched API call."""
    ids_param = "&".join(f"ids={pid}" for pid in post_ids)
    url = f"{API_BASE}/posts/?with_cp=true&include_cp_history=true&{ids_param}&limit={len(post_ids)}"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    return {post["id"]: post for post in data.get("results", [])}


def make_mock_post(post_id, forecasts_by_label):
    """
    Build a minimal fake post structure that get_median_for_label can read.
    forecasts_by_label: dict of {year_label: value} — values are already scaled.
    Since they're pre-scaled, we use range_min=value, range_max=value so
    scaleInternalLocation returns the value regardless of center.
    We just pass center=0.5 and set range so that 0.5 maps to the target value.
    Simpler: set scaling range_min=2*v, range_max=0 with zero_point=None so
    scaled = range_min + (range_max - range_min)*0.5 = v. Actually simplest:
    use range_min=v, range_max=v → scaled = v for any center. But range_min==range_max
    would be degenerate. Instead: range_min = v - 1, range_max = v + 1, center = 0.5.
    """
    questions = []
    for label, value in forecasts_by_label.items():
        # Linear scaling: scaled = range_min + (range_max - range_min) * center
        # We want scaled = value when center = 0.5
        # → value = (lo + hi) / 2  with  hi - lo = 2  → lo = value-1, hi = value+1
        questions.append({
            "label": label,
            "default_aggregation_method": "recency_weighted",
            "aggregations": {
                "recency_weighted": {
                    "latest": {"centers": [0.5]}
                }
            },
            "scaling": {
                "range_min": value - 1,
                "range_max": value + 1,
                "zero_point": None,
            },
        })
    return {
        "id": post_id,
        "group_of_questions": {"questions": questions},
    }


def build_mock_posts():
    """
    Synthetic forecast data that mirrors plausible current community forecasts.
    Key intentional discrepancy: K-12 Teachers 2035 is slightly negative (-1.5%),
    which contradicts the narrative claiming teachers see 'highest growth'.
    All other values are constructed to be internally consistent with the
    other narrative claims (nurses positive, software negative, etc.).
    """
    job_forecasts = {
        # post_id: {label: value_%}
        JOBS["Laborers and Movers"]:            {"2027":  0.5, "2030": -5.0, "2035": -18.0},
        JOBS["Construction Workers"]:           {"2027":  1.2, "2030":  3.5, "2035":   1.5},
        JOBS["Janitors and Cleaners"]:          {"2027":  0.8, "2030":  1.0, "2035":   0.5},
        JOBS["Restaurant Servers"]:             {"2027":  1.0, "2030":  2.0, "2035":   4.0},
        JOBS["Law Enforcement"]:                {"2027":  0.5, "2030":  0.5, "2035":   0.5},
        JOBS["Physicians"]:                     {"2027":  1.5, "2030":  3.0, "2035":   5.0},
        JOBS["Registered Nurses"]:              {"2027":  1.8, "2030":  4.0, "2035":   8.0},
        # K-12 Teachers intentionally negative in 2035 — the known discrepancy
        JOBS["K-12 Teachers"]:                  {"2027":  1.0, "2030":  1.5, "2035":  -1.5},
        JOBS["Lawyers and Law Clerks"]:         {"2027": -0.5, "2030": -8.0, "2035": -22.0},
        JOBS["Services Sales Representatives"]: {"2027": -0.5, "2030": -6.0, "2035": -20.0},
        JOBS["Designers"]:                      {"2027": -0.3, "2030": -4.0, "2035": -15.0},
        JOBS["Engineers"]:                      {"2027":  1.0, "2030":  2.0, "2035":   3.0},
        JOBS["Software Developers"]:            {"2027": -1.0, "2030":-12.0, "2035": -30.0},
        JOBS["Financial Specialists"]:          {"2027": -0.5, "2030": -7.0, "2035": -19.0},
        JOBS["General Managers"]:               {"2027":  0.5, "2030": -1.0, "2035":  -3.0},
        OTHER_POSTS["ai_daily_usage"]:          {"2030": 40.0, "2035": 65.0},
        OTHER_POSTS["youth_unemployment"]:      {"2030":  8.0, "2035": 12.0},  # ~2.2x 5.4%
        OTHER_POSTS["hours_worked"]:            {"2030": 37.0, "2035": 34.5},
        OTHER_POSTS["overall_employment"]:      {"2027":  0.8, "2030": -2.0, "2035": -8.0},
    }
    return {pid: make_mock_post(pid, forecasts) for pid, forecasts in job_forecasts.items()}


# ── Assertion helpers ──────────────────────────────────────────────────────

results = []

def check(passed, claim, source, detail=""):
    results.append({"passed": passed, "claim": claim, "source": source, "detail": detail})

def assert_positive(posts, post_id, year, claim, source):
    post = posts.get(post_id)
    if post is None:
        check(False, claim, source, f"post {post_id} not found in API response")
        return
    val = get_median_for_label(post, year)
    if val is None:
        check(False, claim, source, f"no forecast value for label '{year}'")
        return
    check(val > 0, claim, source, f"forecast={val:.2f}%")

def assert_negative(posts, post_id, year, claim, source):
    post = posts.get(post_id)
    if post is None:
        check(False, claim, source, f"post {post_id} not found in API response")
        return
    val = get_median_for_label(post, year)
    if val is None:
        check(False, claim, source, f"no forecast value for label '{year}'")
        return
    check(val < 0, claim, source, f"forecast={val:.2f}%")

def assert_top_n(posts, job_post_ids, year, target_post_id, n, direction, claim, source):
    """Check that target is among the top-n by value (direction='highest' or 'lowest')."""
    values = {}
    for pid in job_post_ids:
        post = posts.get(pid)
        if post is None:
            continue
        val = get_median_for_label(post, year)
        if val is not None:
            values[pid] = val

    if target_post_id not in values:
        check(False, claim, source, f"target post {target_post_id} has no forecast for {year}")
        return

    sorted_pids = sorted(values, key=values.get, reverse=(direction == "highest"))
    top_n_pids = set(sorted_pids[:n])
    target_val = values[target_post_id]
    passed = target_post_id in top_n_pids
    rank = sorted_pids.index(target_post_id) + 1
    check(passed, claim, source, f"rank={rank}/{len(values)}, forecast={target_val:.2f}%")

def assert_approx_double(posts, post_id, year, baseline, tolerance_pct, claim, source):
    """Check that the 2035 forecast is approximately double the given baseline."""
    post = posts.get(post_id)
    if post is None:
        check(False, claim, source, f"post {post_id} not found")
        return
    val = get_median_for_label(post, year)
    if val is None:
        check(False, claim, source, f"no forecast value for label '{year}'")
        return
    expected = baseline * 2
    passed = abs(val - expected) <= tolerance_pct
    check(passed, claim, source, f"forecast={val:.2f}%, expected≈{expected:.1f}% (2×{baseline}%), diff={val-expected:+.2f}pp")

def assert_approx(posts, post_id, year, expected, tolerance, claim, source):
    post = posts.get(post_id)
    if post is None:
        check(False, claim, source, f"post {post_id} not found")
        return
    val = get_median_for_label(post, year)
    if val is None:
        check(False, claim, source, f"no forecast value for label '{year}'")
        return
    passed = abs(val - expected) <= tolerance
    check(passed, claim, source, f"forecast={val:.2f}, expected≈{expected} ± {tolerance}, diff={val-expected:+.2f}")


def main():
    if USE_MOCK:
        print("Running in MOCK mode — using synthetic forecast data.\n")
        posts = build_mock_posts()
        print(f"Loaded {len(posts)} mock posts.\n")
    else:
        print("Fetching posts from Metaculus API...\n")
        all_post_ids = list(JOBS.values()) + list(OTHER_POSTS.values())
        posts = fetch_posts(all_post_ids)
        print(f"Fetched {len(posts)} posts.\n")

    job_post_ids = list(JOBS.values())

    # ── Static (no API) assertions ─────────────────────────────────────────
    for s in STATIC_ASSERTIONS:
        diff = abs(s["narrative_value"] - s["chart_value"])
        passed = diff <= s["tolerance"]
        check(passed, s["claim"], s["source"],
              f"narrative={s['narrative_value']}, chart={s['chart_value']}, diff={diff:.1f} (tolerance={s['tolerance']})")

    # ── jobs_insights.tsx 2027 ─────────────────────────────────────────────
    assert_positive(posts, JOBS["Registered Nurses"], "2027",
        "By 2027, nurses expected to see mild growth",
        "jobs_insights.tsx:5")

    assert_negative(posts, JOBS["Software Developers"], "2027",
        "By 2027, software developers start seeing a contraction",
        "jobs_insights.tsx:9")

    # ── jobs_insights.tsx 2030 ─────────────────────────────────────────────
    assert_positive(posts, JOBS["Construction Workers"], "2030",
        "By 2030, construction expected to grow",
        "jobs_insights.tsx:19")

    assert_positive(posts, JOBS["Registered Nurses"], "2030",
        "By 2030, healthcare expected to grow",
        "jobs_insights.tsx:19")

    assert_negative(posts, JOBS["Software Developers"], "2030",
        "By 2030, software developers expected to see steep decline",
        "jobs_insights.tsx:26")

    assert_negative(posts, JOBS["Financial Specialists"], "2030",
        "By 2030, financial roles begin to see sharper effects",
        "jobs_insights.tsx:28")

    assert_negative(posts, JOBS["Services Sales Representatives"], "2030",
        "By 2030, sales roles begin to see sharper effects",
        "jobs_insights.tsx:28")

    # ── jobs_insights.tsx 2035 positive ───────────────────────────────────
    assert_positive(posts, JOBS["Registered Nurses"], "2035",
        "By 2035, nurses expected to see the highest growth",
        "jobs_insights.tsx:37")

    assert_top_n(posts, job_post_ids, "2035", JOBS["Registered Nurses"], 3, "highest",
        "By 2035, nurses expected to see the HIGHEST growth (top 3)",
        "jobs_insights.tsx:37")

    assert_positive(posts, JOBS["K-12 Teachers"], "2035",
        "By 2035, teachers expected to see the highest growth",
        "jobs_insights.tsx:37")

    assert_top_n(posts, job_post_ids, "2035", JOBS["K-12 Teachers"], 3, "highest",
        "By 2035, teachers expected to see the HIGHEST growth (top 3)",
        "jobs_insights.tsx:37")

    assert_positive(posts, JOBS["Janitors and Cleaners"], "2035",
        "By 2035, janitors see muted growth (should be positive)",
        "jobs_insights.tsx:39")

    assert_positive(posts, JOBS["Construction Workers"], "2035",
        "By 2035, construction workers see muted growth (should be positive)",
        "jobs_insights.tsx:40")

    # ── jobs_insights.tsx 2035 negative ───────────────────────────────────
    assert_negative(posts, JOBS["Software Developers"], "2035",
        "By 2035, software sees sharp staff reductions",
        "jobs_insights.tsx:44")

    assert_negative(posts, JOBS["Services Sales Representatives"], "2035",
        "By 2035, sales sees sharp staff reductions",
        "jobs_insights.tsx:45")

    assert_negative(posts, JOBS["Financial Specialists"], "2035",
        "By 2035, finance sees sharp staff reductions",
        "jobs_insights.tsx:45")

    assert_negative(posts, JOBS["Lawyers and Law Clerks"], "2035",
        "By 2035, law sees sharp staff reductions",
        "jobs_insights.tsx:45")

    assert_negative(posts, JOBS["Laborers and Movers"], "2035",
        "By 2035, laborers see a sharp contraction",
        "jobs_insights.tsx:50")

    assert_negative(posts, JOBS["Designers"], "2035",
        "By 2035, designers see a sharp contraction",
        "jobs_insights.tsx:51")

    # ── key_insights.tsx fallback text ────────────────────────────────────
    assert_negative(posts, JOBS["Software Developers"], "2035",
        "[Fallback] Software developers see largest decreases",
        "key_insights.tsx:128")

    assert_negative(posts, JOBS["Lawyers and Law Clerks"], "2035",
        "[Fallback] Lawyers and law clerks see largest decreases",
        "key_insights.tsx:128")

    assert_negative(posts, JOBS["Laborers and Movers"], "2035",
        "[Fallback] Laborers and movers see largest decreases",
        "key_insights.tsx:129")

    assert_top_n(posts, job_post_ids, "2035", JOBS["Software Developers"], 3, "lowest",
        "[Fallback] Software developers among bottom 3 in 2035",
        "key_insights.tsx:128")

    assert_top_n(posts, job_post_ids, "2035", JOBS["Lawyers and Law Clerks"], 3, "lowest",
        "[Fallback] Lawyers among bottom 3 in 2035",
        "key_insights.tsx:128")

    assert_top_n(posts, job_post_ids, "2035", JOBS["Laborers and Movers"], 3, "lowest",
        "[Fallback] Laborers among bottom 3 in 2035",
        "key_insights.tsx:129")

    assert_positive(posts, JOBS["Registered Nurses"], "2035",
        "[Fallback] Registered nurses projected to grow",
        "key_insights.tsx:130")

    assert_positive(posts, JOBS["K-12 Teachers"], "2035",
        "[Fallback] K-12 teachers projected to grow",
        "key_insights.tsx:130")

    assert_positive(posts, JOBS["Restaurant Servers"], "2035",
        "[Fallback] Restaurant servers projected to grow",
        "key_insights.tsx:130")

    # ── research.tsx narrative ─────────────────────────────────────────────
    assert_positive(posts, JOBS["K-12 Teachers"], "2035",
        "Research: teachers predicted to see growth despite high exposure",
        "research.tsx:65")

    assert_negative(posts, JOBS["Laborers and Movers"], "2035",
        "Research: warehouse workers displaced by robotics by 2035",
        "research.tsx:69")

    assert_negative(posts, JOBS["Lawyers and Law Clerks"], "2035",
        "Research: lawyers expected to see significant employment reductions",
        "research.tsx:72")

    assert_negative(posts, JOBS["Services Sales Representatives"], "2035",
        "Research: sales expected to see significant employment reductions",
        "research.tsx:72")

    assert_negative(posts, JOBS["Financial Specialists"], "2035",
        "Research: financial specialists expected to see significant employment reductions",
        "research.tsx:72")

    assert_negative(posts, JOBS["Software Developers"], "2035",
        "Research: software developers expected to see significant employment reductions",
        "research.tsx:72")

    # ── page.tsx Graduates section ─────────────────────────────────────────
    # "unemployment rate for new graduates expected to have doubled in 2035"
    # baseline from chart: 5.4% in 2025 → should be ~10.8% in 2035
    assert_approx_double(
        posts, OTHER_POSTS["youth_unemployment"], "2035",
        baseline=5.4, tolerance_pct=3.0,
        claim="Graduate unemployment expected to have doubled by 2035 (from 5.4% → ~10.8%)",
        source="page.tsx:429")

    # ── page.tsx Wages section ─────────────────────────────────────────────
    # "workweek expected to become four hours shorter by 2035" from 38.3 baseline
    assert_approx(
        posts, OTHER_POSTS["hours_worked"], "2035",
        expected=38.3 - 4, tolerance=1.5,
        claim="Workweek four hours shorter by 2035 (forecast ≈ 34.3h)",
        source="page.tsx:182")

    # ── Print results ──────────────────────────────────────────────────────
    passed = [r for r in results if r["passed"]]
    failed = [r for r in results if not r["passed"]]

    print(f"{'='*70}")
    print(f"  RESULTS: {len(passed)} passed, {len(failed)} failed out of {len(results)} assertions")
    print(f"{'='*70}\n")

    if failed:
        print("FAILURES:")
        for r in failed:
            print(f"  ✗  {r['claim']}")
            print(f"     source: {r['source']}")
            print(f"     detail: {r['detail']}")
            print()

    if passed:
        print("PASSES:")
        for r in passed:
            print(f"  ✓  {r['claim']}")
            print(f"     detail: {r['detail']}")
            print()


if __name__ == "__main__":
    main()
