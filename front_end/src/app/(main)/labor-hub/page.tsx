import { Metadata } from "next";

import { ThemeOverrideContainer } from "@/contexts/theme_override_context";
import { getPublicSettings } from "@/utils/public_settings.server";

import { ActivityCard } from "./components/activity_card";
import { DefinitionTooltip } from "./components/definition_tooltip";
import LaborHubNavigation from "./components/labor_hub_navigation";
import { PrintAttribution } from "./components/print_attribution";
import { FlippableChartTimelineCard } from "./components/question_cards/flippable_chart_timeline_card";
import { FlippableMultiQuestionCard } from "./components/question_cards/flippable_multi_question_card";
import { MultiQuestionTable } from "./components/question_cards/multi_question_table";
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
import { KeyInsightsSection } from "./sections/key_insights";
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
  { id: "state", label: "State" },
  { id: "methodology", label: "Methodology" },
];

export function generateMetadata(): Metadata {
  const { PUBLIC_APP_URL } = getPublicSettings();
  const title = "Labor Automation Forecasting Hub | Metaculus";
  const description =
    "Real-time forecasts from our global forecasting community on the future of the US workforce as AI advances.";
  const img = `${PUBLIC_APP_URL}/og/labor-hub/route?theme=dark`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: img, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [img],
    },
  };
}

export default function LaborAutomationHubPage() {
  return (
    <main className="relative mb-24 min-h-screen xl:mt-12 print:mb-0 print:mt-0 print:[zoom:0.75] [&_[id]]:scroll-mt-24">
      <div className="mx-auto w-full max-w-7xl xl:px-16 print:mb-6 print:px-0">
        <HeroSection />
      </div>
      <LaborHubNavigation sections={SECTIONS} newsletterListKey="labor" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-1 sm:gap-6 sm:px-8 md:gap-8 xl:px-16 print:gap-8 print:px-0">
        <div className="flex w-full flex-col gap-5 px-3 sm:gap-6 sm:px-0 md:gap-8 print:gap-8 print:px-0">
          <OverviewSection id="overview" className="print:mb-6" />
          <KeyInsightsSection />
          <ActivityMonitorSection id="activity" className="" />
        </div>

        <div>
          <JobsMonitorServer
            id="jobs"
            labels={["2027", "2030", "2035"]}
            className=""
          />
          <DualPaneSectionCard className="-mt-1 gap-4 rounded-t-none bg-opacity-50 dark:bg-opacity-50 md:gap-8">
            <ActivityCard
              variant="mint"
              avatar="https://cdn.metaculus.com/labor-hub/bchandar_256.jpg"
              username="Bharat Chandar"
              subtitle="Postdoctoral Researcher, Stanford Digital Economy Lab"
            >
              <p>
                Median overall employment forecast:
                <br />
                (2027: +1%) (2030: -0.5%) (2035: -4%)
              </p>
              <p>
                In the very short run, I expect lags in employment impacts
                because of limitations of the technology and slow AI adoption.
                For this reason my 2027 estimate takes the trend line of
                employment and slightly undershoots it. However, power users may
                be as important to monitor as laggards because they may exert
                competitive pressure on markets that lead to faster adjustment.
              </p>
              <p>
                In the longer run (5-10 years), I am extremely uncertain. I
                expect the technology will be much more advanced and integrated
                into peoples&apos; lives. My primary uncertainty is the policy
                response if AI leads to rapid change. I don&apos;t know how this
                will resolve itself. There may be scenarios where AI does less
                than it is capable of because of new regulation. The BLS may
                also measure activities as work that look more like leisure than
                what many people do today.
              </p>
            </ActivityCard>
            <ActivityCard
              variant="purple"
              avatar="https://cdn.metaculus.com/labor-hub/draaglom_256.jpg"
              username="Patrick Molgaard (draaglom)"
              subtitle="Pro Forecaster"
              link="https://www.metaculus.com/questions/41307/us-employment-level-change-vs-2025/#comment-772700"
            >
              <p>
                The economic changes we see from AI will be faster than almost
                anything seen before. As a general trend, each technological
                wave is adopted faster than the previous (e.g. mobile phone
                penetration vs landlines) and the nature of AI should accelerate
                its adoption even relative to this trend.
              </p>
              <p>
                Despite this, adoption and job displacement may still be
                surprisingly slow in some important senses. My stereotype of how
                this might look is that new AI-first competitor companies have
                been (or will be) created in many industries and these new
                entrants will take some time - a period of several years - to
                displace the old ones. As an intuition, &quot;Photographic
                Process Workers and Processing Machine Operators&quot; took 5
                years between 2010 and 2015 to decline 50% - and this is a job
                whose associated technology was ~obsoleted.
              </p>
              <p>
                Relatedly, I expect many job roles, even some seen as relatively
                &quot;low education&quot; or &quot;at risk of automation&quot;
                will have a surprisingly large long tail of tasks that take some
                time for AI systems to be good at. I&apos;m also quite skeptical
                that a majority of the job losses attributed to AI so far (e.g.
                tech layoffs) are truly proximately caused by AI.
              </p>
            </ActivityCard>
          </DualPaneSectionCard>
        </div>

        {/* Wages Section */}
        <DualPaneSectionCard id="wages" className="">
          <DualPaneSectionLeft>
            <SectionHeader>Hours, Pay, and Financial Well-Being</SectionHeader>
            <ThemeOverrideContainer override="inverted">
              <MultiQuestionTable
                title="Percentage change in the inflation-adjusted median wage relative to 2025"
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
              <strong>four hours shorter by 2035</strong> among all workers,
              while productivity grows.
            </ContentParagraph>
            <ContentParagraph>
              Lower income households are expected to see their government
              benefits outpace their basic needs, while higher income households
              are expected to see much stronger growth in resources relative to
              needs.
            </ContentParagraph>
          </DualPaneSectionLeft>
          <DualPaneSectionRight className="lg:mt-16 print:mt-12">
            <ContentParagraph small>
              As AI automates more routine tasks, the question is whether the
              time freed up will translate into genuine leisure for workers or
              simply be filled with new demands, making the average workweek a
              key barometer of whether AI&apos;s productivity gains are actually
              shared with labor.
            </ContentParagraph>
            <FlippableChartTimelineCard
              title="Average weekly hours worked"
              questionId={41574}
              prefer="chart"
              historicalValues={{
                2018: 38.9,
                2019: 39,
                2020: 38.3,
                2021: 38.7,
                2022: 38.6,
                2023: 38.5,
                2024: 38.3,
                2025: 38.3,
              }}
              chartProps={{
                showTickLabels: true,
                valueFormat: "number",
                decimals: 1,
              }}
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
              impact of AI, with higher numbers indicating better financial
              well-being.
            </ContentParagraph>
            <FlippableMultiQuestionCard
              title={
                <>
                  How far family resources stretch:{" "}
                  <DefinitionTooltip
                    tooltipContent={
                      <>
                        We define the well-being ratio as the ratio of available
                        resources to the poverty threshold. Available resources
                        include government benefits and housing subsidies, and
                        deduct expenses like child care, taxes, child support,
                        and medical expenses. Both the available resources and
                        the poverty threshold come from the{" "}
                        <a
                          href="https://www.census.gov/topics/income-poverty/supplemental-poverty-measure/about.html"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Supplemental Poverty Measure
                        </a>
                        , which provides a poverty threshold that takes into
                        account recent data about spending needs and adjusts
                        based on family size, geography, and place and type of
                        residence.
                      </>
                    }
                  >
                    well-being ratios
                  </DefinitionTooltip>
                </>
              }
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
              }}
            />
            <ContentParagraph small>
              With only 12% of workers using AI daily as of late 2025, the
              workplace is still in the early stages of an adoption curve that
              could fundamentally change how most Americans do their jobs within
              a decade. But forecasters note that some people may only think
              about AI as LLM chatbots and not realize how many tools they use
              in their daily work involve AI, especially as integrations
              increase across productivity tools.
            </ContentParagraph>
            <FlippableChartTimelineCard
              title="Percent of workers that use AI daily"
              questionId={42215}
              prefer="chart"
              historicalValues={{
                2023: 4,
                2024: 4,
                2025: 10,
              }}
              chartProps={{
                showTickLabels: true,
                valueFormat: "percentage",
                decimals: 1,
              }}
            />
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        {/* Graduates Section */}
        <DualPaneSectionCard id="graduates" className="">
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
                tableHistoricalValueKeys={["2025"]}
                rows={[
                  {
                    questionId: 42212,
                    title: "Unemployment Rate",
                    historicalValues: {
                      2018: 3.7,
                      2019: 3.9,
                      2020: 8.0,
                      2021: 5.8,
                      2022: 4.1,
                      2023: 4.4,
                      2024: 4.8,
                      2025: 5.4,
                    },
                  },
                  {
                    questionId: 42213,
                    title: "Underemployment Rate",
                    historicalValues: {
                      2018: 41.6,
                      2019: 41.5,
                      2020: 41.0,
                      2021: 40.9,
                      2022: 40.3,
                      2023: 39.7,
                      2024: 40.3,
                      2025: 41.4,
                    },
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
              The unemployment rate for new graduates is expected to have{" "}
              <strong>doubled</strong> in 2035 compared to 2025.
            </ContentParagraph>
            <ContentParagraph>
              The number of degrees awarded overall and for STEM and humanities
              is expected to see only minor change due to the long gestation
              time, while trade schools and community colleges are expected to
              see significant growth in degrees and certificates awarded by
              2035.
            </ContentParagraph>
          </DualPaneSectionLeft>
          <DualPaneSectionRight className="lg:mt-24 print:mt-12">
            <ContentParagraph small>
              The rise of AI is threatening to accelerate an already-looming
              decline in 4-year college enrollment, as fewer high school
              graduates and shrinking job prospects for degree-holders could
              combine to reshape the future of higher education. At the same
              time, enrollment in community colleges and trade schools is
              expected to increase.
            </ContentParagraph>
            <FlippableMultiQuestionCard
              prefer="timeline"
              title={
                <>
                  Change in the number of degrees and certificates awarded{" "}
                  <DefinitionTooltip tooltipContent="Historical data for 2025 has not yet been released, so 2025 figures have been temporarily assumed to be the same as the 2024 figures. The year represents the year graduation occurs, so for example the 2029-2030 school year is represented here as 2030.">
                    relative to 2025
                  </DefinitionTooltip>
                </>
              }
              tableHistoricalValueKeys={["2025"]}
              rows={[
                {
                  questionId: 42220,
                  title: "Overall 4-year",
                  historicalValues: {
                    2018: 1.31,
                    2019: 2.97,
                    2020: 4.28,
                    2021: 5.7,
                    2022: 3.06,
                    2023: 0.55,
                    2024: 0,
                    2025: 0,
                  },
                },
                {
                  questionId: 42852,
                  title: "STEM 4-year",
                  historicalValues: {
                    2018: -8.9,
                    2019: -4.81,
                    2020: -0.99,
                    2021: 0.84,
                    2022: 0.42,
                    2023: -0.06,
                    2024: 0,
                    2025: 0,
                  },
                },
                {
                  questionId: 42853,
                  title: "Humanities 4-year",
                  historicalValues: {
                    2018: 23.1,
                    2019: 22.02,
                    2020: 19.51,
                    2021: 15.54,
                    2022: 6.38,
                    2023: 1.83,
                    2024: 0,
                    2025: 0,
                  },
                },
                {
                  questionId: 42856,
                  title: "Trade School and Community College",
                  historicalValues: {
                    2018: 2.72,
                    2019: 4.75,
                    2020: -0.51,
                    2021: 0.73,
                    2022: 1.18,
                    2023: -1.57,
                    2024: 0,
                    2025: 0,
                  },
                },
              ]}
              tableProps={{
                firstColumnHeader: "Major",
                valueFormat: "percentageChange",
                decimals: 1,
              }}
              chartProps={{
                showTickLabels: true,
                valueFormat: "percentageChange",
                height: 320,
                hideHistoricalLabelsInPrint: true,
              }}
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
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        {/* Economy Section */}
        <DualPaneSectionCard id="economy" className="">
          <DualPaneSectionLeft>
            <SectionHeader>Changing Economy</SectionHeader>
            <ThemeOverrideContainer override="inverted">
              <FlippableChartTimelineCard
                title="Percentage change in labor productivity relative to 2025"
                questionId={43087}
                prefer="chart"
                historicalValues={{
                  2018: -13.93,
                  2019: -12.1,
                  2020: -7.43,
                  2021: -5.52,
                  2022: -6.91,
                  2023: -4.96,
                  2024: -2.2,
                  2025: 0,
                }}
                seriesTitle="Productivity change"
                extraRows={[
                  {
                    title: "30-year trend",
                    color: "mc4",
                    dashed: true,
                    dotSize: 0,
                    dataLabels: "never",
                    historicalValues: {
                      2018: -11.4,
                      2019: -9.93,
                      2020: -8.47,
                      2021: -7.0,
                      2022: -5.53,
                      2023: -4.07,
                      2024: -2.6,
                      2025: -1.14,
                      2030: 6.19,
                      2035: 13.52,
                    },
                  },
                ]}
                chartProps={{
                  showTickLabels: true,
                  valueFormat: "percentageChange",
                  decimals: 1,
                }}
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
            <FlippableChartTimelineCard
              title="Number of Fortune 500 companies with fewer than 5,000 employees"
              questionId={41324}
              prefer="chart"
              historicalValues={{
                2026: 30,
              }}
              chartProps={{
                showTickLabels: true,
                valueFormat: "number",
                decimals: 0,
              }}
            />
            <ActivityCard
              avatar="https://cdn.metaculus.com/labor-hub/lubossaloky_256.jpg"
              username="Ľuboš Saloky (lubossaloky)"
              subtitle="Pro Forecaster"
              link="https://www.metaculus.com/questions/41313/#comment-819256"
            >
              <p>
                Even during periods when total unemployment rates spike
                significantly, the rate of long-term unemployment relative to
                the labor force stays relatively low. People do exit the
                unemployment statistics without finding employment. When workers
                become discouraged and stop looking for employment, they leave
                the labor force. Also when someone transitions from being
                unemployed to returning to school, retiring early, or focusing
                on family care, they disappear from unemployment statistics.
              </p>
              <p>
                When discouraged workers fall off the unemployment rolls, the
                unemployment rate looks artificially lower. I’m forecasting a
                −2% change in overall employment by 2030 and −11% by 2035.
              </p>
              <p>
                However, I don’t expect these declines to be fully reflected in
                the long-term unemployment rate.
              </p>
            </ActivityCard>
            <FlippableChartTimelineCard
              title={
                <DefinitionTooltip tooltipContent="The percentage of the labor force (the population aged 16 and over not institutionalized or on active military duty) that has been unemployed for 27 weeks or more.">
                  Long-term unemployment rate
                </DefinitionTooltip>
              }
              questionId={41313}
              prefer="chart"
              historicalValues={{
                2018: 0.83,
                2019: 0.77,
                2020: 1.24,
                2021: 2.07,
                2022: 0.8,
                2023: 0.7,
                2024: 0.86,
                2025: 0.99,
              }}
              chartProps={{
                showTickLabels: true,
                valueFormat: "percentage",
                decimals: 2,
              }}
            />
            <ContentParagraph small>
              If AI allows corporations to generate ever-greater output without
              proportionally growing their workforce, workers could claim a
              shrinking slice of the economic pie, marking a redistribution of
              income from labor to capital. Even a few percentage points marks a
              major shift in the context of historical trends.
            </ContentParagraph>
            <FlippableChartTimelineCard
              title={
                <DefinitionTooltip tooltipContent="Labor share of national income is the percentage of all income earned from production in the economy, measured net of depreciation, that goes to workers in the form of wages and salaries plus employer-paid supplements such as benefits and payroll contributions.">
                  Labor share of national income
                </DefinitionTooltip>
              }
              questionId={41578}
              prefer="chart"
              historicalValues={{
                2018: 62.4,
                2019: 62.6,
                2020: 65.0,
                2021: 62.9,
                2022: 61.4,
                2023: 61.8,
                2024: 62.1,
              }}
              chartProps={{
                showTickLabels: true,
                valueFormat: "percentage",
                decimals: 1,
              }}
            />
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        <ResearchSection id="research" className="" />

        <DualPaneSectionCard id="state" className="">
          <DualPaneSectionLeft>
            <SectionHeader>State-Level View</SectionHeader>

            <ContentParagraph>
              To complement the national forecasts, we also look at the state of
              Washington to see whether short-term expectations at the state
              level track the broader national pattern. Washington is especially
              useful as a test case because of its concentration in dynamic
              industries like technology and aerospace, which could potentially
              see more dynamic short term changes.
            </ContentParagraph>
            <ContentParagraph>
              The healthcare sector (employing 13% of Washington residents) is
              forecasted to grow through 2027, largely unaffected by AI in this
              timeframe. Technology (employing 10%) is expected to see minor
              growth in the short-term, largely consistent with historical
              trends. The aerospace sector (employing 2%) is likely to face a
              slight decline, though the changes are not anticipated to be
              directly AI-related. These forecasts are short-term, leading to
              minimal predicted change.
            </ContentParagraph>
          </DualPaneSectionLeft>
          <DualPaneSectionRight className="lg:mt-16 print:mt-12">
            <MultiQuestionTable
              title="Employment change for the state of Washington for 2027"
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
          </DualPaneSectionRight>
        </DualPaneSectionCard>

        <MethodologySection id="methodology" className="" />
        <PrintAttribution />
        <EngagementSection newsletterListKey="labor" />
      </div>
    </main>
  );
}
