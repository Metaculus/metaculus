import { Metadata } from "next";

import ForecastCard from "@/components/forecast_card";
import SectionToggle from "@/components/ui/section_toggle";
import ServerPostsApi from "@/services/api/posts/posts.server";

import LaborHubNavigation from "./components/labor-hub-navigation";
import {
  DualPaneSectionCard,
  DualPaneSectionLeft,
  DualPaneSectionRight,
  SectionHeader,
  ContentParagraph,
} from "./components/section";
import {
  PercentageChange,
  TableCompact,
  TableCompactBody,
  TableCompactCell,
  TableCompactHead,
  TableCompactHeaderCell,
  TableCompactRow,
  WageValue,
} from "./components/table-compact";
import { ActivityMonitorSection } from "./sections/activity-monitor";
import { HeroSection } from "./sections/hero";
import { JobsMonitorSection } from "./sections/jobs-monitor";
import { MethodologySection } from "./sections/methodology";
import { OverviewSection } from "./sections/overview";
import { ResearchSection } from "./sections/research";

//import PercentageForecastCard from "@/components/consumer_post_card/group_forecast_card/percentage_forecast_card";
//import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
//import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "jobs", label: "Jobs" },
  { id: "wages", label: "Wages" },
  { id: "education", label: "Education" },
  { id: "economy", label: "Economy" },
  { id: "research", label: "Research" },
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
    <main className="relative mb-24 min-h-screen xl:mt-12">
      <div className="mx-auto w-full max-w-7xl xl:px-16">
        <HeroSection />
      </div>
      <LaborHubNavigation tabs={TABS} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 sm:gap-6 sm:px-8 md:gap-8 xl:px-16">
        <SectionToggle
          key="tl-dr"
          title="TL;DR: What does the data show?"
          variant="light"
          defaultOpen={false}
        >
          <ContentParagraph>
            Forecasts suggest that AI-driven job change is likely, uneven, and
            gradual rather than sudden.
          </ContentParagraph>
          <ContentParagraph>
            Most disruption is expected to come from task-level automation and
            wage pressure, not mass unemployment, with impacts varying widely by
            sector and skill level.
          </ContentParagraph>
        </SectionToggle>
        <OverviewSection id="overview" />
        <ActivityMonitorSection id="activity" className="" />
        <JobsMonitorSection id="jobs" className="" />

        {/* Wages Section */}
        <DualPaneSectionCard id="wages" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>
              Economic Evolution:
              <br /> Hours, Pay, and Broader Impacts
            </SectionHeader>
            <TableCompact className="inverted mt-6">
              <TableCompactHead>
                <TableCompactRow>
                  <TableCompactHeaderCell className="w-[40%]">
                    Median Wage Changes
                  </TableCompactHeaderCell>
                  <TableCompactHeaderCell className="w-[20%] text-right">
                    Current
                  </TableCompactHeaderCell>
                  <TableCompactHeaderCell className="w-[20%] text-right">
                    2030
                  </TableCompactHeaderCell>
                  <TableCompactHeaderCell className="w-[20%] text-right">
                    2035
                  </TableCompactHeaderCell>
                </TableCompactRow>
              </TableCompactHead>
              <TableCompactBody>
                {[
                  {
                    occupation: "All Occupations",
                    current: 45,
                    change2030: 3.4,
                    change2035: 6.4,
                  },
                  {
                    occupation: "Construction Workers",
                    current: 55,
                    change2030: 1.4,
                    change2035: 5.4,
                  },
                  {
                    occupation: "General Managers",
                    current: 50,
                    change2030: 4.4,
                    change2035: 7.7,
                  },
                  {
                    occupation: "Engineers",
                    current: 70,
                    change2030: -5.6,
                    change2035: -6.7,
                  },
                  {
                    occupation: "Financial Specialists",
                    current: 70,
                    change2030: -8.6,
                    change2035: -11.7,
                  },
                ].map((row, index) => (
                  <TableCompactRow key={row.occupation}>
                    <TableCompactCell
                      className={index === 0 ? "font-medium" : ""}
                    >
                      {row.occupation}
                    </TableCompactCell>
                    <TableCompactCell className="text-right">
                      <WageValue value={row.current} />
                    </TableCompactCell>
                    <TableCompactCell className="text-right">
                      <PercentageChange value={row.change2030} />
                    </TableCompactCell>
                    <TableCompactCell className="text-right">
                      <PercentageChange value={row.change2035} />
                    </TableCompactCell>
                  </TableCompactRow>
                ))}
              </TableCompactBody>
            </TableCompact>

            <ContentParagraph>
              Forecasts currently show that{" "}
              <span className="text-salmon-700 dark:text-salmon-700-dark">
                despite a predicted decline in overall employment
              </span>
              , <strong>median wages are expected to grow.</strong> The workweek
              is also expected to become <strong>four hours shorter</strong>{" "}
              among those employed full time, while productivity grows.
            </ContentParagraph>
            <ContentParagraph>
              Lower income households are also expected to be better off after
              accounting for government benefits, but are expected to receive a
              larger share of their income through government benefits.
            </ContentParagraph>
          </DualPaneSectionLeft>
          <DualPaneSectionRight>
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
            {/* Wage Distribution Preview */}
            <div className="rounded-lg bg-blue-200 p-6 dark:bg-blue-200-dark">
              <h3 className="mb-4 text-lg font-semibold text-blue-800 dark:text-blue-800-dark">
                Wage Distribution by AI Exposure
              </h3>
              <div className="mb-4 flex h-32 items-end justify-between gap-2">
                {[65, 45, 30, 55, 70, 40, 25].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-blue-500 dark:bg-blue-500-dark"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-700-dark">
                Placeholder chart showing wage distribution across sectors
              </p>
            </div>

            {/* Key Wage Metrics */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-olive-200 dark:bg-olive-200-dark rounded-lg p-4">
                <div className="text-2xl font-bold text-olive-700 dark:text-olive-700-dark">
                  +8%
                </div>
                <div className="text-sm text-olive-600 dark:text-olive-600-dark">
                  Median wage growth by 2035
                </div>
              </div>
              <div className="rounded-lg bg-salmon-200 p-4 dark:bg-salmon-200-dark">
                <div className="text-2xl font-bold text-salmon-700 dark:text-salmon-700-dark">
                  -12%
                </div>
                <div className="text-sm text-salmon-600 dark:text-salmon-600-dark">
                  Entry-level wages decline
                </div>
              </div>
              <div className="rounded-lg bg-purple-200 p-4 dark:bg-purple-200-dark">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-700-dark">
                  +23%
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-600-dark">
                  AI specialist wage premium
                </div>
              </div>
            </div>

            {/* Additional Forecast Card */}
            {!!topRightQ && <ForecastCard post={topRightQ} />}

            {/* Sector Breakdown */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-800-dark">
                Sector Wage Impacts
              </h3>
              {[
                { sector: "Technology", change: "+15%", bar: 75 },
                { sector: "Healthcare", change: "+9%", bar: 60 },
                { sector: "Finance", change: "-4%", bar: 40 },
                { sector: "Retail", change: "-18%", bar: 25 },
                { sector: "Manufacturing", change: "-22%", bar: 20 },
              ].map((item) => (
                <div key={item.sector} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-gray-700 dark:text-gray-700-dark">
                    {item.sector}
                  </span>
                  <div className="flex-1">
                    <div className="h-6 overflow-hidden rounded bg-gray-300 dark:bg-gray-300-dark">
                      <div
                        className={`h-full rounded ${
                          item.change.startsWith("+")
                            ? "bg-olive-500 dark:bg-olive-500-dark"
                            : "bg-salmon-500 dark:bg-salmon-500-dark"
                        }`}
                        style={{ width: `${item.bar}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={`w-12 text-right text-sm font-medium ${
                      item.change.startsWith("+")
                        ? "text-olive-700 dark:text-olive-700-dark"
                        : "text-salmon-700 dark:text-salmon-700-dark"
                    }`}
                  >
                    {item.change}
                  </span>
                </div>
              ))}
            </div>
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        {/* Deep Dive Section */}
        <DualPaneSectionCard id="education" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>
              How will the next generation of workers be affected?
            </SectionHeader>
            <p className="text-blue-700 dark:text-blue-700-dark">
              Overall employment is projected to fall 3% by 2030 and 7% by 2035
              relative to 2025 due to AI-driven displacement. This sharply
              contrasts with government baselines projecting +3% growth over the
              decade from aging-adjusted population trends. The most vulnerable
              AI-exposed occupations are expected to shrink 67% by 2035, while
              the least vulnerable occupations grow 19%.
            </p>
          </DualPaneSectionLeft>
          <DualPaneSectionRight>
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
            {/* Wage Distribution Preview */}
            <div className="rounded-lg bg-blue-200 p-6 dark:bg-blue-200-dark">
              <h3 className="mb-4 text-lg font-semibold text-blue-800 dark:text-blue-800-dark">
                Wage Distribution by AI Exposure
              </h3>
              <div className="mb-4 flex h-32 items-end justify-between gap-2">
                {[65, 45, 30, 55, 70, 40, 25].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-blue-500 dark:bg-blue-500-dark"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-700-dark">
                Placeholder chart showing wage distribution across sectors
              </p>
            </div>

            {/* Key Wage Metrics */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-olive-200 dark:bg-olive-200-dark rounded-lg p-4">
                <div className="text-2xl font-bold text-olive-700 dark:text-olive-700-dark">
                  +8%
                </div>
                <div className="text-sm text-olive-600 dark:text-olive-600-dark">
                  Median wage growth by 2035
                </div>
              </div>
              <div className="rounded-lg bg-salmon-200 p-4 dark:bg-salmon-200-dark">
                <div className="text-2xl font-bold text-salmon-700 dark:text-salmon-700-dark">
                  -12%
                </div>
                <div className="text-sm text-salmon-600 dark:text-salmon-600-dark">
                  Entry-level wages decline
                </div>
              </div>
              <div className="rounded-lg bg-purple-200 p-4 dark:bg-purple-200-dark">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-700-dark">
                  +23%
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-600-dark">
                  AI specialist wage premium
                </div>
              </div>
            </div>

            {/* Additional Forecast Card */}
            {!!topRightQ && <ForecastCard post={topRightQ} />}

            {/* Sector Breakdown */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-800-dark">
                Sector Wage Impacts
              </h3>
              {[
                { sector: "Technology", change: "+15%", bar: 75 },
                { sector: "Healthcare", change: "+9%", bar: 60 },
                { sector: "Finance", change: "-4%", bar: 40 },
                { sector: "Retail", change: "-18%", bar: 25 },
                { sector: "Manufacturing", change: "-22%", bar: 20 },
              ].map((item) => (
                <div key={item.sector} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-gray-700 dark:text-gray-700-dark">
                    {item.sector}
                  </span>
                  <div className="flex-1">
                    <div className="h-6 overflow-hidden rounded bg-gray-300 dark:bg-gray-300-dark">
                      <div
                        className={`h-full rounded ${
                          item.change.startsWith("+")
                            ? "bg-olive-500 dark:bg-olive-500-dark"
                            : "bg-salmon-500 dark:bg-salmon-500-dark"
                        }`}
                        style={{ width: `${item.bar}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={`w-12 text-right text-sm font-medium ${
                      item.change.startsWith("+")
                        ? "text-olive-700 dark:text-olive-700-dark"
                        : "text-salmon-700 dark:text-salmon-700-dark"
                    }`}
                  >
                    {item.change}
                  </span>
                </div>
              ))}
            </div>
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        <DualPaneSectionCard id="economy" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>Changing economy</SectionHeader>
            <p className="text-blue-700 dark:text-blue-700-dark">
              Overall employment is projected to fall 3% by 2030 and 7% by 2035
              relative to 2025 due to AI-driven displacement. This sharply
              contrasts with government baselines projecting +3% growth over the
              decade from aging-adjusted population trends. The most vulnerable
              AI-exposed occupations are expected to shrink 67% by 2035, while
              the least vulnerable occupations grow 19%.
            </p>
          </DualPaneSectionLeft>
          <DualPaneSectionRight>
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
            {/* Wage Distribution Preview */}
            <div className="rounded-lg bg-blue-200 p-6 dark:bg-blue-200-dark">
              <h3 className="mb-4 text-lg font-semibold text-blue-800 dark:text-blue-800-dark">
                Wage Distribution by AI Exposure
              </h3>
              <div className="mb-4 flex h-32 items-end justify-between gap-2">
                {[65, 45, 30, 55, 70, 40, 25].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-blue-500 dark:bg-blue-500-dark"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-700-dark">
                Placeholder chart showing wage distribution across sectors
              </p>
            </div>

            {/* Key Wage Metrics */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-olive-200 dark:bg-olive-200-dark rounded-lg p-4">
                <div className="text-2xl font-bold text-olive-700 dark:text-olive-700-dark">
                  +8%
                </div>
                <div className="text-sm text-olive-600 dark:text-olive-600-dark">
                  Median wage growth by 2035
                </div>
              </div>
              <div className="rounded-lg bg-salmon-200 p-4 dark:bg-salmon-200-dark">
                <div className="text-2xl font-bold text-salmon-700 dark:text-salmon-700-dark">
                  -12%
                </div>
                <div className="text-sm text-salmon-600 dark:text-salmon-600-dark">
                  Entry-level wages decline
                </div>
              </div>
              <div className="rounded-lg bg-purple-200 p-4 dark:bg-purple-200-dark">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-700-dark">
                  +23%
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-600-dark">
                  AI specialist wage premium
                </div>
              </div>
            </div>

            {/* Additional Forecast Card */}
            {!!topRightQ && <ForecastCard post={topRightQ} />}

            {/* Sector Breakdown */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-800-dark">
                Sector Wage Impacts
              </h3>
              {[
                { sector: "Technology", change: "+15%", bar: 75 },
                { sector: "Healthcare", change: "+9%", bar: 60 },
                { sector: "Finance", change: "-4%", bar: 40 },
                { sector: "Retail", change: "-18%", bar: 25 },
                { sector: "Manufacturing", change: "-22%", bar: 20 },
              ].map((item) => (
                <div key={item.sector} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-gray-700 dark:text-gray-700-dark">
                    {item.sector}
                  </span>
                  <div className="flex-1">
                    <div className="h-6 overflow-hidden rounded bg-gray-300 dark:bg-gray-300-dark">
                      <div
                        className={`h-full rounded ${
                          item.change.startsWith("+")
                            ? "bg-olive-500 dark:bg-olive-500-dark"
                            : "bg-salmon-500 dark:bg-salmon-500-dark"
                        }`}
                        style={{ width: `${item.bar}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={`w-12 text-right text-sm font-medium ${
                      item.change.startsWith("+")
                        ? "text-olive-700 dark:text-olive-700-dark"
                        : "text-salmon-700 dark:text-salmon-700-dark"
                    }`}
                  >
                    {item.change}
                  </span>
                </div>
              ))}
            </div>
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        <ResearchSection id="research" className="scroll-mt-12" />
        <MethodologySection id="methodology" className="scroll-mt-12" />
      </div>
    </main>
  );
}
