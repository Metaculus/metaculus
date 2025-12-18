import Image from "next/image";

import Button from "@/components/ui/button";

import GlobalHeader from "../../../../(main)/components/headers/global_header";
import PageWrapper from "../../../../(main)/components/pagewrapper";

export const metadata = {
  title: "How It Works - Bridgewater Open Forecasting Tournament",
  description:
    "Learn how the Bridgewater x Metaculus Forecasting Contest works, including timeline, prizes, and forecasting guidance.",
};

export default function HowItWorks() {
  return (
    <>
      <GlobalHeader />
      <div className="mx-auto mt-12 flex w-full justify-center pb-0 pt-10">
        {" "}
        <Button
          variant="secondary"
          className="cursor-pointer"
          href={`/bridgewater`}
        >
          Register for the Tournament
        </Button>
      </div>
      <PageWrapper>
        <div className="flex flex-col items-start justify-between md:flex-row md:items-center">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              How it works
            </h1>
            <h3 className="mt-0 text-lg text-gray-600 dark:text-gray-400">
              Bridgewater x Metaculus Forecasting Contest
            </h3>
          </div>
        </div>

        <hr className="my-4 border-t-2 border-gray-300 dark:border-gray-700" />

        <p className="mb-6">
          Whether you&apos;re a newcomer or a seasoned Metaculus forecaster,
          this tournament has some unique features we want to highlight.
        </p>

        <h2 className="mb-4 text-2xl font-bold text-gray-700 dark:text-gray-200">
          Contest Timeline
        </h2>

        <div className="relative w-full">
          <Image
            src="https://cdn.metaculus.com/bw-timeline-light_5CM93nQ.webp"
            alt="Contest Timeline"
            width={800}
            height={400}
            className="w-full dark:hidden"
          />
          <Image
            src="https://cdn.metaculus.com/bw-timeline-dark_8xkhnj6.webp"
            alt="Contest Timeline"
            width={800}
            height={400}
            className="hidden w-full dark:block"
          />
        </div>
        <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-700 dark:text-gray-200">
          Warm-up Questions
        </h2>

        <p className="mb-4">
          Practice forecasting with our{" "}
          <a
            href="https://www.metaculus.com/project/bridgewater-warmup/"
            className="text-blue-600 hover:underline"
          >
            warm-up questions
          </a>{" "}
          before the contest begins January 12th. Warm-up questions won&apos;t
          affect your contest ranking.
        </p>

        <div className="mb-8 rounded-md bg-green-100 px-4 pb-4 pt-2 dark:bg-green-900">
          <h4 className="font-bold text-gray-800 dark:text-white">
            The Forecasting Contest officially begins at 11:00 AM ET on January
            12, 2026.
          </h4>
        </div>

        <hr className="my-8 border-t-2 border-gray-300 dark:border-gray-700" />

        <h2 className="mb-4 text-2xl font-bold text-gray-700 dark:text-gray-200">
          One Contest, Two Leaderboards for Undergraduate and Open Competitions
        </h2>

        <p className="mb-6 text-gray-600 dark:text-gray-300">
          This contest consists of a single set of 50 forecasting questions,
          with two separate competitions and leaderboards, one for all
          competitors under the banner of the Open Competition and one for
          undergraduate competitors within the Undergraduate Competition.
        </p>

        <h3 className="mb-3 text-xl font-semibold text-gray-600 dark:text-gray-300">
          $30,000 In Prizes
        </h3>

        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Each of the two competitions and leaderboards features a $12,500
          standard prize pool, and new for this year, the undergraduate
          leaderboard has a bonus prize pool of $5,000, for a total of $30,000.
          This year the top 50 forecasters within each competition and
          leaderboard are eligible to win prizes. Competing undergraduate
          forecasters are eligible to be ranked and receive prizes for their
          performance on both leaderboards. Prizes will be awarded after contest
          completion and following identity verification. The bonus prize pool
          for undergraduates will be awarded to the top performers in the
          undergraduate competition as follows:
        </p>

        <ol className="mb-6 ml-6 list-decimal space-y-1 text-gray-700 dark:text-gray-300">
          <li>$1,100</li>
          <li>$900</li>
          <li>$750</li>
          <li>$600</li>
          <li>$500</li>
          <li>$400</li>
          <li>$300</li>
          <li>$200</li>
          <li>$150</li>
          <li>$100</li>
        </ol>

        <h3 className="mb-3 text-xl font-semibold text-gray-600 dark:text-gray-300">
          Undergraduate Competition and Leaderboard
        </h3>

        <p className="mb-6">
          The Undergraduate competition and leaderboard are open only to
          undergraduate students currently enrolled in colleges and
          universities. If you enroll in the Undergraduate Competition, you will
          automatically also be included in the Open Competition. This is your
          opportunity to stand out to the Bridgewater recruiting team and
          compete for a share of the $17,500 Undergraduate Prize Pool!
        </p>

        <h3 className="mb-3 text-xl font-semibold text-gray-600 dark:text-gray-300">
          Open Competition and Leaderboard
        </h3>

        <p className="mb-6">
          Alongside the Undergraduate Competition and Leaderboard, there is an
          Open Competition and Leaderboard in which anyone can compete, with an
          associated $12,500 Open Prize Pool. Experienced and new forecasters
          alike will have the chance to demonstrate their skills and become
          eligible for a potential meeting with the Bridgewater recruitment
          team.
        </p>
        <hr className="my-8 border-t-2 border-gray-300 dark:border-gray-700" />

        <h2 className="mb-4 text-2xl font-bold text-gray-700 dark:text-gray-200">
          Advice for new forecasters
        </h2>

        <p className="mb-4">
          New to forecasting? No problem. Here&apos;s how to get ahead:
        </p>

        <ul className="mb-8 list-inside list-disc space-y-2">
          <li>
            Begin early and try to forecast on all questions. You need volume to
            beat the noise.
          </li>
          <li>
            Consider base rates: how have similar events gone in the past?
          </li>
          <li>
            Consider diverse points of view: good forecasters cover all angles.
          </li>
          <li>
            Stay informed with the latest news, and keep your forecasts updated;
            agility is key.
          </li>
        </ul>

        <hr className="my-8 border-t-2 border-gray-300 dark:border-gray-700" />

        <h2 className="mb-4 text-2xl font-bold text-gray-700 dark:text-gray-200">
          Useful Resources
        </h2>

        <p className="mb-4">
          Whether you&apos;re a beginner or looking to brush up your skills,
          here are some resources:
        </p>

        <ul className="mb-8 list-inside list-disc space-y-2">
          <li>
            <a href="#how-to" className="text-blue-600 hover:underline">
              How to forecast on Metaculus
            </a>
          </li>
          <li>
            <a
              href="https://www.metaculus.com/help/scores-faq/#tournament-scores/"
              className="text-blue-600 hover:underline"
            >
              How prizes are distributed in Metaculus tournaments
            </a>
          </li>
          <li>
            <a
              href="https://www.metaculus.com/help/prediction-resources/"
              className="text-blue-600 hover:underline"
            >
              Prediction Resources
            </a>
          </li>
          <li>
            <a
              href="https://www.metaculus.com/project/bridgewater-warmup/"
              className="text-blue-600 hover:underline"
            >
              Warmup with Practice Questions
            </a>
          </li>
        </ul>

        <hr className="my-8 border-t-2 border-gray-300 dark:border-gray-700" />

        <h2 className="mb-4 text-2xl font-bold text-gray-700 dark:text-gray-200">
          A message from Bridgewater
        </h2>

        <p className="mb-8">
          The foundation of Bridgewater is our mission to deeply understand how
          the world works and translate that understanding into unique market
          insights, aligning with Metaculus&apos; mission—a platform for
          forecasting and modeling future events and trends. We hope this
          partnership reaches more people who see the power of using data and
          research to comprehend the world around us.{" "}
          <a
            href="https://www.metaculus.com/bridgewater"
            className="text-blue-600 hover:underline"
          >
            Join now
          </a>{" "}
          to showcase your skills and take part in this exciting tournament!
        </p>
        <hr className="my-8 border-t-2 border-gray-300 dark:border-gray-700" />

        <h2 className="mb-4 text-2xl font-bold text-gray-700 dark:text-gray-200">
          Questions? Contact Us
        </h2>

        <p className="mb-8">
          Don&apos;t hesitate to reach out to us at{" "}
          <a
            href="mailto:contact@metaculus.com"
            className="text-blue-600 hover:underline"
          >
            contact@metaculus.com
          </a>
          . We read and respond to every email!
        </p>

        <hr className="my-8 border-t-2 border-gray-300 dark:border-gray-700" />

        <h1
          id="how-to"
          className="mb-6 text-3xl font-bold text-gray-800 dark:text-gray-100"
        >
          How to Forecast on Metaculus
        </h1>

        <h2 className="mb-4 text-2xl font-bold text-gray-700 dark:text-gray-200">
          Binary and Multiple Choice Questions
        </h2>

        <p className="mb-4">
          <b>Examples:</b>{" "}
          <i>&quot;Who will be Japan&apos;s next Prime Minister?&quot;</i>,{" "}
          <i>&quot;Will NASA&apos;s Artemis 2 launch be successful?&quot;</i>, …
        </p>

        <p className="mb-6">
          To predict, share the probability you give the outcome as a number
          between 0.1% and 99.9%. On the question page, simply drag the
          prediction slider until it matches your probability and click
          &quot;Predict&quot;. You can also use the arrows to refine your
          probability.
        </p>

        <div className="mb-8">
          <Image
            src="https://cdn.metaculus.com/binary_zEP7bCz.gif"
            alt="Binary prediction interface demonstration"
            width={800}
            height={400}
            className="w-full rounded-lg"
          />
        </div>

        <div className="mb-8 rounded-md bg-green-100 px-4 pb-4 pt-2 dark:bg-green-900">
          <h4 className="font-normal text-gray-800 dark:text-white">
            <b>New this year:</b> Metaculus has launched a prediction expiration
            feature to help you keep your predictions fresh. Make sure you set
            your prediction expiration as desired. You&apos;ll receive an email
            when a prediction is about to expire. You can also change your
            expiration default in your settings. Expired predictions are scored
            only for the time period they were active.
          </h4>
        </div>

        <p className="mb-6">
          <b>Multiple choice</b> questions ask about more than two (Yes/No)
          possibilities. Predicting works the same, except your predictions
          should sum to 100%. After inputting probabilities, select auto-sum to
          guarantee they do.
        </p>

        <div className="mb-8">
          <Image
            src="https://cdn.metaculus.com/multiple-choice_J1uNZk9.gif"
            alt="Multiple choice prediction interface demonstration"
            width={800}
            height={400}
            className="w-full rounded-lg"
          />
        </div>

        <p className="mb-8">
          The higher the probability you place on the correct outcome, the
          better (higher) your score will be. Give the correct outcome a low
          probability and you&apos;ll receive a bad (negative) score. Under
          Metaculus scoring, you&apos;ll always get the best score by predicting
          what you think the actual probability is, rather than trying to
          &quot;game&quot; the scoring.
        </p>
        <hr className="my-8 border-t-2 border-gray-300 dark:border-gray-700" />

        <h2 className="mb-4 text-2xl font-bold text-gray-700 dark:text-gray-200">
          Numerical and Date Questions
        </h2>

        <p className="mb-4">
          <b>Examples:</b> <i>&quot;When will humans land on Mars?&quot;</i>,{" "}
          <i>&quot;What will Germany&apos;s GDP growth be in 2025?&quot;</i>, …
        </p>

        <p className="mb-6">
          To predict, provide a distribution, representing how likely you think
          each outcome in a range is. On the question page, drag the slider to
          change the shape of your bell curve, and focus your prediction on
          values you think are likely.
        </p>

        <div className="mb-8">
          <Image
            src="https://cdn.metaculus.com/numerical.gif"
            alt="Numerical prediction interface demonstration"
            width={800}
            height={400}
            className="w-full rounded-lg"
          />
        </div>

        <p className="mb-6">
          If you want to distribute your prediction in more than one section of
          the range, you can add independent bell curves to build your
          distribution and assign a weight to each of them.
        </p>

        <div className="mb-8">
          <Image
            src="https://cdn.metaculus.com/numerical2.gif"
            alt="Multiple distribution prediction interface demonstration"
            width={800}
            height={400}
            className="w-full rounded-lg"
          />
        </div>

        <p className="mb-8">
          The higher your distribution is on the value that ultimately occurs,
          the better your score. The lower your distribution on the actual
          value, the worse your score. To get the best score, make your
          distribution reflect how likely you think each possible value actually
          is.
        </p>

        {/* Weighting */}

        <h2 className="mb-4 text-2xl font-bold text-gray-700 dark:text-gray-200">
          A Note On Weighting
        </h2>

        <p className="mb-4">
          This year the tournament will use question weighting for question
          groups. We’re using weighting to reduce the effect of correlation on
          scores and leaderboard placement. There is likely to be correlation in
          some sets of similar questions, resulting in scores on those questions
          containing less signal than if the questions were uncorrelated. We
          want to assess forecasting skill, including on some sets of correlated
          questions, and weighting allows us to do that while reducing the
          impact of correlation on tournament placement.
        </p>

        <p className="mb-4">
          Question groups are questions that have multiple questions within
          them. They’re different from multiple choice questions because the
          subquestions aren’t mutually exclusive. For this tournament, when we
          use a question group we’re going to weight each subquestion within it
          so that the total weight of the question group sums to 1.0.
        </p>
        <p className="mb-4">
          For example, if we’re asking what the USD exchange rate will be for a
          number of currencies on a certain date, you’ll provide forecasts for
          each listed option. If there are three options, we’ll set the weight
          for each of them to 33%, so that the total weight sums to ~100%. That
          means the entire group will be weighted equivalently to one
          forecasting question. Above we’ve referred to there being 50 questions
          in the tournament, and we’re using that as shorthand to mean a total
          weight of 50. Some of those 50 will be question groups, where the
          group will be worth one question but be broken up into lower-weighted
          subquestions. You can see the question weight used for each
          subquestion under the three-dot menu by each subquestion, as shown in
          the image below.
        </p>

        <Image
          src="https://cdn.metaculus.com/weight.jpg"
          alt="Question Weighting Image"
          width={765}
          height={263}
          className="w-full rounded-lg"
        />
      </PageWrapper>
    </>
  );
}
