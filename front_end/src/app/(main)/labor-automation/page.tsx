import { Metadata } from "next";
import Image from "next/image";

import ForecastCard from "@/components/forecast_card";
import ServerPostsApi from "@/services/api/posts/posts.server";

import LaborHubHeader from "./components/labor-hub-header";
import LaborHubInfo from "./components/labor-hub-info";
import { SectionHeader } from "./components/section";
import { ActivityMonitorSection } from "./sections/activity-monitor";
import { JobsMonitorSection } from "./sections/jobs-monitor";
import { MethodologySection } from "./sections/methodology";

//import PercentageForecastCard from "@/components/consumer_post_card/group_forecast_card/percentage_forecast_card";
//import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
//import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "jobs", label: "Jobs" },
  { id: "wages", label: "Wages" },
  { id: "deep-dive", label: "Deep Dive" },
  { id: "methodology", label: "Methodology" },
];

export const metadata: Metadata = {
  title: "Labor Automation Forecasting Hub | Metaculus",
  description:
    "Real-time forecasts from our global forecasting community on the future of the US workforce as AI advances.",
};

// TODO: Replace with actual post IDs for featured labor automation questions
const FEATURED_POST_IDS: number[] = [40866, 14732];

async function getFeaturedPosts() {
  if (FEATURED_POST_IDS.length === 0) {
    return [];
  }

  const results = await Promise.all(
    FEATURED_POST_IDS.map((id) => ServerPostsApi.getPost(id, true))
  );

  return results;
}

export default async function LaborAutomationHubPage() {
  const [topRightQ, topLeftQ] = await getFeaturedPosts();

  return (
    <main className="relative mb-24 mt-12 min-h-screen">
      <div className="mx-auto w-full max-w-7xl sm:px-8 md:px-12 lg:px-16">
        {/* Hero Section */}
        <section className="flex flex-col gap-10 rounded-t-md bg-gray-0 px-10 pt-10 dark:bg-gray-0-dark">
          <div className="flex flex-row gap-10">
            <div className="flex basis-7/12 flex-col gap-8">
              <h1 className="my-0 text-5xl font-bold tracking-tight text-blue-800 dark:text-blue-800-dark">
                Labor Automation{" "}
                <span className="text-blue-600 dark:text-blue-600-dark">
                  Forecasting Hub
                </span>
              </h1>
              <p className="my-0 text-2xl leading-8 text-blue-700 [text-wrap:pretty] dark:text-blue-700-dark">
                Real-time forecasts from our global forecasting community on the
                future of the US workforce as AI advances.
              </p>
            </div>

            <div className="flex h-20 basis-5/12 flex-row gap-4">
              <div className="flex basis-1/3 items-center justify-center px-4">
                <svg
                  viewBox="0 0 91 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.12522 18.9913V6.15826L4.25043 18.9913H5.34029L7.46551 6.15826V18.9913H9.64522V0.81797H6.59362L4.79536 9.86377L2.9971 0.81797H0V18.9913H2.12522ZM17.3741 19.182C19.4993 19.182 20.6709 17.8742 20.6709 15.5038L20.6705 15.3089C20.6694 15.1243 20.6644 14.9562 20.6437 14.2504H18.3005V15.3948C18.3005 16.5119 18.028 17.0023 17.4014 17.0023C16.8019 17.0023 16.5567 16.5936 16.5567 15.6128V12.6157H20.6437V8.63768C20.6437 6.53971 19.4448 5.25913 17.4558 5.25913C15.2761 5.25913 14.1863 6.51246 14.1863 9.04638V15.3675C14.1863 16.6209 14.377 17.3565 14.9219 18.0377C15.5214 18.8006 16.3387 19.182 17.3741 19.182ZM18.2732 10.7357H16.5567V8.44696C16.5567 7.82029 16.8837 7.43884 17.4286 7.43884C17.9735 7.43884 18.2732 7.79304 18.2732 8.44696V10.7357ZM28.5633 19.182C28.9447 19.182 29.2444 19.1275 29.9256 18.9913V16.8116L29.4897 16.8388C28.645 16.8388 28.2636 16.4574 28.2636 15.5855V7.62956H29.9256V5.44985H28.2636V1.74435H25.8931V5.44985H24.7488V7.62956H25.8931V16.4029C25.8931 18.2284 26.8195 19.182 28.5633 19.182ZM35.9107 19.182C36.7009 19.182 37.3548 18.7733 37.9269 17.9015C37.9542 18.3101 38.0087 18.7188 38.0904 18.9913H40.5426C40.3367 18.348 40.301 17.9963 40.2977 16.9952L40.2974 8.50145C40.2974 6.40348 39.2075 5.25913 37.2185 5.25913C35.9925 5.25913 35.0661 5.74957 34.5484 6.70319C34.1942 7.32985 34.058 7.95652 33.9217 9.42783H36.2104C36.3194 7.79304 36.4829 7.43884 37.1913 7.43884C37.818 7.43884 37.9269 7.62956 37.9269 8.66493V10.1907C37.6817 10.3542 37.5183 10.4632 37.4638 10.4904C35.5565 11.7438 35.5565 11.7438 34.9843 12.3704C34.1942 13.2696 33.84 14.3049 33.84 15.749C33.84 18.0104 34.5484 19.182 35.9107 19.182ZM36.9461 16.9751C36.4556 16.9751 36.2104 16.4846 36.2104 15.5583C36.2104 14.0052 36.6464 13.1061 37.9269 12.0435V16.2667C37.6 16.7571 37.3003 16.9751 36.9461 16.9751ZM47.999 19.182C50.1515 19.182 51.3231 17.8742 51.3231 15.4765L51.3228 15.3239C51.3214 15.1001 51.3136 14.9103 51.2686 14.0325H48.9254V15.3948C48.9254 16.5936 48.7074 17.0023 48.0263 17.0023C47.4269 17.0023 47.1816 16.5936 47.1816 15.6128V8.82841C47.1816 7.84754 47.4269 7.43884 48.0263 7.43884C48.7074 7.43884 48.9254 7.84754 48.9254 9.04638V10.1907H51.2686C51.3122 9.47142 51.3209 9.27525 51.3227 9.08605L51.3231 8.93739C51.3231 6.56696 50.1242 5.25913 47.999 5.25913C46.9637 5.25913 46.1463 5.64058 45.5469 6.40348C45.0019 7.05739 44.8112 7.79304 44.8112 9.07362V15.3675C44.8112 16.6481 45.0019 17.3838 45.5469 18.0377C46.1463 18.8006 46.9637 19.182 47.999 19.182ZM57.4172 19.182C58.0983 19.182 58.6433 18.8551 59.6241 17.8197L59.8149 18.9913H61.9946V5.44985H59.6241V16.4574C59.1337 16.8661 58.8885 17.0023 58.5615 17.0023C58.1528 17.0023 57.9621 16.6754 57.9621 15.9942V5.44985H55.5917V16.0759C55.5917 17.4383 55.6734 17.9559 55.9731 18.4191C56.2456 18.8551 56.845 19.182 57.4172 19.182ZM68.9061 18.9913V0.81797H66.5356V18.9913H68.9061ZM75.2454 19.182C75.9266 19.182 76.4715 18.8551 77.4524 17.8197L77.6431 18.9913H79.8228V5.44985H77.4524V16.4574C76.9619 16.8661 76.7167 17.0023 76.3897 17.0023C75.9811 17.0023 75.7903 16.6754 75.7903 15.9942V5.44985H73.4199V16.0759C73.4199 17.4383 73.5016 17.9559 73.8013 18.4191C74.0738 18.8551 74.6732 19.182 75.2454 19.182ZM87.0612 19.182C89.023 19.182 90.3308 17.7925 90.3308 15.6945C90.3308 14.3322 89.8131 13.3241 88.3691 11.7983L87.4155 10.8174C86.6798 10.0272 86.4346 9.53681 86.4346 8.71942C86.4346 7.82029 86.6798 7.43884 87.2247 7.43884C87.7424 7.43884 88.0149 7.84754 88.0149 8.66493V8.85565L90.2763 8.69217C90.2763 7.82029 90.2218 7.41159 90.0311 6.89391C89.6224 5.85855 88.6688 5.25913 87.3882 5.25913C85.2085 5.25913 84.1186 6.40348 84.1186 8.66493C84.1186 10.0817 84.6363 11.3078 85.6717 12.3977L86.5981 13.3513C87.7152 14.5229 87.9604 14.9861 87.9604 15.8307C87.9604 16.5391 87.6062 17.0023 87.0612 17.0023C86.4891 17.0023 86.1621 16.5664 86.1621 15.8307C86.1621 15.6945 86.1621 15.6128 86.1894 15.3948L83.9007 15.5583C83.8734 15.6945 83.8734 15.749 83.8734 15.8852C83.8734 17.9015 85.0995 19.182 87.0612 19.182Z"
                    fill="#283441"
                  />
                </svg>
              </div>
              <div className="flex basis-1/3 items-center justify-center px-8">
                <Image
                  src="/partners/sff-light.png"
                  alt="Schultz Family Foundation Logo"
                  className="h-auto w-full"
                  width={368}
                  height={256}
                />
              </div>
              <div className="flex basis-1/3 items-center justify-center px-4">
                <Image
                  src="/partners/renphil-light.webp"
                  alt="Renphil Logo"
                  width={1500}
                  height={561}
                  className="h-auto w-full dark:hidden"
                  sizes="20vw"
                  priority
                  unoptimized
                />
                <Image
                  src="/partners/renphil-dark.png"
                  alt="Renphil Logo"
                  width={2000}
                  height={748}
                  className="hidden h-auto w-full dark:block"
                  sizes="20vw"
                  priority
                  unoptimized
                />
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* Sticky Tab Group */}

      <LaborHubHeader tabs={TABS} infoContent={<LaborHubInfo />} />

      <div className="mx-auto w-full max-w-7xl sm:px-8 md:px-12 lg:px-16">
        {/* Overview Stats Section */}
        <section
          id="overview"
          className="mb-16 grid scroll-mt-12 gap-10 lg:grid-cols-2"
        >
          {/* Left Column */}
          <div className="flex flex-col gap-10">
            {/* Mini Line Chart */}
            {!!topLeftQ && <ForecastCard post={topLeftQ} />}

            {/* Summary Text */}
            <div className="mt-4 text-xl text-blue-700 dark:text-blue-700-dark">
              <p>
                Overall employment is projected to{" "}
                <span className="font-bold text-salmon-600 dark:text-salmon-600-dark">
                  fall 3% by 2030
                </span>{" "}
                and{" "}
                <span className="font-bold text-salmon-600 dark:text-salmon-600-dark">
                  7% by 2035
                </span>{" "}
                relative to 2025 due to AI-driven displacement. This sharply
                contrasts with{" "}
                <span className="font-bold">
                  government baselines projecting +3% growth
                </span>{" "}
                over the decade from aging-adjusted population trends. The{" "}
                <span className="font-bold text-mc-option-2 dark:text-mc-option-2-dark">
                  most vulnerable AI-exposed occupations
                </span>{" "}
                are expected to shrink{" "}
                <span className="font-bold text-mc-option-2 dark:text-mc-option-2-dark">
                  67% by 2035
                </span>
                , while the{" "}
                <span className="font-bold text-mc-option-3 dark:text-mc-option-3-dark">
                  least vulnerable occupations grow 19%
                </span>
                .
              </p>
            </div>
          </div>

          {/* Right: Predicted Employment Change Chart Card */}

          {!!topRightQ && <ForecastCard post={topRightQ} className="flex-1" />}
        </section>

        {/* Activity Log + Timeline Chart Section */}
        <ActivityMonitorSection id="activity" className="mb-16" />

        {/* Jobs Monitor Section */}
        <JobsMonitorSection id="jobs" className="mb-16" />

        {/* Wages Section */}
        <section id="wages" className="scroll-mt-12">
          <SectionHeader>Wages</SectionHeader>
        </section>

        {/* Deep Dive Section */}
        <section id="deep-dive" className="scroll-mt-12">
          <SectionHeader>Deep Dive</SectionHeader>
        </section>

        {/* Methodology Section */}
        <MethodologySection id="methodology" className="scroll-mt-12" />
      </div>
    </main>
  );
}

/**
 * 
function DeepDiveSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-2xl font-medium text-gray-800 dark:text-blue-800-dark">
        {title}
      </h3>
      <p className="mb-6 text-base text-gray-600 dark:text-blue-700-dark">
        {description}
      </p>
      {children}
    </div>
  );
}

function QuestionCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-0 p-5 dark:bg-gray-0-dark">
      <h4 className="mb-4 text-sm font-medium leading-5 text-gray-800 dark:text-gray-800-dark">
        {title}
      </h4>
      <div className="text-center">
        <div className="mb-1 text-xs text-gray-700 dark:text-gray-700-dark">
          Current estimate
        </div>
        <div className="text-2xl font-bold text-blue-700 dark:text-blue-700-dark">
          {value}
        </div>
      </div>
      <div className="mt-4 h-4 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-300-dark">
        <div className="h-full w-1/3 rounded-full bg-mc-option-1/40 dark:bg-mc-option-1-dark/40" />
      </div>
    </div>
  );
}

function DegreeBar({ field, value }: { field: string; value: number }) {
  const width = Math.min(Math.abs(value), 100);
  return (
    <div className="relative flex h-9 items-center overflow-hidden rounded bg-blue-300 dark:bg-blue-300-dark">
      <div
        className="absolute inset-y-0 left-0 rounded bg-blue-600 dark:bg-blue-600-dark"
        style={{ width: `${width}%` }}
      />
      <div className="relative z-10 flex w-full items-center justify-between px-3">
        <span className="text-sm font-medium text-gray-0 dark:text-gray-0-dark">
          {field}
        </span>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-800-dark">
          {value}%
        </span>
      </div>
    </div>
  );
}

function InsightCard({
  date,
  type,
  content,
}: {
  date: string;
  type: "insight" | "synthesis";
  content: string;
}) {
  return (
    <div
      className={`rounded-lg border-l-4 p-3 ${
        type === "insight"
          ? "border-l-salmon-600 bg-salmon-100 dark:border-l-salmon-600-dark dark:bg-salmon-100-dark"
          : "border-l-olive-500 bg-olive-100 dark:border-l-olive-500-dark dark:bg-olive-100-dark"
      }`}
    >
      <div className="mb-1 text-xs text-gray-500 dark:text-blue-700-dark">
        {date}
      </div>
      <div className="text-sm text-gray-700 dark:text-blue-800-dark">
        <strong className="text-gray-800 dark:text-gray-0-dark">
          {type === "insight"
            ? "🧠 Forecaster insight:"
            : "✨ Reasoning Synthesis:"}
        </strong>{" "}
        <span className={type === "insight" ? "italic" : ""}>{content}</span>
      </div>
    </div>
  );
}


        {/* Forecast Deep Dive Header
        <section className="mb-10 text-center">
          <h2 className="mb-5 text-[38px] font-bold tracking-[-0.03em] text-gray-800 dark:text-blue-800-dark">
            Forecast deep dive
          </h2>
          <p className="mx-auto max-w-[724px] text-base leading-6 text-gray-600 dark:text-blue-700-dark">
            This section explores the reasoning behind our forecasts —
            highlighting how AI is predicted to drive changes in education,
            entry level employment, and the working environment.
          </p>
        </section>

        {/* Deep Dive Sections 
        <section className="mb-16 space-y-14">
          <DeepDiveSection
            title="Economic Evolution: Hours, Pay, and Broader Impacts"
            description="Forecasts currently show that despite a predicted decline in overall employment, median wages are expected to grow. The workweek is also expected to become four hours shorter among those employed full time, while productivity grows."
          >
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-md bg-gray-0 p-6 dark:bg-gray-0-dark">
                <h4 className="mb-2 text-center text-xl font-medium text-blue-700 dark:text-blue-700-dark">
                  Median wage changes
                </h4>
                <p className="mb-4 text-center text-sm text-gray-700 dark:text-gray-700-dark">
                  Median wages are expected to increase 8% in 2035 relative to
                  2025.
                </p>
                <div className="flex h-48 items-center justify-center rounded bg-gray-100 text-sm text-gray-400 dark:bg-gray-100-dark dark:text-gray-400-dark">
                  [Wage Change Chart Placeholder]
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-base text-gray-600 dark:text-blue-700-dark">
                  Hours worked is expected to decrease while productivity
                  increases, as forecasters argue that the economy will become
                  increasingly uncoupled from human labor output.
                </p>
                <FeaturedQuestions posts={featuredPosts} />
              </div>
            </div>
          </DeepDiveSection>

          <DeepDiveSection
            title="How will the next generation of workers be affected?"
            description="New college graduates are predicted to face difficult prospects in 2030, as early-career tasks are more easily automated while experience and judgment remain harder to replace."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <QuestionCard
                title="Unemployment rate for new college graduates in 2030"
                value="19.3%"
              />
              <QuestionCard
                title="Unemployment rate for workers 18-24 in 2030"
                value="15.3%"
              />
              <QuestionCard
                title="Employment share decline for 25-34 year olds"
                value="-17.3%"
              />
            </div>
          </DeepDiveSection>

          <DeepDiveSection
            title="What's next for education and skills?"
            description="The vulnerability of white collar work to AI advancement is expected to depress college graduation levels in 2035 relative to 2025."
          >
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-md bg-gray-0 p-6 dark:bg-gray-0-dark">
                <h4 className="mb-4 text-base font-medium text-gray-800 dark:text-gray-800-dark">
                  Change in 4-year degrees awarded in the following majors in
                  2035 relative to 2025?
                </h4>
                <div className="space-y-2">
                  <DegreeBar field="Computer science" value={-53} />
                  <DegreeBar field="English and Literature" value={-25} />
                  <DegreeBar field="Engineering" value={-11} />
                  <button className="mt-2 flex items-center gap-1 text-sm text-gray-700 dark:text-gray-700-dark">
                    <span className="text-gray-500 dark:text-gray-500-dark">•••</span> 3 more
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-base text-gray-600 dark:text-blue-700-dark">
                  Tech is expected to see the largest increase in undergraduate
                  degrees, driven by high demand for machine learning engineers.
                  Social science faces a large decline in degrees awarded, as AI
                  has increasingly demonstrated the ability to produce original
                  scientific research and analyze complex systems.
                </p>

                {/* Forecaster insight cards 
                <div className="space-y-3">
                  <InsightCard
                    date="Feb 11, 2025 — 17:10 UTC"
                    type="insight"
                    content='"Demand for AI engineers will skyrocket, as well as for infrastructure-related jobs, while AI replaces work and research in economics and psychology due to enhanced abilities to understand large systems and people."'
                  />
                  <InsightCard
                    date="Feb 11, 2025 — 17:10 UTC"
                    type="synthesis"
                    content="College education is expected to see significant changes, as universities try to keep up in a world where AI advances faster than curriculums can adapt."
                  />
                </div>
              </div>
            </div>
          </DeepDiveSection>
        </section>
 * 
 */
