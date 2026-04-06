import { Metadata } from "next";

import SectionToggle from "@/components/ui/section_toggle";
import { ThemeOverrideContainer } from "@/contexts/theme_override_context";

import LaborHubNavigation from "./components/labor-hub-navigation";
import { PrintAttribution } from "./components/print-attribution";
import { MultiQuestionTable } from "./components/question-cards/multi-question-table";
import { QuestionLoader } from "./components/question-cards/question";
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
        <JobsMonitorServer id="jobs" labels={["2030", "2035"]} className="" />

        {/* Wages Section */}
        <DualPaneSectionCard id="wages" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>
              Economic Evolution:
              <br /> Hours, Pay, and Broader Impacts
            </SectionHeader>
            <ThemeOverrideContainer override="inverted">
              <QuestionLoader questionId={42216} />
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
              note="Hours worked is expected to decrease while productivity increases, as forecasters argue that the economy will become increasingly uncoupled from human labor output."
            />
            <MultiQuestionTable
              title="What will the well-being ratio (resources to poverty threshold) be for the [X]-percentile US family in the following years?"
              valueFormat="percentageChange"
              decimals={1}
              rows={[
                { questionId: 42944, title: "20th percentile" },
                { questionId: 43042, title: "50th percentile" },
                { questionId: 43043, title: "80th percentile" },
              ]}
            />
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
            <QuestionLoader questionId={42856} />
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        <DualPaneSectionCard id="economy" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>Changing economy</SectionHeader>
            <ThemeOverrideContainer override="inverted">
              <QuestionLoader questionId={43087} />
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

        <ResearchSection id="research" className="scroll-mt-12" />

        <DualPaneSectionCard id="state-wa" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>State-level Focus (WA)</SectionHeader>
            <ThemeOverrideContainer override="inverted">
              <QuestionLoader questionId={43081} />
            </ThemeOverrideContainer>
            <MultiQuestionTable
              title="How much have the following sectors changed in WA as a percentage of state employment in the following years relative to 2025?"
              firstColumnHeader="Sector"
              valueFormat="percentageChange"
              decimals={1}
              rows={[
                {
                  questionId: 43084,
                  title: "Aerospace",
                },
                {
                  questionId: 43085,
                  title: "Technology",
                },
                {
                  questionId: 43086,
                  title: "Healthcare",
                },
              ]}
            />
          </DualPaneSectionLeft>
          <DualPaneSectionRight>
            <ContentParagraph className="mt-16">
              Washington is shown as a focused lens on how national employment
              shifts play out locally. While the headline forecast provides a
              broad view, state-level variation reveals where sector dynamics
              diverge or reinforce the trend.
            </ContentParagraph>
            <ContentParagraph>
              In Washington, projected growth is concentrated in{" "}
              <span className="font-bold text-olive-700 dark:text-olive-700-dark">
                healthcare
              </span>
              , while{" "}
              <span className="font-bold text-salmon-700 dark:text-salmon-700-dark">
                aerospace
              </span>{" "}
              and{" "}
              <span className="font-bold text-salmon-700 dark:text-salmon-700-dark">
                technology
              </span>{" "}
              decline over time. This contrast helps contextualize the overall
              estimate, highlighting whether it is supported by broad-based
              gains or offset by contraction in key sectors.
            </ContentParagraph>
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        <MethodologySection id="methodology" className="scroll-mt-12" />
        <PrintAttribution />
        <EngagementSection newsletterListKey="labor" />
      </div>
    </main>
  );
}
