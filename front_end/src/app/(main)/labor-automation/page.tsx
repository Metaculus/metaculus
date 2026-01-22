import { Metadata } from "next";

import SectionToggle from "@/components/ui/section_toggle";
import { InvertedThemeContainer } from "@/contexts/inverted_theme_context";

import DownloadAllDataButton from "./components/download-all-data-button";
import LaborHubNavigation from "./components/labor-hub-navigation";
import { QuestionLoader } from "./components/question-cards/question";
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
const FEATURED_POST_IDS: number[] = [4701, 40866, 14732, 37738, 35297];

export default function LaborAutomationHubPage() {
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

        <div className="flex justify-end">
          <DownloadAllDataButton
            postIds={FEATURED_POST_IDS}
            title="labor_automation_hub_data"
          />
        </div>

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
            {FEATURED_POST_IDS.map((id, index) => (
              <QuestionLoader
                key={id}
                questionId={id}
                preferTimeline={index % 2 === 0}
              />
            ))}
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        {/* Deep Dive Section */}
        <DualPaneSectionCard id="education" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>
              How will the next generation of workers be affected?
            </SectionHeader>
            <TableCompact className="inverted mt-6">
              <TableCompactHead>
                <TableCompactRow>
                  <TableCompactHeaderCell className="w-[40%]">
                    College Graduates
                  </TableCompactHeaderCell>
                  <TableCompactHeaderCell className="w-[15%] text-right">
                    2025
                  </TableCompactHeaderCell>
                  <TableCompactHeaderCell className="w-[15%] text-right">
                    2027
                  </TableCompactHeaderCell>
                  <TableCompactHeaderCell className="w-[15%] text-right">
                    2030
                  </TableCompactHeaderCell>
                  <TableCompactHeaderCell className="w-[15%] text-right">
                    2035
                  </TableCompactHeaderCell>
                </TableCompactRow>
              </TableCompactHead>
              <TableCompactBody>
                {[
                  {
                    label: "Unemployment Rate",
                    value2025: 5.5,
                    value2027: 8.5,
                    value2030: 12.5,
                    value2035: 14.5,
                  },
                  {
                    label: "Underemployment Rate",
                    value2025: 4.3,
                    value2027: 6.3,
                    value2030: 8.3,
                    value2035: 9.5,
                  },
                ].map((row) => (
                  <TableCompactRow key={row.label}>
                    <TableCompactCell className="font-medium">
                      {row.label}
                    </TableCompactCell>
                    <TableCompactCell className="text-right">
                      {row.value2025}%
                    </TableCompactCell>
                    <TableCompactCell className="text-right">
                      {row.value2027}%
                    </TableCompactCell>
                    <TableCompactCell className="text-right">
                      {row.value2030}%
                    </TableCompactCell>
                    <TableCompactCell className="text-right">
                      {row.value2035}%
                    </TableCompactCell>
                  </TableCompactRow>
                ))}
              </TableCompactBody>
            </TableCompact>
            <ContentParagraph>
              New college graduates are predicted to face difficult prospects in
              2030, as early-career tasks are more easily automated while
              experience and judgment remain harder to replace.
            </ContentParagraph>
            <ContentParagraph>
              The unemployment rate for new graduates is expected to be nearly
              four times higher in 2030 than in 2025.
            </ContentParagraph>
            <ContentParagraph>
              By contrast, unemployment among all young workers is expected to
              roughly double, remaining lower than for new graduates because
              many young workers are expected to shift into jobs outside the
              college-graduate pipeline.
            </ContentParagraph>
          </DualPaneSectionLeft>
          <DualPaneSectionRight>
            {FEATURED_POST_IDS.map((id) => (
              <QuestionLoader key={id} questionId={id} />
            ))}
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        <DualPaneSectionCard id="economy" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>Changing economy</SectionHeader>
            <InvertedThemeContainer>
              <QuestionLoader questionId={40866} subQuestionId={40523} />
            </InvertedThemeContainer>
            <ContentParagraph>
              The vulnerability of white collar work to AI advancement is
              expected to depress college graduation levels in 2035 relative to
              2025.
            </ContentParagraph>
            <ContentParagraph>
              Simultaneously, an increase in trade work is anticipated as AI
              stimulates the economy and infrastructure demands increase to keep
              pace.
            </ContentParagraph>
            <ContentParagraph>
              While a few degrees are expected to see growth, such as biology as
              it becomes an area of strong growth and investment, others such as
              computer science and psychology are expected to see dramatic
              declines as AI automates many prospects for those fields.
            </ContentParagraph>
          </DualPaneSectionLeft>
          <DualPaneSectionRight>
            {FEATURED_POST_IDS.map((id) => (
              <QuestionLoader key={id} questionId={id} preferTimeline />
            ))}
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        <ResearchSection id="research" className="scroll-mt-12">
          <InvertedThemeContainer>
            <QuestionLoader
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              questionId={FEATURED_POST_IDS[2]!}
              preferTimeline={false}
            />
          </InvertedThemeContainer>
        </ResearchSection>
        <MethodologySection id="methodology" className="scroll-mt-12" />
      </div>
    </main>
  );
}
