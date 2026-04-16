import { Metadata } from "next";
import { ComponentProps } from "react";

import SectionToggle from "@/components/ui/section_toggle";
import { ThemeOverrideContainer } from "@/contexts/theme_override_context";
import cn from "@/utils/core/cn";

import { ActivityCard } from "./components/activity_card";
import { DefinitionTooltip } from "./components/definition_tooltip";
import LaborHubNavigation from "./components/labor_hub_navigation";
import { PrintAttribution } from "./components/print_attribution";
import { FlippableMultiQuestionCard } from "./components/question_cards/flippable_multi_question_card";
import { MultiQuestionTable } from "./components/question_cards/multi_question_table";
import { QuestionLoader } from "./components/question_cards/question";
import {
  DualPaneSectionCard,
  DualPaneSectionLeft,
  DualPaneSectionRight,
  SectionHeader,
  ContentParagraph,
} from "./components/section";
import { ActivityMonitorSection } from "./sections/activity_monitor";
import { EngagementSection } from "./sections/engagement_section";
import { HeroSection } from "./sections/hero";
import { JobsMonitorServer } from "./sections/jobs_monitor_server";
import { MethodologySection } from "./sections/methodology";
import { OverviewSection } from "./sections/overview";
import { ResearchSection } from "./sections/research";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "jobs", label: "Jobs" },
  { id: "wages", label: "Wages" },
  { id: "graduates", label: "Graduates" },
  { id: "economy", label: "Economy" },
  { id: "research", label: "Research" },
  { id: "state-wa", label: "State" },
  { id: "methodology", label: "Methodology" },
];

export const metadata: Metadata = {
  title: "Labor Automation Forecasting Hub | Metaculus",
  description:
    "Real-time forecasts from our global forecasting community on the future of the US workforce as AI advances.",
};

function KeyInsightItem({
  className,
  children,
  title,
  ...props
}: ComponentProps<"div">) {
  return (
    <div className="break-inside-avoid">
      <h6 className="mb-0.5 mt-0 text-base text-blue-700 [text-wrap:pretty] dark:text-blue-700-dark md:text-lg">
        {title}:
      </h6>
      <p
        className={cn(
          "dark:text-blue-700-darktext-sm  my-0 text-blue-700 [text-wrap:pretty] md:text-base",
          className
        )}
        {...props}
      >
        {children}
      </p>
    </div>
  );
}

export default function LaborAutomationHubPage() {
  return (
    <main className="relative mb-24 min-h-screen xl:mt-12 print:mb-0 print:mt-0 print:[zoom:0.75]">
      <div className="mx-auto w-full max-w-7xl xl:px-16 print:mb-6 print:px-0">
        <HeroSection />
      </div>
      <LaborHubNavigation sections={SECTIONS} newsletterListKey="labor" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 sm:gap-6 sm:px-8 md:gap-8 xl:px-16 print:gap-8 print:px-0">
        <SectionToggle
          key="key-insights"
          title="Key Insights"
          variant="light"
          defaultOpen={false}
          wrapperClassName="print:mb-6"
          contentWrapperClassName="grid md:grid-cols-2 gap-4"
        >
          <div className="flex flex-col gap-4">
            <KeyInsightItem title="Overall employment">
              Forecasters expect significant AI-driven job change, with overall
              employment declining around 6% by 2035, while the latest
              government projections expect approximately 3% growth.
            </KeyInsightItem>
            <KeyInsightItem title="Most and least vulnerable occupations">
              Software developers, lawyers and law clerks, and laborers and
              material movers are all expected to see the largest decreases in
              employment rates, while registered nurses, restaurant servers, and
              law enforcement are projected to grow
            </KeyInsightItem>
            <KeyInsightItem title="Wages and hours worked">
              Wages are expected to see notable growth for workers who remain
              employed, while hours worked are expected to decline to 32 hours a
              week in 2035, down from 38 now.
            </KeyInsightItem>
          </div>
          <div className="flex flex-col gap-4">
            <KeyInsightItem title="Financial well-being">
              Well-being (as measured by the ratio of after-tax and transfer
              available resources to the poverty threshold) is expected to grow
              across the board, with the highest income families seeing the most
              gains.
            </KeyInsightItem>
            <KeyInsightItem title="Young workers">
              The youngest workers are expected to be hit hardest, with
              unemployment for 4-year college graduates in the 22-27 age range
              expected to grow from the current 6% to 15% in 2035. Meanwhile,
              trade school and community college enrollment is expected to grow
              17% from current levels by 2035.
            </KeyInsightItem>
            <KeyInsightItem title="Broader economy">
              The economy is expected to see a number of significant changes,
              with the long-term unemployment rate, labor productivity, and the
              number of Fortune 500 companies with fewer than 5,000 employees
              all nearly doubling over the next decade.
            </KeyInsightItem>
          </div>
        </SectionToggle>
        <OverviewSection id="overview" className="print:mb-6" />
        <ActivityMonitorSection id="activity" className="" />
        <JobsMonitorServer
          id="jobs"
          labels={["2027", "2030", "2035"]}
          className=""
        />

        {/* Wages Section */}
        <DualPaneSectionCard id="wages" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>Hours, Pay, and Financial Well-Being</SectionHeader>
            <ThemeOverrideContainer override="inverted">
              <MultiQuestionTable
                title="Percentage change in the median wage relative to 2025"
                valueFormat="percentageChange"
                firstColumnHeader="Occupation"
                decimals={1}
                rows={[
                  { questionId: 42216, title: "Overall" },
                  { questionId: 43106, title: "Software Developers" },
                  { questionId: 43109, title: "Construction Workers" },
                  { questionId: 43108, title: "General Managers" },
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
              is also expected to become{" "}
              <strong>six hours shorter by 2035</strong> among all workers,
              while productivity grows.
            </ContentParagraph>
            <ContentParagraph>
              Lower income households are expected to see their government
              benefits outpace their basic needs, while higher income households
              are expected to see much stronger growth in resources relative to
              needs.
            </ContentParagraph>
          </DualPaneSectionLeft>
          <DualPaneSectionRight className="lg:mt-16 print:mt-20">
            <ContentParagraph small>
              As AI automates more routine tasks, the question is whether the
              time freed up will translate into genuine leisure for workers or
              simply be filled with new demands, making the average workweek a
              key barometer of whether AI&apos;s productivity gains are actually
              shared with labor.
            </ContentParagraph>
            <QuestionLoader
              title="Average weekly hours worked"
              questionId={41574}
            />
            <ContentParagraph small>
              Forecasters note the concept of “
              <a
                href="https://www.metaculus.com/questions/41324/of-5000-employee-fortune-500-companies/#comment-747400"
                target="_blank"
                rel="noopener noreferrer"
              >
                dark leisure
              </a>
              ” may confound reported hours worked, as people may remain at work
              but do something else as they often have no incentive to transfer
              the time gains to their company.
            </ContentParagraph>
            <ContentParagraph small>
              The wellbeing measure below reflects a family’s available
              resources (after taxes, government benefits, medical expenses,
              childcare, and more), relative to a poverty threshold to meet
              minimum needs such as food, clothing, and shelter. These
              predictions show how the 20th, 50th, and 80th percentile families
              are expected to fare in the coming decade under the potential
              impact of AI.
            </ContentParagraph>
            <FlippableMultiQuestionCard
              title="How far family resources stretch: well-being ratios (resources to poverty threshold) by percentile"
              prefer="timeline"
              tableHistoricalValueKeys={["2024"]}
              rows={[
                {
                  questionId: 42944,
                  title: "20th percentile",
                  historicalValues: {
                    2018: 1.1811,
                    2019: 1.2262,
                    2020: 1.3597,
                    2021: 1.3808,
                    2022: 1.1899,
                    2023: 1.1732,
                    2024: 1.1628,
                  },
                },
                {
                  questionId: 43042,
                  title: "50th percentile",
                  historicalValues: {
                    2018: 2.3499,
                    2019: 2.4815,
                    2020: 2.5793,
                    2021: 2.5774,
                    2022: 2.3591,
                    2023: 2.3555,
                    2024: 2.3442,
                  },
                },
                {
                  questionId: 43043,
                  title: "80th percentile",
                  historicalValues: {
                    2018: 4.3322,
                    2019: 4.5791,
                    2020: 4.619,
                    2021: 4.6173,
                    2022: 4.2673,
                    2023: 4.3198,
                    2024: 4.3312,
                  },
                },
              ]}
              tableProps={{
                valueFormat: "number",
              }}
              chartProps={{
                showTickLabels: true,
                valueFormat: "number",
                historicalTickEvery: 2,
              }}
            />
            <ContentParagraph small>
              With only 12% of workers using AI daily as of late 2025, the
              workplace is still in the early stages of an adoption curve that
              could fundamentally change how most Americans do their jobs within
              a decade. But Forecasters note that some people may only think
              about AI as LLM chatbots and not realize how many tools they use
              in their daily work involve AI, especially as integrations
              increase across productivity tools.
            </ContentParagraph>
            <QuestionLoader
              title="Percent of workers that use AI daily"
              questionId={42215}
            />
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        {/* Graduates Section */}
        <DualPaneSectionCard id="graduates" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>
              Impact on the Next Generation of Workers
            </SectionHeader>
            <ThemeOverrideContainer override="inverted">
              <FlippableMultiQuestionCard
                prefer="timeline"
                title={
                  <>
                    Unemployment rate and underemployment rate for{" "}
                    <DefinitionTooltip tooltipContent="People aged 22 to 27 with a bachelor's degree or higher">
                      recent
                    </DefinitionTooltip>{" "}
                    college graduates with bachelor’s degrees or higher
                  </>
                }
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
                tableProps={{
                  firstColumnHeader: "Recent College Graduates",
                  valueFormat: "percentage",
                  decimals: 1,
                }}
                chartProps={{
                  showTickLabels: true,
                  valueFormat: "percentage",
                }}
              />
            </ThemeOverrideContainer>
            <ContentParagraph>
              New college graduates are predicted to face difficult prospects in
              2030 and beyond, as early-career tasks are more easily automated
              while experience and judgment remain harder to replace.
            </ContentParagraph>
            <ContentParagraph>
              The unemployment rate for new graduates is expected to be{" "}
              <strong>nearly three times higher</strong> in 2035 than in 2025.
            </ContentParagraph>
            <ContentParagraph>
              The number of degrees awarded overall and for STEM and humanities
              is expected to see only minor change due to the long gestation
              time, while trade schools and community colleges are expected to
              see significant growth in degrees and certificates awarded by
              2035.
            </ContentParagraph>
          </DualPaneSectionLeft>
          <DualPaneSectionRight className="lg:mt-24 print:mt-20">
            <ContentParagraph small>
              The rise of AI is threatening to accelerate an already-looming
              decline in 4-year college enrollment, as fewer high school
              graduates and shrinking job prospects for degree-holders could
              combine to reshape the future of higher education. At the same
              time, enrollment in community colleges and trade schools is
              expected to increase.
            </ContentParagraph>
            <MultiQuestionTable
              title="Change in the number of bachelor’s degrees awarded relative to 2025"
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
              link="https://www.metaculus.com/questions/42212/new-grad-unemployment-in-these-years/#comment-762021"
            >
              One thing that is pretty important is how fast the capabilities
              takeoff will be. If you&apos;re expecting a very fast takeoff,
              then many of the 22-27 may find themselves out of any opportunity
              very soon. If things continue to ramp up like they&apos;re
              currently doing, young people may be able to pivot to other areas
              soon enough to increase their chances of finding a job.
            </ActivityCard>
            <QuestionLoader
              title="Change in the number of community college and trade school degrees awarded relative to 2025"
              questionId={42856}
            />
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        {/* Economy Section */}
        <DualPaneSectionCard id="economy" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>Changing Economy</SectionHeader>
            <ThemeOverrideContainer override="inverted">
              <QuestionLoader
                title="Percentage change in labor productivity relative to 2025"
                questionId={43087}
              />
            </ThemeOverrideContainer>
            <ContentParagraph>
              As AI capabilities continue to grow, the increase in productivity
              and automation of jobs are likely to lead to significant changes
              in the overall economy.
            </ContentParagraph>
            <ContentParagraph>
              Companies will be able to make money with fewer employees, meaning
              both higher unemployment and less revenue sharing with the labor
              force.
            </ContentParagraph>
            <ContentParagraph>
              While the forecasted changes may seem relatively modest, at the
              macroeconomic level these represent notable shifts that will
              likely have ripple effects throughout society.
            </ContentParagraph>
          </DualPaneSectionLeft>
          <DualPaneSectionRight className="lg:mt-16 print:mt-12">
            <ContentParagraph small>
              AI is expected to enable companies to generate more revenue with
              far fewer employees, and over the next decade a growing share of
              Fortune 500 giants could operate with workforces once associated
              with small businesses rather than corporate behemoths.
            </ContentParagraph>
            <QuestionLoader
              title="Number of Fortune 500 companies with fewer than 5,000 employees"
              questionId={41324}
            />
            <ActivityCard
              avatar="https://cdn.metaculus.com/labor-hub/draaglom_256.jpg"
              username="Patrick Molgaard (draaglom)"
              subtitle="Pro Forecaster"
              link="https://www.metaculus.com/questions/41307/us-employment-level-change-vs-2025/#comment-772700"
            >
              The AI systems we have right now are already capable enough to be
              economically transformative in a way that will very likely show up
              significantly in these employment statistics over the coming
              decade.
            </ActivityCard>
            <QuestionLoader
              title={
                <DefinitionTooltip tooltipContent="The percentage of the labor force (the population aged 16 and over not institutionalized or on active military duty) that has been unemployed for 27 weeks or more.">
                  Long-term unemployment rate
                </DefinitionTooltip>
              }
              questionId={41313}
            />
            <ContentParagraph small>
              If AI allows corporations to generate ever-greater output without
              proportionally growing their workforce, workers could claim a
              shrinking slice of the economic pie, marking a redistribution of
              income from labor to capital. Even a few percentage points marks a
              major shift in the context of historical trends.
            </ContentParagraph>
            <QuestionLoader
              title={
                <DefinitionTooltip tooltipContent="Labor share of national income is the percentage of all income earned from production in the economy, measured net of depreciation, that goes to workers in the form of wages and salaries plus employer-paid supplements such as benefits and payroll contributions.">
                  Labor share of national income
                </DefinitionTooltip>
              }
              questionId={41578}
            />
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        <ResearchSection id="research" className="scroll-mt-12" />

        <DualPaneSectionCard id="state-wa" className="scroll-mt-12">
          <DualPaneSectionLeft>
            <SectionHeader>State-Level View</SectionHeader>
            <MultiQuestionTable
              title="Employment change for Washington state for 2027"
              hideTitleRow
              valueFormat="percentageChange"
              decimals={1}
              rows={[
                {
                  questionId: 43081,
                  title: "Overall Employment",
                },
                {
                  questionId: 43084,
                  title: "Aerospace Sector",
                },
                {
                  questionId: 43085,
                  title: "Technology Sector",
                },
                {
                  questionId: 43086,
                  title: "Healthcare Sector",
                },
              ]}
            />
            <ActivityCard
              avatar="https://cdn.metaculus.com/labor-hub/lubossaloky_256.jpg"
              username="Ľuboš Saloky (lubossaloky)"
              subtitle="Pro Forecaster"
              link="https://www.metaculus.com/questions/43081/wa-employment-level-change-vs-2025/#comment-821944"
            >
              AI adoption is expected to have only a small impact on employment
              levels before 2027. Washington&apos;s heavy concentration in
              technology amplifies this risk. Microsoft recently laid off 3,200
              employees, while other tech companies such as Google and Meta have
              also reduced their workforce. Other industries, like manufacturing
              and aerospace, face mixed prospects. However, while the U.S.
              population grew by 0.5% from July 2024 to July 2025,
              Washington&apos;s rose by 0.9%. Even modest employment growth of
              roughly 0.7% annually, caused by the state&apos;s population
              expansion, should offset the uptick in unemployment. The growing
              population will generate sustained demand for workers in multiple
              industries, for example retail, healthcare and construction.
            </ActivityCard>
          </DualPaneSectionLeft>
          <DualPaneSectionRight
            useMobileCarousel={false}
            className="lg:mt-16 print:mt-12"
          >
            <ContentParagraph>
              In addition to the changes forecasted for the US, there are areas
              specific to Washington State that may face particular challenges.
            </ContentParagraph>
            <ContentParagraph>
              The healthcare sector (employing 13% of Washington residents) is
              forecasted to grow through 2027, largely unaffected by AI in this
              timeframe. Technology (employing 10%) is expected to see minor
              growth in the short-term, largely consistent with historical
              trends. The aerospace sector (employing 2%) is likely to face a
              slight decline, though the changes are not anticipated to be
              directly AI-related. These forecasts are very short-term, so the
              predicted changes are minimal.
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
