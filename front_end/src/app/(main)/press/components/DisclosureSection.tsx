"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

import StyledDisclosure from "../../components/styled_disclosure";

const DisclosureSection = () => {
  return (
    <div className="flex flex-col gap-2">
      <StyledDisclosure question="What is forecasting?">
        <p>
          Forecasting is the practice of putting explicit probabilities, dates,
          and numbers on future events—calculating odds via both models and
          human judgment.
        </p>
        <p>
          Although such estimates are subjective, a substantial body of
          scientific research demonstrates two points: that people who forecast
          can improve, with some becoming expertly calibrated; and that
          aggregating across many diverse opinions produces more accurate
          forecasts than even the best individuals forecasting alone. The
          resulting predictions give us a clearer sense of what tomorrow will
          look like, allowing us to make better decisions today, just as a good
          meteorologist can help us decide whether to carry an umbrella.
        </p>
        <p>
          Of course, subjects like geopolitics are not like meteorology. Yet,
          the scientific validity of human forecasting holds true even when it
          comes to subjects with a high degree of uncertainty, like the war
          between Russia and Ukraine. In fact,{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://pubmed.ncbi.nlm.nih.gov/24659192/"
          >
            research
          </a>{" "}
          by University of Pennsylvania psychologists Philip Tetlock and Barbara
          Mellers found that the aggregated geopolitical predictions of top
          forecasters were{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://www.npr.org/sections/parallels/2014/04/02/297839429/-so-you-think-youre-smarter-than-a-cia-agent"
          >
            more accurate
          </a>{" "}
          than those of CIA analysts with access to classified information.
        </p>
        <p>
          Because forecasts are expressed probabilistically, we can rarely say
          that a particular forecast was “right” or “wrong,”. Rather, we score
          forecasts mathematically by comparing forecasts to outcomes over a
          large body of questions. This enables us to determine how
          “well-calibrated” any given forecaster is—i.e., do things that they
          believe are 70% likely actually happen 70% of the time-as well as
          track the record of the whole Metaculus community over thousands of
          questions.
        </p>
        <p>
          Metaculus forecasts are well-calibrated. They provide greater
          visibility into the future.
        </p>
      </StyledDisclosure>
      <StyledDisclosure question="What is Metaculus?">
        <p>
          Metaculus is an online forecasting platform and aggregation engine
          working to improve human reasoning and coordination on topics of
          global importance. As a Public Benefit Corporation, Metaculus provides
          decision support based on these forecasts to a variety of institutions
          (<Link href="/about">learn more</Link>).
        </p>
        <p>
          Metaculus features questions on a wide range of topics, with a
          particular focus on{" "}
          <Link href="/questions/?topic=ai">artificial intelligence</Link>,{" "}
          <Link href="/questions/?categories=health-pandemics">
            biosecurity
          </Link>
          ,{" "}
          <Link href="/questions/?categories=environment-climate">
            climate change
          </Link>
          , and <Link href="/questions/?categories=nuclear">nuclear risk</Link>.
        </p>
      </StyledDisclosure>
      <StyledDisclosure question="So, is Metaculus a “prediction market”?">
        <p>
          No, Metaculus is a forecasting platform and aggregation engine. Like
          prediction markets, we collect people&apos;s forecasts and reward them
          for accuracy. But in prediction markets, participants place bets
          against each other for financial rewards, can only win insofar as
          someone else loses. Metaculus forecasters are incentivized only to
          make the most accurate forecasts, and they often collaborate to do so.
        </p>
        <p>
          Prediction markets produce forecasts via where the betting market
          settles. Metaculus explicitly aggregates everyone&apos;s forecasts
          together using algorithms we refine over time. We produce a
          time-weighted median, the &quot;Community Prediction,&quot; as well as
          the more sophisticated &quot;Metaculus Prediction&quot;.
        </p>
        <p>
          Prediction market bettors can produce accurate forecasts because they
          have “skin in the game.” But{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://pubsonline.informs.org/doi/abs/10.1287/mnsc.2015.2374"
          >
            research
          </a>{" "}
          shows that forecasting platforms like Metaculus often outperform
          prediction markets, while avoiding many of the downsides of market
          incentives that lead to regulators{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://www.washingtonpost.com/lifestyle/2023/01/24/predictit-gambling-on-politics/"
          >
            restricting their activity.
          </a>{" "}
          And critically, the research, methods, and reasoning that Metaculus
          forecasters produce are themselves valuable, as seen both in question
          comments as well as in the{" "}
          <Link href="/project/journal">Metaculus Journal</Link>.
        </p>
      </StyledDisclosure>
      <StyledDisclosure question="How can forecasts help with your reporting?">
        <div className="flex flex-col items-center gap-3 lg:flex-row lg:items-start lg:gap-8">
          <div>
            <p>
              <b>1. Complement expert analysis.</b>
            </p>
            <p>
              News stories often rely on expert analysis to put developments in
              context and to anticipate the future course of events.
              Unfortunately, experts frequently offer imprecisely worded
              forecasts—e.g., “If the United States provides it with F-16s,
              there is a real possibility that Ukraine will regain control of
              its airspace”—and{" "}
              <a
                target="_blank"
                rel="noreferrer"
                href="https://hbr.org/2018/07/if-you-say-something-is-likely-how-likely-do-people-think-it-is"
              >
                research
              </a>{" "}
              shows that people interpret “real possibility” to mean anything
              between 20% and 80%, confusing both journalists and their
              audiences. Probabilistic forecasts eliminate this problem.
            </p>
            <p>
              What’s more, to the extent that experts do put precise
              probabilities on future events, their track record is poor. One of
              Tetlock’s{" "}
              <a
                target="_blank"
                rel="noreferrer"
                href="https://press.princeton.edu/books/hardcover/9780691178288/expert-political-judgment"
              >
                early findings
              </a>{" "}
              was that political experts are highly overconfident in their
              predictions. In fact, although there is significant variance,
              their aggregate forecasts perform little better than chance. By
              contrast, Metaculus predictions perform significantly better than
              chance.
            </p>
            <p>
              <b>2. Serve as a check on the conventional wisdom.</b>
            </p>
            <p>
              Forecasts can suggest that the conventional wisdom may be wrong
              and that strongly held beliefs are worth questioning strongly. For
              example, the conventional wisdom within the American military is
              that China will invade Taiwan in the next few years. One four-star
              general went so far as to{" "}
              <a
                target="_blank"
                rel="noreferrer"
                href="https://www.airandspaceforces.com/read-full-memo-from-amc-gen-mike-minihan/"
              >
                suggest
              </a>{" "}
              there was a 100% chance of the PRC attempting to seize the island
              in 2025, leading to war with the United States. By contrast, the
              Metaculus forecast for the same time period is{" "}
              {/* <CommunityPredictionInText
                  question={createContentModel(
                    window.metacData.press_page.referenced_questions[0],
                  )}
                /> */}
              <Link
                href="/questions/7792/100-deaths-in-chinataiwan-conflict-by-2026/"
                className="text-blue-700 hover:text-blue-800 dark:text-blue-300 hover:dark:text-blue-200"
              >
                9%
              </Link>
              , not least because war between great powers is rare and because
              war between nuclear-armed great powers is unprecedented. Forecasts
              can provide an outside perspective on highly charged issues and
              serve as a check on inside thinking, adding nuance to stories.
            </p>
            <p>
              <b>3. Make sense of the big questions.</b>
            </p>
            <p>
              Metaculus forecasts can help both journalists and their readers
              make sense of developments where there is tremendous uncertainty
              by breaking large, difficult-to-answer questions into smaller,
              more tractable ones.
            </p>
            <p>
              The future of artificial intelligence falls into this category,
              where the questions people are most interested in (e.g., “Will AI
              lead to a more utopian or a more dystopian future?”) are
              impossible to answer at this point. We can, however, provide
              forecasts on{" "}
              <Link href="/questions/?topic=ai">more targeted questions</Link>{" "}
              on AI safety, the regulation of AI, technical progress on AI, and
              the business of AI—all of which can help us better understand
              which direction we are headed in and how fast. Forecasting
              questions serve as clues as to what developments we should be
              paying particular attention to. And a{" "}
              <Link href="/notebooks/16708/exploring-metaculuss-ai-track-record/">
                thorough analysis
              </Link>{" "}
              of our track record on AI-related questions showed that Metaculus
              predictions offer clear and useful insights into the future of the
              field and its impacts.
            </p>
            <p>
              Metaculus forecasts can also identify where there have been
              significant changes in our anticipations of the future. For
              example, the drastic reduction in the forecast arrival date of
              transformative AI—from the early 2040s to the current
              distribution, centered around{" "}
              {/* <CommunityPredictionInText
                  question={createContentModel(
                    window.metacData.press_page.referenced_questions[1],
                  )}
                /> */}
              <Link
                href="/questions/5121/date-of-artificial-general-intelligence/"
                className="text-blue-700 hover:text-blue-800 dark:text-blue-300 hover:dark:text-blue-200"
              >
                Apr 29, 2033
              </Link>
              —was used by{" "}
              <a
                target="_blank"
                rel="noreferrer"
                href="https://www.economist.com/finance-and-economics/2023/05/23/what-would-humans-do-in-a-world-of-super-ai"
              >
                The Economist
              </a>{" "}
              as a tangible example of how society’s expectations of AI are
              changing rapidly.
            </p>
          </div>
          <a
            className="block w-full max-w-[21rem] lg:min-w-[21rem]"
            href="https://www.economist.com/finance-and-economics/2023/05/23/what-would-humans-do-in-a-world-of-super-ai"
            target="_blank"
            rel="noreferrer"
          >
            <Image
              className="h-auto w-full max-w-full"
              src="https://cdn.metaculus.com/TheEconomistMetaculusAI.webp"
              alt="The Economist graph based on data by Metaculus on the question of when will the first general-AI system be devised, tested and announced"
              width={640}
              height={708}
              unoptimized
            />
          </a>
        </div>
      </StyledDisclosure>
    </div>
  );
};

export default DisclosureSection;
