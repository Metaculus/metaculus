import { ComponentProps, ReactNode } from "react";

import SectionToggle from "@/components/ui/section_toggle";

import { ActivityCard } from "../components/activity_card";
import {
  ContentParagraph,
  SectionCard,
  SectionHeader,
} from "../components/section";

function MethodologyToggleBody({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="space-y-5 bg-gray-0 p-5 dark:bg-gray-0-dark">
      {children}
    </div>
  );
}

function FAQItem({
  question,
  children,
  id,
}: {
  question: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="border-b border-gray-300 border-opacity-50 pb-5 last:border-0 last:pb-0 dark:border-gray-300-dark dark:border-opacity-50"
    >
      <h4 className="mb-2 mt-0 break-after-avoid text-base font-medium text-gray-800 dark:text-gray-800-dark md:text-lg">
        {question}
      </h4>
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-700-dark md:text-base [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-gray-400 [&_blockquote]:pl-3 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul_ul]:mt-1 [&_ul_ul]:list-[circle]">
        {children}
      </div>
    </div>
  );
}

export function MethodologySection({ ...props }: ComponentProps<"section">) {
  return (
    <SectionCard {...props}>
      <SectionHeader>Methodology</SectionHeader>
      <ContentParagraph className="mb-8 mt-4 break-after-avoid">
        The forecasts presented on this page were designed to address key
        uncertainties about the future impact of artificial intelligence on
        labor in the United States. They are produced by aggregating many
        individual forecasts into a prediction that{" "}
        <a
          href="https://arxiv.org/abs/1406.7563"
          target="_blank"
          rel="noreferrer"
        >
          research has shown
        </a>{" "}
        to be more accurate on average than individuals typically produce. The
        sections below provide more details about how the information above was
        produced.
      </ContentParagraph>
      <div className="-mx-6 -mb-5 sm:mx-0 sm:mb-0 sm:space-y-3">
        <SectionToggle
          title="Acknowledgements"
          variant="primary"
          hiddenUntilFound
          wrapperClassName="rounded-none sm:rounded"
        >
          <MethodologyToggleBody>
            <div className="text-gray-800 dark:text-gray-800-dark">
              <p>
                We thank the following individuals for their thoughtful input on
                the Labor Automation Forecasting Hub:
              </p>
              <ul className="list-inside list-disc pl-3 text-sm">
                <li>Jeremy Avins (Arnold Ventures)</li>
                <li>
                  Frank Britt (Valor Equity Partners and Schultz Family
                  Foundation)
                </li>
                <li>Brennan Brown (Charles Koch Foundation)</li>
                <li>Bharat Chandar (Stanford Digital Economy Lab)</li>
                <li>Jared Chung (Career Village)</li>
                <li>Tom Cunningham (METR)</li>
                <li>David Daigler (Maine Community College System)</li>
                <li>
                  Christian Edlagan (Washington Center for Equitable Growth)
                </li>
                <li>Stuart Elliott (OECD)</li>
                <li>John Garcia III (StriveTogether)</li>
                <li>Andrea Glorioso (European Commission)</li>
                <li>Dan Goldenberg (Call of Duty Endowment)</li>
                <li>Steve Lee (SkillUp)</li>
                <li>Adam Leonard (Data for Prosperity)</li>
                <li>Chauncy Lennon (Lumina Foundation)</li>
                <li>Gad Levanon (Burning Glass Institute)</li>
                <li>
                  Cass Madison (Center for Civic Futures / Renaissance
                  Philanthropy)
                </li>
                <li>Sam Manning (GovAI)</li>
                <li>Kerry McKittrick (The Project on Workforce at Harvard)</li>
                <li>Michael Meotti (Washington Student Achievement Council)</li>
                <li>Cheryl Oldham (Bipartisan Policy Center)</li>
                <li>Brent Orrell (American Enterprise Institute)</li>
                <li>Sneha Revanur (Encode AI)</li>
                <li>Philipp Schmitt (Axim Collaborative)</li>
                <li>Dane Stangler (Bipartisan Policy Center)</li>
                <li>Shayna Strom (Washington Center for Equitable Growth)</li>
                <li>Elizabeth Texiera (Britebound)</li>
                <li>Julia Trujillo (Maine Community College System)</li>
                <li>Matt Tully (Gates Ventures)</li>
                <li>Teresa Kroeger (Urban Institute)</li>
                <li>Matt Zieger (GitLab Foundation)</li>
              </ul>
              <p className="italic">
                This acknowledgement does not imply agreement with or
                endorsement of the predictions and content presented.
              </p>
            </div>
          </MethodologyToggleBody>
        </SectionToggle>

        <SectionToggle
          title="Interacting with the Hub"
          variant="primary"
          hiddenUntilFound
          wrapperClassName="rounded-none sm:rounded"
        >
          <MethodologyToggleBody>
            <FAQItem question="How often will these forecasts be updated?">
              <p>
                These forecasts are updated in real-time. As AI developments
                occur and more information comes to light, forecasters update
                their predictions and the Hub tracks how views shift over time.
                Each time a forecaster makes a new prediction, the aggregate is
                recalculated and potential updates are reflected on this page.
                The narrative descriptions are reviewed and refreshed when
                significant changes appear in the forecast data.
              </p>
              <p>
                For more about how the forecasts are made, see the{" "}
                <a href="#making-the-forecasts">Making the forecasts</a>{" "}
                section.
              </p>
            </FAQItem>
            <FAQItem question="How do I stay up to date with new forecasts?">
              <p>
                You can click the &ldquo;Bell&rdquo; icon at the top to get
                notified when there are substantial updates to the forecasts.
                This Hub aims to provide a resource to track developments over
                time, and provide the latest information each time you return.
                If you find it useful, please share it with others who could
                benefit from seeing these forecasts.
              </p>
              <p>
                You can also view and contribute to the forecasts on the{" "}
                <a
                  href="https://www.metaculus.com/tournament/labor-hub/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Labor Automation Tournament
                </a>{" "}
                page.
              </p>
            </FAQItem>
            <FAQItem question="What if I don’t see a forecast that I think would be important to have, or have other feedback?">
              <p>
                Please reach out and let us know! We can&rsquo;t guarantee that
                your question or feedback will be included, but we want to hear
                how we can make this resource as useful as possible. You can get
                in touch with us by emailing{" "}
                <a
                  className="whitespace-nowrap"
                  href="mailto:labor-hub@metaculus.com"
                >
                  labor-hub@metaculus.com
                </a>
                .
              </p>
            </FAQItem>
            <FAQItem question="Can this be expanded to additional focus areas, and how can partners get involved?">
              <p>
                Yes, this forecasting approach is flexible and can be applied to
                many different related or unrelated topics. If you would like to
                explore ways this Hub could be expanded, including by featuring
                your work or your thinking, or other areas where forecasts could
                be valuable, please reach out to us at{" "}
                <a
                  className="whitespace-nowrap"
                  href="mailto:labor-hub@metaculus.com"
                >
                  labor-hub@metaculus.com
                </a>
                .
              </p>
              <p>
                You can also visit the{" "}
                <a
                  href="https://www.metaculus.com/services/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Metaculus Services page
                </a>{" "}
                to learn more about our forecasting services.
              </p>
            </FAQItem>
            <FAQItem question="How do I join the conversation or share my own forecasts?">
              <p>
                If you want to share your own forecasts, or ask a question or
                share a thought with participants and Metaculus staff, you can
                do so by creating a Metaculus account and forecasting in the{" "}
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://www.metaculus.com/tournament/labor-hub/"
                >
                  Labor Automation Tournament
                </a>
                , or jumping in with a comment on the{" "}
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://www.metaculus.com/notebooks/43247/labor-automation-forecasting-hub-forum/"
                >
                  Hub Forum
                </a>
                .
              </p>
              <p>
                If you have established experience in AI, economics, or a
                related field, and are interested in having your thinking or
                work highlighted on the Hub, please contact us at{" "}
                <a
                  className="whitespace-nowrap"
                  href="mailto:labor-hub@metaculus.com"
                >
                  labor-hub@metaculus.com
                </a>{" "}
                so we can discuss further.
              </p>
            </FAQItem>
          </MethodologyToggleBody>
        </SectionToggle>

        <SectionToggle
          title="Occupation selection and approach"
          variant="primary"
          hiddenUntilFound
          wrapperClassName="rounded-none sm:rounded"
        >
          <MethodologyToggleBody>
            <FAQItem question="Why did you pick these occupations?">
              <p>
                The occupations were picked based on the categorizations and
                data available from the Bureau of Labor Statistics (BLS)&rsquo;{" "}
                <a
                  href="https://www.bls.gov/oes/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Occupational Employment and Wage Statistics
                </a>{" "}
                (OEWS) dataset. OEWS annually compiles a comprehensive
                occupational makeup of the US workforce, detailing employment
                data for 830 occupations. Metaculus selected sets of
                occupational groupings based on the following heuristics:
              </p>
              <ul>
                <li>
                  Capturing occupations identified by the literature at high and
                  low levels of AI vulnerability
                </li>
                <li>
                  Capturing occupations that are of public interest and have
                  been discussed in the media as at risk of being impacted by AI
                </li>
                <li>
                  Selecting occupations that each represent a sizeable portion
                  of the workforce
                </li>
                <li>Choosing a wide range of types of occupations</li>
                <li>
                  Selecting occupations so that a visitor who does not see a
                  particular occupation they&rsquo;re interested in will ideally
                  find a related or comparable occupation
                </li>
              </ul>
            </FAQItem>
            <FAQItem question="How are the listed occupations defined?">
              <p>
                The OEWS data used to measure occupational employment defines
                the occupations using the{" "}
                <a
                  href="https://www.bls.gov/soc/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Standard Occupational Classification
                </a>{" "}
                (SOC) system. The most recent edition of this system is the{" "}
                <a
                  href="https://www.bls.gov/soc/2018/home.htm"
                  target="_blank"
                  rel="noreferrer"
                >
                  2018 SOC
                </a>
                . The detailed definitions for each occupation can be found in
                the{" "}
                <a
                  href="https://www.bls.gov/soc/2018/soc_2018_definitions.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  2018 SOC Definitions
                </a>{" "}
                documentation. We have renamed some of these occupations for
                brevity in the Hub, and you can find each occupation listed in
                the Hub, along with its full formal name and SOC code, and any
                occupation categories it contains, at the{" "}
                <a
                  href="https://oews-forecasting-tool.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Metaculus Employment Forecasting Tool
                </a>
                . Note that, as shown in the{" "}
                <a
                  href="https://www.bls.gov/soc/2018/soc_structure_2018.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  2018 SOC Structure
                </a>{" "}
                documentation, the SOC structure consists of four levels which
                from largest to smallest are: Major Group, Minor Group, Broad
                Group, and Detailed Occupation.
              </p>
            </FAQItem>
            <FAQItem question="What previous literature is there and how did you use it?">
              <p>
                We&rsquo;ve learned a lot from prior literature and from talking
                to experts for their feedback while developing this project. We
                referred to research on occupational exposure to AI when
                selecting which occupations to focus on, ensuring that we
                selected occupations rated as highly exposed or vulnerable to AI
                automation.<sup className="mr-1 text-xs">1, 2, 3, 4, 5, 6</sup>{" "}
                We made sure that recent college graduates and entry-level
                workers were a key focus, based in part on research suggesting
                that group may be one of the first impacted by AI.
                <sup className="mr-1 text-xs">7</sup> We structured some
                questions around metrics developed or identified by the
                literature, such as the change in occupational mix.
                <sup className="mr-1 text-xs">8</sup> Prior research helped
                inform us about what government data and projections might
                capture and not capture. <sup className="mr-1 text-xs">9</sup>{" "}
                And we considered other available estimates, reports, and data
                sources as we honed the Hub focus and presentation.
                <sup className="mr-1 text-xs">
                  10, 11, 12, 13, 14, 15, 16
                </sup>{" "}
                All kinds of resources, perspectives, and discussions not
                mentioned here have informed our thinking for the Labor
                Automation Forecasting Hub, and we&rsquo;re grateful to everyone
                who has been thinking carefully about this topic and sharing
                their reasoning and findings publicly.
              </p>
              <p>
                For more information and comparisons, see the Hub section{" "}
                <a href="#research">Comparison to Existing Research</a>
              </p>
              <ol className="list-decimal space-y-2 pl-5 text-xs">
                <li>
                  Felten, E. W., Raj, M., &amp; Seamans, R. (2023, April 10).{" "}
                  <a
                    href="https://doi.org/10.2139/ssrn.4414065"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Occupational heterogeneity in exposure to generative AI
                  </a>
                  .
                </li>
                <li>
                  Tomlinson, K., et al. (2025).{" "}
                  <a
                    href="https://doi.org/10.48550/arXiv.2507.07935"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Working with AI: Measuring the applicability of generative
                    AI to occupations
                  </a>
                  .
                </li>
                <li>
                  U.S. Department of the Treasury. (2024, December).{" "}
                  <a
                    href="https://home.treasury.gov/system/files/136/Artificial-Intelligence-in-Financial-Services.pdf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Artificial intelligence in the financial services sector:
                    Report on the uses, opportunities, and risks of artificial
                    intelligence in the financial services sector
                  </a>
                  .
                </li>
                <li>
                  International Labour Organization. (2025, May 20).{" "}
                  <a
                    href="https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Generative AI and jobs: A refined global index of
                    occupational exposure
                  </a>
                  .
                </li>
                <li>
                  Anthropic.{" "}
                  <a
                    href="https://www.anthropic.com/economic-index"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Economic Index
                  </a>
                  .
                </li>
                <li>
                  Manning, S. J., & Aguirre, T. (2026, January).{" "}
                  <a
                    href="https://www.nber.org/papers/w34705"
                    target="_blank"
                    rel="noreferrer"
                  >
                    How adaptable are American workers to AI-induced job
                    displacement?
                  </a>
                </li>
                <li>
                  Brynjolfsson, E., Chandar, B., &amp; Chen, R. (2025, August
                  26).{" "}
                  <a
                    href="https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Canaries in the coal mine? Six facts about the recent
                    employment effects of artificial intelligence
                  </a>
                  .
                </li>
                <li>
                  Gimbel, M., et al. (2025).{" "}
                  <a
                    href="https://budgetlab.yale.edu/research/evaluating-impact-ai-labor-market-current-state-affairs"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Evaluating the impact of AI on the labor market: Current
                    state of affairs
                  </a>
                  .
                </li>
                <li>
                  Massenkoff, M. (2025, October 16).{" "}
                  <a
                    href="https://maximmassenkoff.com/papers/OccupationalOutlooks.pdf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    How predictable is job destruction? Evidence from the
                    Occupational Outlook
                  </a>
                  .
                </li>
                <li>
                  McKinsey Global Institute.{" "}
                  <a
                    href="https://www.mckinsey.com/mgi/our-research/generative-ai-and-the-future-of-work-in-america"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Generative AI and the future of work in America
                  </a>
                  .
                </li>
                <li>
                  Encode AI.{" "}
                  <a
                    href="https://planforai.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Game Plan
                  </a>
                  .
                </li>
                <li>
                  Kokotajlo, D., et al. (2025, April 3).{" "}
                  <a
                    href="https://ai-2027.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    AI 2027
                  </a>
                  .
                </li>
                <li>
                  Karpathy, A.{" "}
                  <a
                    href="https://karpathy.ai/jobs/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    US Job Market Visualizer
                  </a>
                  .
                </li>
                <li>
                  Zieger, M.{" "}
                  <a
                    href="https://jobsdata.ai/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    jobsdata.ai: Early Signals of AI Impact
                  </a>
                  .
                </li>
                <li>
                  Forecasting Research Institute.{" "}
                  <a
                    href="https://leap.forecastingresearch.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Longitudinal Expert AI Panel (LEAP)
                  </a>
                  .
                </li>
                <li>
                  Karger, E., et al. (2026, March).{" "}
                  <a
                    href="https://static1.squarespace.com/static/635693acf15a3e2a14a56a4a/t/69cbb9d509ada447b6d9013f/1774959061185/forecasting-the-economic-effects-of-ai.pdf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Forecasting the economic effects of AI
                  </a>
                </li>
              </ol>
            </FAQItem>
            <FAQItem question="What makes an occupation vulnerable or not vulnerable?">
              <p>
                Occupations were initially selected to include high, medium, and
                low exposure or vulnerability occupations based on previously
                published literature. In the literature, these exposure or
                vulnerability ratings were generally created by judgmental
                assessments of the automatability of various tasks and mapping
                those tasks onto occupations classifications.
              </p>
              <p>
                In the work presented on this dashboard, the vulnerability
                assessments are based on the predictions made by forecasters.
                The most and least vulnerable series in the{" "}
                <a href="#overview">By Job Vulnerability chart</a> represents a
                grouping of the three occupational categories that are
                forecasted to have the highest and lowest changes in employment
                in 2035. The forecasted percent changes across these occupations
                present the simple average of the median forecasts, but more
                details about each occupation can be seen in the{" "}
                <a href="#jobs">Jobs Monitor</a>.
              </p>
            </FAQItem>
            <FAQItem question="What underlying occupation data is being used?">
              <p>
                The resolution source for the occupation-based questions is the
                Bureau of Labor Statistics (BLS)&rsquo;{" "}
                <a
                  href="https://www.bls.gov/oes/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Occupational Employment and Wage Statistics
                </a>{" "}
                (OEWS). Each year BLS updates its occupation-level employment
                data, providing employment and wage levels. While BLS advises
                caution when working with OEWS data for trend assessments, the
                resolution criteria to the forecasting questions specify that in
                the event of reclassifications or changes the forecasting
                questions will be resolved according to the 2025
                classifications, using{" "}
                <a
                  href="https://www.bls.gov/emp/documentation/crosswalks.htm"
                  target="_blank"
                  rel="noreferrer"
                >
                  crosswalks
                </a>{" "}
                to map the data back to the 2025 classifications if necessary.
              </p>
            </FAQItem>
          </MethodologyToggleBody>
        </SectionToggle>

        <SectionToggle
          title="How much AI is driving the results"
          variant="primary"
          hiddenUntilFound
          wrapperClassName="rounded-none sm:rounded"
        >
          <MethodologyToggleBody>
            <div className="space-y-3 border-b border-gray-300 border-opacity-50 pb-5 dark:border-gray-300-dark dark:border-opacity-50">
              <p className="my-0 text-sm text-gray-700 dark:text-gray-700-dark md:text-base">
                The forecasting questions in the Hub aren&rsquo;t explicitly
                posed as being dependent on AI, so why are we asserting that AI
                is what&rsquo;s driving the changes being predicted? How do we
                know these forecasts aren&rsquo;t driven by recession or some
                other rare outcomes?
              </p>
              <p className="my-0 text-sm text-gray-700 dark:text-gray-700-dark md:text-base">
                While the forecasts presented above cannot be claimed to be
                solely driven by AI, we have used a variety of supporting
                evidence to strengthen and support our claims that these changes
                are primarily attributable to AI.
              </p>
            </div>
            <FAQItem question="Projections from other sources not accounting for AI">
              <p>
                BLS employment projections show that despite an aging
                population, employment levels are expected to grow by
                approximately 3% over the next decade. By treating this as a
                baseline in a no-AI or limited-AI scenario, it significantly
                reduces the likelihood that the effects presented here are
                driven by factors such as an aging population or other
                employment or demographic trends.
              </p>
            </FAQItem>
            <FAQItem question="Reasoning and assessments from Pro Forecasters">
              <p>
                We can use more qualitative reasoning to help confirm our
                hypothesis. See below for a selection of quotes from the
                Metaculus{" "}
                <a href="#what-are-pro-forecasters">Pro Forecasters</a>{" "}
                participating in this project which demonstrate that the core
                driver of the changes they&rsquo;re forecasting is due to the
                development of advanced AI:
              </p>
              <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
                <ActivityCard
                  avatar="https://cdn.metaculus.com/labor-hub/haiku_256.jpg"
                  username="Nathan Metzger (Haiku)"
                  subtitle="Pro Forecaster"
                  link="https://www.metaculus.com/accounts/profile/145394/comments/#comment-801550"
                >
                  <p>
                    All else somehow being equal (never mind how), what happens
                    to employment if AI just stops getting much better?
                  </p>
                  <p className="!mt-2">
                    I still expect economic impacts from AI, but I expect them
                    to mostly be wide and shallow, other than in a few
                    already-impacted occupations. Elicitation (especially via
                    scaffolding) will continue to unlock capabilities in current
                    AI models. AI will continue to diffuse through the economy,
                    and will even eliminate the need for some roles. But in any
                    stagnation scenario, AI should behave much more like a
                    normal technology, and the labor market should be able to
                    absorb those changes without too much loss of employment.
                  </p>
                </ActivityCard>
                <ActivityCard
                  username="Ľuboš Saloky (lubossaloky)"
                  subtitle="Pro Forecaster"
                  avatar="https://cdn.metaculus.com/labor-hub/lubossaloky_256.jpg"
                  link="https://www.metaculus.com/accounts/profile/135380/comments/#comment-809433"
                >
                  <p>
                    My forecast for 2027 is based on a &ldquo;mostly normal
                    economy&rdquo; scenario. For 2030 and 2035, I used a
                    weighted average of all Topline employment questions from
                    this tournament. These projections are grounded in [the]
                    following set of core ideas and assumptions:
                  </p>
                  <ul>
                    <li>
                      <em>
                        AI is transforming society faster than [the] industrial
                        revolution, computers, or internet. AI will not fizzle
                        out.
                      </em>
                    </li>
                    <li>
                      <em>
                        AI is capital intensive, high-skill biased, and labor
                        saving. It will disproportionately benefit owners of
                        capital at the expense of workers.
                      </em>
                    </li>
                    <li className="list-none">
                      <em>. . .</em>
                    </li>
                    <li>
                      <em>
                        Rising technological unemployment: AI advances
                        outrunning the pace at which we find new uses of labor.
                      </em>
                    </li>
                  </ul>
                </ActivityCard>
              </div>
            </FAQItem>
            <FAQItem question="Conditional forecasts on recession and AI stagnation">
              <p>
                To test how much AI is driving these forecasts we’ve also asked
                a few questions to our forecasters aimed at measuring how much
                of the prediction is being driven by AI. To do this, we ask
                conditional questions of the form:
              </p>
              <ul>
                <li>
                  What will the percent change in the US employment levels be in
                  these years vs 2025, conditional on positive real GDP growth?
                  <ul>
                    <li>
                      <strong>
                        This shows us what the overall employment forecast looks
                        like if GDP growth remains strong; employment if the
                        economy is not in an output downturn
                      </strong>
                    </li>
                  </ul>
                </li>
                <li>
                  What will the percent change in the US employment levels be in
                  these years vs 2025, conditional on AI benchmark stagnation?
                  <ul>
                    <li>
                      <strong>
                        This shows us what the overall employment forecast looks
                        like if AI progress were to halt; employment if AI were
                        to remain at roughly 2026-level capabilities
                      </strong>
                    </li>
                  </ul>
                </li>
              </ul>
              <p>
                In a subsequent update we’ll present results comparing these
                forecasts, likely from the cohort of Pro Forecasters to ensure
                we’re comparing results from the same set of forecasters.
              </p>
              {/* Waiting for data to be stable enough to present these charts
              <MultiQuestionLineChart
                title="Conditional forecasts on recession and AI stagnation"
                showHistoricalForecastAnnotation={false}
                rows={[
                  {
                    questionId: 41307,
                    title: "Overall employment",
                    color: "blue",
                    historicalValues: {
                      2025: 0,
                    },
                  },
                  {
                    questionId: 43025,
                    title: "Positive GDP growth",
                    historicalValues: {
                      2025: 0,
                    },
                  },
                  {
                    questionId: 43028,
                    title: "AI benchmark stagnation",
                    historicalValues: {
                      2025: 0,
                    },
                  },
                ]}
                height={250}
                className="break-inside-avoid overflow-hidden rounded bg-blue-200 p-4 dark:bg-blue-800 md:p-5 print:border print:border-gray-300"
              />
               */}
            </FAQItem>
          </MethodologyToggleBody>
        </SectionToggle>

        <SectionToggle
          title="Forecast uncertainty, disagreement, and other statistics"
          variant="primary"
          hiddenUntilFound
          wrapperClassName="rounded-none sm:rounded"
        >
          <MethodologyToggleBody>
            <div className="text-sm text-gray-800 dark:text-gray-800-dark md:text-base">
              <p>
                In the page above, we only report the median forecast from each
                question, but forecasters who predicted in the Labor Automation
                Tournament have actually expressed their full probability
                distributions over these outcomes. The aggregate median also
                masks if there is disagreement among the forecasters.
              </p>
              <p>
                We&apos;ve published a tool that provides data on disagreement
                and uncertainty, as well as other statistics and detailed
                information,{" "}
                <a
                  href="https://labor-hub-question-statistics.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                >
                  here
                </a>
                .
              </p>
            </div>
          </MethodologyToggleBody>
        </SectionToggle>

        <SectionToggle
          title="Making the forecasts"
          variant="primary"
          hiddenUntilFound
          wrapperClassName="rounded-none sm:rounded"
        >
          <MethodologyToggleBody id="making-the-forecasts">
            <FAQItem question="Why make predictions with probabilities?">
              <p>
                The forecasting Metaculus employs involves making explicit
                predictions about the future. Instead of vague assertions,
                forecasters share specific probabilities (like the weather
                forecast that helps you decide if you should take an umbrella),
                concrete dates, and measurable outcomes.
              </p>
              <p>
                When you start regularly using Metaculus, it becomes more than a
                forecasting platform&mdash;it becomes a whole new way of
                thinking, one that generates more productive disagreements and
                conversations that are grounded in what will actually happen,
                and in which pieces of evidence point toward which future.
              </p>
              <p>
                Additionally, forecasting with probabilities allows the
                predictions to be scored in a manner that incentivizes
                forecasters to enter their true beliefs. You can find more on
                the scoring and incentive mechanisms in our{" "}
                <a
                  href="https://www.metaculus.com/help/scores-faq/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Scores FAQ
                </a>
                .
              </p>
            </FAQItem>
            <FAQItem question="How are forecasts made on Metaculus?">
              <p>
                On Metaculus, anyone can sign up and make a prediction, and each
                forecaster can submit how likely they think an outcome is on
                each forecasting question. For example, a user can predict on
                the question{" "}
                <a
                  href="https://www.metaculus.com/questions/8362/us-china-war-before-2035/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <em>Will there be a US-China war before 2035?</em>
                </a>{" "}
                by submitting a probability, say 10%, and can share their
                reasoning in the comments if they wish. All questions will have
                a clear outcome backed by specific resolution criteria defined
                on each question, and all forecasters will receive a score.
                Individual forecasts are aggregated together to produce the
                Community Prediction, which outperforms nearly all forecasters
                across many questions.
              </p>
            </FAQItem>
            <FAQItem question="Who made these forecasts?">
              <p>
                Anyone can register and forecast on Metaculus, and there are
                also five{" "}
                <a
                  href="https://www.metaculus.com/services/pro-forecasters/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Metaculus Pro Forecasters
                </a>{" "}
                predicting on the questions who are required to share their
                reasoning, enabling better interpretation of the forecasts and
                providing more information that can be used by the broader
                community of forecasters. Metaculus has always allowed anyone to
                join and forecast, which ensures a diverse range of views and
                information are represented in the aggregate forecast.
                Currently, the aggregate forecast, or Community Prediction,
                represents the{" "}
                <a
                  href="https://www.metaculus.com/faq/#community-prediction"
                  target="_blank"
                  rel="noreferrer"
                >
                  recency-weighted median
                </a>{" "}
                of the forecasters, and this approach has displayed good
                accuracy and calibration as reflected in our{" "}
                <a
                  href="https://www.metaculus.com/questions/track-record/"
                  target="_blank"
                  rel="noreferrer"
                >
                  track record
                </a>
                .
              </p>
              <p>
                If you would like to participate in the Labor Automation
                Tournament that feeds into this Hub, you can do so{" "}
                <a
                  href="https://www.metaculus.com/tournament/labor-hub/"
                  target="_blank"
                  rel="noreferrer"
                >
                  here
                </a>
                .
              </p>
            </FAQItem>
          </MethodologyToggleBody>
        </SectionToggle>

        <SectionToggle
          title="About Metaculus"
          variant="primary"
          hiddenUntilFound
          wrapperClassName="rounded-none sm:rounded"
        >
          <MethodologyToggleBody>
            <FAQItem question="What is Metaculus?">
              <p>
                Metaculus is an online forecasting platform and aggregation
                engine working to improve human reasoning and coordination on
                topics of global importance. As a Public Benefit Corporation,
                Metaculus provides decision support based on these forecasts to
                a variety of institutions.
              </p>
              <p>
                Metaculus features questions on a wide range of topics,
                including artificial intelligence, biosecurity, geopolitics,
                climate change, and nuclear risk.
              </p>
            </FAQItem>
            <FAQItem question="Is Metaculus a market?">
              <p>
                No, Metaculus is not a market. Unlike platforms like Kalshi or
                Polymarket, our forecasters do not buy shares or stake any
                money.
              </p>
              <p>
                Instead, Metaculus forecasters are motivated by{" "}
                <a
                  href="https://www.metaculus.com/leaderboard/"
                  target="_blank"
                  rel="noreferrer"
                >
                  yearly accuracy leaderboards
                </a>
                ,{" "}
                <a
                  href="https://www.metaculus.com/tournaments/"
                  target="_blank"
                  rel="noreferrer"
                >
                  winning tournaments
                </a>{" "}
                that award cash prizes or medals, and, most importantly, a
                desire to be right, learn more about the world, contribute to a
                valuable public resource, and have fun. Much like Wikipedia
                editors, our forecasters are often driven by the joy of
                contributing to shared knowledge and helping others access
                valuable information.
              </p>
              <p>
                Read more:{" "}
                <a
                  href="https://www.metaculus.com/notebooks/38198/metaculus-and-markets-whats-the-difference/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Metaculus and Markets: What&rsquo;s the Difference?
                </a>
              </p>
            </FAQItem>
            <FAQItem question="Is Metaculus accurate?">
              <p>
                The wisdom of the crowd is surprisingly accurate&mdash;often
                startlingly so. That&apos;s not to say that it&apos;s always
                right, but it is extremely difficult to beat consistently over
                time. Metaculus&apos;{" "}
                <a
                  href="https://www.metaculus.com/questions/track-record/"
                  target="_blank"
                  rel="noreferrer"
                >
                  publicly available track record
                </a>{" "}
                demonstrates that the Community Prediction is also
                well-calibrated, meaning that it correctly estimates its own
                uncertainty&mdash;when Metaculus predicts things are 70% likely
                to happen, those things happen roughly 70% of the time.
              </p>
              <p>
                The questions on the Labor Automation Forecasting Hub are longer
                term than the average Metaculus question, past performance
                doesn&rsquo;t guarantee future results, and we don&rsquo;t claim
                to be an oracle. But we think that leveraging the{" "}
                <a
                  href="https://en.wikipedia.org/wiki/Wisdom_of_the_crowd"
                  target="_blank"
                  rel="noreferrer"
                >
                  wisdom of the crowd
                </a>{" "}
                with our carefully designed incentive structures is one of the
                best, if not the best, methods available to anticipate what the
                future holds. The Hub fills an information gap where there is
                currently little information available and lots of speculation
                and punditry from individuals. By aggregating views we create a
                resource that aggregates many different views into a view likely
                more accurate than most individual perceptions, and which will
                update in real-time as news breaks.
              </p>
              <p>
                Read more:{" "}
                <a
                  href="https://www.metaculus.com/why/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Less Noise, More Truth: Metaculus&rsquo; method for clear
                  decisions in a complex world
                </a>
              </p>
            </FAQItem>
            <FAQItem
              question="What are Metaculus Pro Forecasters?"
              id="what-are-pro-forecasters"
            >
              <p>
                Five Metaculus Pro Forecasters have submitted predictions and
                reasoning on these forecasting questions and some of this
                reasoning has been highlighted on the Hub. Metaculus employs{" "}
                <a
                  href="https://www.metaculus.com/services/pro-forecasters/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Pro Forecasters
                </a>{" "}
                who have demonstrated excellent forecasting ability and who have
                a history of clearly describing their rationales. Pros forecast
                on private and public sets of questions to produce
                well-calibrated forecasts and descriptive rationales for our
                partners.
              </p>
              <p>
                Pros are selected for having the top scores from among the
                community, based on robust track records of at least 75 scored
                questions (questions where the outcome has become known). Most
                Pros have hundreds or thousands of resolved questions under
                their belt. Additionally, Pro Forecasters must have a history of
                making clear and insightful comments. Recruiting based on these
                factors allows Metaculus to deploy Pro Forecasters on projects
                for partners and clients to provide both calibrated forecasts
                and clear reasoning to help observers understand the factors
                behind the prediction.
              </p>
              <p>
                Read more:{" "}
                <a
                  href="https://www.metaculus.com/services/pro-forecasters/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Metaculus Pro Forecasters
                </a>
              </p>
            </FAQItem>
          </MethodologyToggleBody>
        </SectionToggle>
      </div>
    </SectionCard>
  );
}
