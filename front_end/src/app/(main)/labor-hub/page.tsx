import { Metadata } from "next";

import SectionToggle from "@/components/ui/section_toggle";
import { ThemeOverrideContainer } from "@/contexts/theme_override_context";

import LaborHubNavigation from "./components/labor-hub-navigation";
import { PrintAttribution } from "./components/print-attribution";
import { MultiQuestionTable } from "./components/question-cards/multi-question-table";
import { NoQuestionPlaceholder } from "./components/question-cards/placeholder";
import { QuestionLoader } from "./components/question-cards/question";
import { QuestionCard } from "./components/question-cards/question-card";
import {
  DualPaneSectionCard,
  DualPaneSectionLeft,
  DualPaneSectionRight,
  SectionHeader,
  ContentParagraph,
} from "./components/section";
import { ActivityMonitorSection } from "./sections/activity-monitor";
import { EngagementSection } from "./sections/engagement-section";
import { HeroSection } from "./sections/hero";
import { JobsMonitorServer } from "./sections/jobs-monitor-server";
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

export default function LaborAutomationHubPage() {
  return (
    <main className="relative mb-24 min-h-screen xl:mt-12 print:mb-0 print:mt-0">
      <div className="mx-auto w-full max-w-7xl xl:px-16 print:px-0">
        <HeroSection />
      </div>
      <LaborHubNavigation tabs={TABS} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 sm:gap-6 sm:px-8 md:gap-8 xl:px-16 print:gap-4 print:px-0">
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
        <JobsMonitorServer id="jobs" className="" />

        {/* Wages Section */}
        <DualPaneSectionCard id="wages" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>
              Economic Evolution:
              <br /> Hours, Pay, and Broader Impacts
            </SectionHeader>
            {/**
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
             */}
            <ThemeOverrideContainer override="inverted">
              <QuestionLoader
                questionId={42216}
                fallbackTitle="What will the percent change of the hourly median wage of US employees be relative to 2025 in the following years?"
              />
            </ThemeOverrideContainer>

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
            <QuestionLoader
              questionId={41574}
              fallbackTitle="What will be the average weekly hours worked in the United States in the following years?"
              note="Hours worked is expected to decrease while productivity increases, as forecasters argue that the economy will become increasingly uncoupled from human labor output."
            />
            {/** 
            <TableCompact
              HeadingSection={
                <h3 className="mb-4 mt-0 w-full pr-8 text-base font-[450] leading-tight text-gray-800 [text-wrap:pretty] dark:text-gray-800-dark">
                  What will the level of financial well-being be for the [20th,
                  50th, 80th] income percentiles in the US in the following
                  years?
                </h3>
              }
              className=""
            >
              <TableCompactHead>
                <TableCompactRow>
                  <TableCompactHeaderCell className="w-[40%]">
                    Income Percentiles
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
                  ["High Income (20th)", 33, 3.4, 6.4],
                  ["Mid Income (50th)", 24, -1.4, 5.4],
                  ["Low Income (80th)", 12, -4.4, -7.7],
                ].map((row, index) => (
                  <TableCompactRow key={row[0]}>
                    <TableCompactCell
                      className={index === 0 ? "font-medium" : ""}
                    >
                      {row[0]}
                    </TableCompactCell>
                    <TableCompactCell className="text-right">
                      {row[1]}%
                    </TableCompactCell>
                    <TableCompactCell className="text-right">
                      <PercentageChange value={Number(row[2])} />
                    </TableCompactCell>
                    <TableCompactCell className="text-right">
                      <PercentageChange value={Number(row[3])} />
                    </TableCompactCell>
                  </TableCompactRow>
                ))}
              </TableCompactBody>
            </TableCompact>
            */}
            <QuestionCard title="Cost of living relative to income for the [20th, 50th, 80th] percentile in [2030, 2035]?">
              <NoQuestionPlaceholder />
            </QuestionCard>
            <QuestionLoader questionId={42215} />
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        {/* Deep Dive Section */}
        <DualPaneSectionCard id="education" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>
              How will the next generation of workers be affected?
            </SectionHeader>
            <ThemeOverrideContainer override="inverted">
              <MultiQuestionTable
                firstColumnHeader="Recent College Graduates"
                valueFormat="percentage"
                decimals={1}
                rows={[
                  {
                    questionId: 42212,
                    title: "Unemployment Rate",
                  },
                  {
                    questionId: 42213,
                    title: "Underemployment Rate",
                  },
                ]}
              />
            </ThemeOverrideContainer>
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
            <MultiQuestionTable
              title="What will the percent change in the number of Bachelor's
                  degrees awarded by accredited universities be in the following
                  years?"
              firstColumnHeader="Major"
              valueFormat="percentageChange"
              decimals={1}
              rows={[
                {
                  questionId: 42220,
                  title: "Overall",
                },
                {
                  questionId: 42852,
                  title: "STEM",
                },
                {
                  questionId: 42853,
                  title: "Humanities",
                },
              ]}
            />
            <QuestionLoader
              questionId={42856}
              fallbackTitle="What will the percent change be in the number of sub-Bachelor's degrees that are awarded in the US in the following years relative to 2024-25?"
            />
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        <DualPaneSectionCard id="economy" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>Changing economy</SectionHeader>
            <ThemeOverrideContainer override="inverted">
              <QuestionCard title="What will the overall labor productivity for all workers in the US be in the following years?">
                <NoQuestionPlaceholder />
              </QuestionCard>
            </ThemeOverrideContainer>
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
            <ThemeOverrideContainer override="inverted">
              <QuestionLoader preferTimeline questionId={41324} />
            </ThemeOverrideContainer>
            <QuestionLoader questionId={41313} />
            <QuestionLoader questionId={41578} />
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        <ResearchSection id="research" className="scroll-mt-12">
          <ThemeOverrideContainer override="inverted">
            <QuestionLoader
              questionId={42850}
              isFlippable={false}
              fallbackTitle="What will be the changes in the occupational mix in the following years, relative to November 2022?"
            />
          </ThemeOverrideContainer>
        </ResearchSection>
        <MethodologySection id="methodology" className="scroll-mt-12" />
        <PrintAttribution />
        <EngagementSection newsletterListKey="labor" />
      </div>
    </main>
  );
}
