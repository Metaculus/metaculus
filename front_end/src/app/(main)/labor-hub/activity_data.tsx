import { ActivityMonitorEntry } from "./sections/activity_monitor_interactive";

export type RawActivityMonitorEntry = Omit<ActivityMonitorEntry, "id"> & {
  markerLabel?: string;
};

export const RAW_ACTIVITY_MONITOR_DATA: RawActivityMonitorEntry[] = [
  {
    date: "2026-03-22",
    content: (
      <>
        <em>
          “Huge numbers of jobs could hinge on the success or failure of some
          particular strike, or bill, or lawsuit. We should weigh the political
          power of the workers in each occupation, alongside AI capability
          considerations.”
        </em>{" "}
        -{" "}
        <a
          href="https://www.metaculus.com/accounts/profile/145394/comments/#comment-768524"
          target="_blank"
          rel="noreferrer"
        >
          Nathan Metzger (Haiku)
        </a>
      </>
    ),
  },
  {
    date: "2026-03-24",
    content: (
      <>
        Anthropic’s Economic Index Report shows where and how Claude is being
        used across the US -{" "}
        <a
          href="https://www.anthropic.com/economic-index#us-usage"
          target="_blank"
          rel="noreferrer"
        >
          Anthropic
        </a>
      </>
    ),
  },
  {
    date: "2026-03-30",
    content: (
      <>
        <em>
          “I expect that, before 2035, the decision to reduce the number of
          employees will ultimately always be taken by humans, who have loss
          aversion and a tendency to preserve the status quo.”
        </em>{" "}
        -{" "}
        <a
          href="https://www.metaculus.com/questions/41307/us-employment-level-change-vs-2025/#comment-779184"
          target="_blank"
          rel="noreferrer"
        >
          Adonis
        </a>
      </>
    ),
  },
  {
    date: "2026-04-07",
    content: (
      <>
        Anthropic published a system card for Claude Mythos, a model so capable
        at finding software vulnerabilities that it&apos;s being withheld from
        public release and shared with ~50 security partners. -{" "}
        <a
          href="https://www.anthropic.com/glasswing"
          target="_blank"
          rel="noreferrer"
        >
          Anthropic
        </a>
      </>
    ),
  },
  {
    date: "2026-04-09",
    content: (
      <>
        A survey shows that half of employed AI users use AI for work at least
        as much as for personal tasks, to both automate and augment their tasks
        -{" "}
        <a
          href="https://epoch.ai/blog/half-of-employed-ai-users-now-use-it-for-work"
          target="_blank"
          rel="noreferrer"
        >
          Epoch AI
        </a>
      </>
    ),
  },
];
