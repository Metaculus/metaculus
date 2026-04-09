import { Metadata } from "next";

import SectionToggle from "@/components/ui/section_toggle";
import { ThemeOverrideContainer } from "@/contexts/theme_override_context";

import { ActivityCard } from "./components/activity-card";
import { DefinitionTooltip } from "./components/definition-tooltip";
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
    <main className="relative mb-24 min-h-screen xl:mt-12 print:mb-0 print:mt-0 print:[zoom:0.75]">
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
            Forecasts suggest that AI-driven job change is likely, but it will
            be uneven and gradual rather than sudden.
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
              <MultiQuestionTable
                title="What will the percent change of the real hourly median wage of [occupation] be relative to 2025 in the following years?"
                valueFormat="percentageChange"
                firstColumnHeader="Occupation"
                decimals={1}
                rows={[
                  { questionId: 42216, title: "Overall" },
                  { questionId: 43106, title: "Software Developers" },
                  { questionId: 43109, title: "Construction Workers" },
                  { questionId: 43110, title: "General Managers" },
                  { questionId: 43110, title: "Engineers" },
                  { questionId: 43107, title: "Financial Specialists" },
                ]}
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
              note={
                <>
                  <p>
                    As AI automates more routine tasks, the question is whether
                    the time freed up will translate into genuine leisure for
                    workers or simply be filled with new demands, making the
                    average workweek a key barometer of whether AI&apos;s
                    productivity gains are actually shared with labor.
                  </p>
                  <p>
                    Forecasters note the concept of “dark leisure” may confound
                    reported hours worked, as people may remain at work but do
                    something else as they often have no incentive to transfer
                    the time gains to their company.
                  </p>
                </>
              }
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
              note={
                <p>
                  The well-being measure below reflects a family’s available
                  resources (after taxes, government benefits, medical expenses,
                  childcare, and more), relative to a poverty threshold to meet
                  minimum needs such as food, clothing, and shelter. These
                  predictions show how the 20th, 50th, and 80th percentile
                  families are expected to fare in the coming decade under the
                  potential impact of AI.
                </p>
              }
            />
            <QuestionLoader
              questionId={42215}
              note={
                <p>
                  With only 12% of workers using AI daily as of late 2025, the
                  workplace is still in the early innings of an adoption curve
                  that could fundamentally change how most Americans do their
                  jobs within a decade. But Forecasters note that some people
                  may only think about AI as LLM chatbots and not realize how
                  many tools they use in their daily work involve AI.
                </p>
              }
            />
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        {/* Education Section */}
        <DualPaneSectionCard id="education" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>
              How will the next generation of workers be affected?
            </SectionHeader>
            <ThemeOverrideContainer override="inverted">
              <MultiQuestionTable
                title={
                  <>
                    What will the unemployment rate and underemployment rate be
                    for{" "}
                    <DefinitionTooltip tooltipContent="Recent college graduates are those who have graduated from college in the last 12 months.">
                      recent
                    </DefinitionTooltip>{" "}
                    college graduates in the following years?
                  </>
                }
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
            <ContentParagraph>
              The rise of AI is threatening to accelerate an already-looming
              enrollment decline, as fewer high school graduates and shrinking
              job prospects for degree-holders could combine to reshape the
              future of higher education.
            </ContentParagraph>
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
            <ActivityCard
              avatar="https://cdn.metaculus.com/labor-hub/exmateriae_256.jpg"
              username="Yann Riviere (exmateriae)"
              subtitle="Pro Forecaster"
              // TODO: Add link to original comment this can be wrong link for demo
              link="/questions/42220/change-in-us-bachelors-relative-to-2024-25/#comment-793578"
            >
              One thing that is pretty important is how fast the capabilities
              takeoff will be. If you&apos;re expecting a very fast takeoff,
              then many of the 22-27 may find themselves out of any opportunity
              very soon. If things continue to ramp up like they&apos;re
              currently doing, young people may be able to pivot to other areas
              soon enough to increase their chances of finding a job.
            </ActivityCard>
            <QuestionLoader questionId={42856} />
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        {/* Economy Section */}
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
            <ContentParagraph>
              AI is enabling companies to generate more revenue with far fewer
              employees, and if that trend accelerates, a growing share of
              Fortune 500 giants could operate with workforces once associated
              with small businesses rather than corporate behemoths.
            </ContentParagraph>
            <QuestionLoader questionId={41324} />
            <ActivityCard
              avatar="https://cdn.metaculus.com/labor-hub/draaglom_256.jpg"
              username="Patrick Molgaard (draaglom)"
              subtitle="Pro Forecaster"
            >
              The AI systems we have right now are already capable enough to be
              economically transformative in a way that will very likely show up
              significantly in these employment statistics over the coming
              decade.
            </ActivityCard>
            <QuestionLoader questionId={41313} />
            <ContentParagraph>
              If AI allows corporations to generate ever-greater output without
              proportionally growing their workforce, workers could claim a
              shrinking slice of the economic pie, marking one of the most
              significant redistributions of income from labor to capital in
              modern history.
            </ContentParagraph>
            <QuestionLoader questionId={41578} />
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        <ResearchSection id="research" className="scroll-mt-12" />

        <DualPaneSectionCard id="state-wa" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>State-level Focus (WA)</SectionHeader>
            <QuestionLoader questionId={43081} />
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
          <DualPaneSectionRight useMobileCarousel={false}>
            <ContentParagraph className="lg:mt-16">
              In addition to the changes forecasted for the US, there are areas
              specific to Washington State that may face particular challenges.
            </ContentParagraph>
            <ContentParagraph>
              The{" "}
              <span className="font-bold text-olive-700 dark:text-olive-700-dark">
                healthcare
              </span>{" "}
              sector (employing 13% of Washington residents) is forecasted to be
              less affected by AI than the{" "}
              <span className="font-bold text-salmon-700 dark:text-salmon-700-dark">
                technology
              </span>{" "}
              and{" "}
              <span className="font-bold text-salmon-700 dark:text-salmon-700-dark">
                aerospace
              </span>{" "}
              sectors (employing 10% and 2%, respectively).
            </ContentParagraph>
            <ActivityCard username="John Doe" subtitle="Pro Forecaster">
              Placeholder quote from Pro about Washington specific employment
              changes
            </ActivityCard>
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        <MethodologySection id="methodology" className="scroll-mt-12" />
        <PrintAttribution />
        <EngagementSection newsletterListKey="labor" />
      </div>
    </main>
  );
}
