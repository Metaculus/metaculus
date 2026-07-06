import { ActivityMonitorEntry } from "./sections/activity_monitor_interactive";

export type RawActivityMonitorEntry = Omit<ActivityMonitorEntry, "id"> & {
  markerLabel?: string;
};

export const RAW_ACTIVITY_MONITOR_DATA: RawActivityMonitorEntry[] = [
  {
    date: "2026-03-22",
    type: "comment",
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
          rel="noreferrer noopener"
        >
          Nathan Metzger (Haiku)
        </a>
      </>
    ),
  },
  {
    date: "2026-03-24",
    type: "insight",
    content: (
      <>
        Anthropic’s Economic Index Report shows where and how Claude is being
        used across the US -{" "}
        <a
          href="https://www.anthropic.com/economic-index#us-usage"
          target="_blank"
          rel="noreferrer noopener"
        >
          Anthropic
        </a>
      </>
    ),
  },
  {
    date: "2026-03-30",
    type: "comment",
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
          rel="noreferrer noopener"
        >
          Adonis
        </a>
      </>
    ),
  },
  {
    date: "2026-04-07",
    type: "news",
    content: (
      <>
        Anthropic publishes a system card for Claude Mythos, a model so capable
        at finding software vulnerabilities that it&apos;s being withheld from
        public release and shared with ~50 security partners. -{" "}
        <a
          href="https://www.anthropic.com/glasswing"
          target="_blank"
          rel="noreferrer noopener"
        >
          Anthropic
        </a>
      </>
    ),
  },
  {
    date: "2026-04-09",
    type: "insight",
    content: (
      <>
        A survey shows that half of employed AI users use AI for work at least
        as much as for personal tasks, to both automate and augment their tasks
        -{" "}
        <a
          href="https://epoch.ai/blog/half-of-employed-ai-users-now-use-it-for-work"
          target="_blank"
          rel="noreferrer noopener"
        >
          Epoch AI
        </a>
      </>
    ),
  },
  {
    date: "2026-04-23",
    type: "news",
    content: (
      <>
        OpenAI launches their latest GPT 5.5 model -{" "}
        <a
          href="https://openai.com/index/introducing-gpt-5-5/"
          target="_blank"
          rel="noreferrer noopener"
        >
          OpenAI
        </a>
      </>
    ),
  },
  {
    date: "2026-04-24",
    type: "news",
    content: (
      <>
        Meta and Microsoft announce 20,000 layoffs, with speculation that AI may
        be a contributing factor -{" "}
        <a
          href="https://www.cnbc.com/2026/04/24/20k-job-cuts-at-meta-microsoft-raise-concern-of-ai-labor-crisis-.html"
          target="_blank"
          rel="noreferrer noopener"
        >
          CNBC
        </a>
      </>
    ),
  },
  {
    date: "2026-05-07",
    type: "insight",
    content: (
      <>
        The Budget Lab research center at Yale publishes a study on the effects
        that AI tools are having on the labor market that finds no clear effects
        as of yet -{" "}
        <a
          href="https://budgetlab.yale.edu/research/what-we-do-and-dont-know-about-how-ai-affecting-labor-market"
          target="_blank"
          rel="noreferrer noopener"
        >
          The Budget Lab at Yale
        </a>
      </>
    ),
  },
  {
    date: "2026-05-14",
    type: "insight",
    content: (
      <>
        Indeed Hiring Lab releases a report based on structural modeling
        documenting anticipated labor effects of AI -{" "}
        <a
          href="https://www.hiringlab.org/2026/05/14/how-a-shrinking-workforce-ai-and-labor-reallocation-will-define-the-next-15-years/"
          target="_blank"
          rel="noreferrer noopener"
        >
          Indeed Hiring Lab
        </a>
      </>
    ),
  },
  {
    date: "2026-05-15",
    type: "insight",
    content: (
      <>
        Pope Leo XIV publishes an encyclical addressing human dignity in the era
        of artificial intelligence -{" "}
        <a
          href="https://www.vatican.va/content/leo-xiv/en/encyclicals/documents/20260515-magnifica-humanitas.html"
          target="_blank"
          rel="noreferrer noopener"
        >
          The Vatican
        </a>
      </>
    ),
  },
  {
    date: "2026-05-19",
    type: "news",
    content: (
      <>
        Google launches Gemini 3.5, their latest model -{" "}
        <a
          href="https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-5/"
          target="_blank"
          rel="noreferrer noopener"
        >
          Google
        </a>
      </>
    ),
  },
  {
    date: "2026-05-21",
    type: "news",
    content: (
      <>
        California Governor issues executive order to explore policies related
        to AI-driven workforce disruption -{" "}
        <a
          href="https://www.gov.ca.gov/2026/05/21/governor-newsom-signs-first-of-its-kind-executive-order-to-prepare-workers-and-businesses-for-potential-ai-disruption/"
          target="_blank"
          rel="noreferrer noopener"
        >
          Office of Governor Gavin Newsom
        </a>
      </>
    ),
  },
  {
    date: "2026-05-28",
    type: "news",
    content: (
      <>
        Anthropic releases Claude Opus 4.8 -{" "}
        <a
          href="https://www.anthropic.com/news/claude-opus-4-8"
          target="_blank"
          rel="noreferrer noopener"
        >
          Anthropic
        </a>
      </>
    ),
  },
  {
    date: "2026-06-09",
    type: "news",
    content: (
      <>
        Anthropic launches Claude Fable 5, a Mythos-class model made safe for
        general use, and 3 days later the US government restricts all public
        use. -{" "}
        <a
          href="https://www.anthropic.com/news/claude-fable-5-mythos-5"
          target="_blank"
          rel="noreferrer noopener"
        >
          Anthropic
        </a>
      </>
    ),
  },
];
