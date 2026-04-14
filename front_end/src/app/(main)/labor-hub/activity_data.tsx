import { ActivityMonitorEntry } from "./sections/activity_monitor_interactive";

export type RawActivityMonitorEntry = Omit<ActivityMonitorEntry, "id"> & {
  markerLabel: string;
};

export const RAW_ACTIVITY_MONITOR_DATA: RawActivityMonitorEntry[] = [
  {
    date: "2026-04-06",
    markerLabel: "GPT-5 released",
    content: (
      <>
        <strong>📊 Update:</strong> 2030 employment projection declined 1.3
        percentage points in the week following the{" "}
        <strong>release of GPT-5</strong>.
      </>
    ),
  },
  {
    date: "2026-04-02",
    markerLabel: "Creative roles insight",
    content: (
      <>
        <strong>🧠 Forecaster insight:</strong>{" "}
        <em>
          &quot;I expect creative and interpersonal roles to remain most
          resistant to automation, though not immune.&quot;
        </em>
      </>
    ),
  },
  {
    date: "2026-03-18",
    markerLabel: "Amazon workforce cuts",
    content: (
      <>
        <strong>📰 News:</strong> Amazon cuts global corporate workforce by
        14,000, downsizing linked to AI.&quot; -{" "}
        <a href="#" className="underline hover:no-underline">
          Reuters
        </a>
      </>
    ),
  },
  {
    date: "2026-03-05",
    markerLabel: "Developer projection falls",
    content: (
      <>
        <strong>📊 Update:</strong> Software developer 2035 employment
        projection falls 7 percentage points as forecasters assess recent coding
        demonstrations and benchmark progress.
      </>
    ),
  },
  {
    date: "2026-02-24",
    markerLabel: "Warehouse automation jump",
    content: (
      <>
        <strong>📈 Tracker:</strong> Forecasted warehouse automation exposure
        increased after several major retailers expanded humanoid robot pilots
        across fulfillment centers.
      </>
    ),
  },
  {
    date: "2026-02-13",
    markerLabel: "Healthcare support stability",
    content: (
      <>
        <strong>🧠 Forecaster insight:</strong>{" "}
        <em>
          &quot;Healthcare support roles still look comparatively resilient
          because trust, regulation, and physical interaction slow near-term
          automation.&quot;
        </em>
      </>
    ),
  },
  {
    date: "2026-01-31",
    markerLabel: "Customer service benchmark",
    content: (
      <>
        <strong>📰 News:</strong> A new customer service benchmark prompted
        forecasters to revise expectations for call-center automation in the
        next five years.
      </>
    ),
  },
  {
    date: "2026-01-19",
    markerLabel: "Legal assistant rebound",
    content: (
      <>
        <strong>📊 Update:</strong> Legal assistant projections partially
        rebounded as forecasters weighed workflow friction and verification
        costs for high-stakes document review.
      </>
    ),
  },
  {
    date: "2025-12-18",
    markerLabel: "Manufacturing robotics expansion",
    content: (
      <>
        <strong>🏭 Industry signal:</strong> New factory robotics deployments
        pushed forecasters toward faster adoption timelines for repetitive
        assembly work.
      </>
    ),
  },
  {
    date: "2025-12-02",
    markerLabel: "Education tutoring caution",
    content: (
      <>
        <strong>🧠 Forecaster insight:</strong>{" "}
        <em>
          &quot;AI tutoring tools are improving quickly, but classroom adoption
          remains gated by policy, procurement, and parent trust.&quot;
        </em>
      </>
    ),
  },
  {
    date: "2025-11-20",
    markerLabel: "Translation model breakthrough",
    content: (
      <>
        <strong>📊 Update:</strong> Language-service job projections moved down
        after a high-profile multilingual model release narrowed quality gaps on
        professional translation tasks.
      </>
    ),
  },
  {
    date: "2025-11-06",
    markerLabel: "Finance ops slowdown",
    content: (
      <>
        <strong>💼 Market read:</strong> Forecasters slowed expected
        displacement in finance operations, citing compliance reviews and
        entrenched legacy systems.
      </>
    ),
  },
  {
    date: "2025-10-22",
    markerLabel: "Delivery routing boost",
    content: (
      <>
        <strong>📈 Tracker:</strong> Logistics-related forecasts shifted after
        autonomous routing systems showed stronger-than-expected savings in
        large fleet trials.
      </>
    ),
  },
  {
    date: "2025-10-07",
    markerLabel: "Design tools adoption",
    content: (
      <>
        <strong>🎨 Product signal:</strong> Wider enterprise rollout of AI
        design assistants led to more bearish medium-term forecasts for junior
        production design roles.
      </>
    ),
  },
  {
    date: "2025-09-16",
    markerLabel: "Public sector procurement lag",
    content: (
      <>
        <strong>🏛️ Constraint:</strong> Forecasters marked government and
        public-sector roles as slower to change because procurement and approval
        cycles remain lengthy.
      </>
    ),
  },
  {
    date: "2025-09-03",
    markerLabel: "Bookkeeping automation wave",
    content: (
      <>
        <strong>📊 Update:</strong> Bookkeeping employment forecasts dropped
        after new end-to-end accounting agents demonstrated improved accuracy on
        reconciliation workflows.
      </>
    ),
  },
];
