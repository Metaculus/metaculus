import Image from "next/image";
import Link from "next/link";
import { getLocale } from "next-intl/server";

import KatexRenderer from "@/components/katex_renderer";

import content_es from "./page_es";
import content_pt from "./page_pt";
import PageWrapper from "../components/pagewrapper";

export const metadata = {
  title: "Metaculus FAQ",
  description:
    "Frequently asked questions about Metaculus, including basics, question types, resolution processes, predictions, scoring, and more.",
};

export default async function FAQ() {
  const locale = await getLocale();
  if (locale === "pt") {
    return content_pt();
  }
  if (locale === "es") {
    return content_es();
  }

  return (
    <PageWrapper>
      <h1 className="text-3xl font-bold">Metaculus FAQ</h1>
      <hr />
      <div className="flex flex-col">
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">Basics</h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatismetaculus">What is Metaculus?</a>
            </li>
            <li>
              <a href="#whatisforecasting">What is forecasting?</a>
            </li>
            <li>
              <a href="#whenforecastingvaluable">
                When is forecasting valuable?
              </a>
            </li>
            <li>
              <a href="#aim">Why should I be a forecaster?</a>
            </li>
            <li>
              <a href="#whocreated">Who created Metaculus?</a>
            </li>
            <li>
              <a href="#whattournaments">
                What are Metaculus Tournaments and Question Series?
              </a>
            </li>
            <li>
              <a href="#predmarket">Is Metaculus a prediction market?</a>
            </li>
            <li>
              <a href="#justpolling">Are Metaculus questions Polls?</a>
            </li>
          </ul>
        </div>
        <hr />
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            Metaculus Questions
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatsort">
                What sorts of questions are allowed, and what makes a good
                question?
              </a>
            </li>
            <li>
              <a href="#whocreates">
                Who creates the questions, and who decides which get posted?
              </a>
            </li>
            <li>
              <a href="#whoedits">Who can edit questions?</a>
            </li>
            <li>
              <a href="#question-submission">
                How can I get my own question posted?
              </a>
            </li>
            <li>
              <a href="#pending-question">
                What can I do if a question I submitted has been pending for a
                long time?
              </a>
            </li>
            <li>
              <a href="#admins-resolution">
                What can I do if a question should be resolved but isn&apos;t?
              </a>
            </li>
            <li>
              <a href="#question-private">Where are my private questions?</a>
            </li>
            <li>
              <a href="#comments">
                What are the rules and guidelines for comments and discussions?
              </a>
            </li>
            <li>
              <a href="#definitions">
                What do &quot;credible source&quot; and &quot;before [date
                X]&quot; and such phrases mean exactly?
              </a>
            </li>
            <li>
              <a href="#question-types">What types of questions are there?</a>
            </li>
            <li>
              <a href="#question-groups">What are question groups?</a>
            </li>
            <li>
              <a href="#conditionals">What are Conditional Pairs?</a>
            </li>
            <li>
              <a href="#navigation-and-filtering">
                How do I find certain questions on Metaculus?
              </a>
            </li>
          </ul>
        </div>

        <hr />
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            Question Resolution
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#closers">
                What are the &quot;open date&quot;, &quot;close date&quot; and
                &quot;resolve date?&quot;
              </a>
            </li>
            <li>
              <a href="#timezone">What timezone is used for questions?</a>
            </li>
            <li>
              <a href="#who-resolves">
                Who decides the resolution to a question?
              </a>
            </li>
            <li>
              <a href="#ambiguous-annulled">
                What are &quot;Ambiguous&quot; and &quot;Annulled&quot;
                resolutions?
              </a>
            </li>
            <li>
              <a href="#allres">Do all questions get resolved?</a>
            </li>
            <li>
              <a href="#whenresolve">When will a question be resolved?</a>
            </li>
            <li>
              <a href="#resolvebackground">
                Is the background material used for question resolution?
              </a>
            </li>
            <li>
              <a href="#unclearresolve">
                What happens if the resolution criteria of a question is unclear
                or suboptimal?
              </a>
            </li>
            <li>
              <a href="#reresolve">Can questions be re-resolved?</a>
            </li>
            <li>
              <a href="#whatifres">
                What happens if a question gets resolved in the real world prior
                to the close time?
              </a>
            </li>
            <li>
              <a href="#retroactive-closure">
                When should a question specify retroactive closure?
              </a>
            </li>
            <li>
              <a href="#whatifres2">
                What happens if a question&apos;s resolution criteria turn out
                to have been fulfilled prior to the opening time?
              </a>
            </li>
            <li>
              <a href="#ressrc">
                What happens if a resolution source is in error or no longer
                available?
              </a>
            </li>
            <li>
              <a href="#resmethod">
                What happens if a resolution source changes methodology?
              </a>
            </li>
            <li>
              <a href="#rescouncil">What are Resolution Councils?</a>
            </li>
          </ul>
        </div>
        <hr />
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">Predictions</h2>
          <ul className="space-y-1">
            <li>
              <a href="#tutorial">Is there a tutorial or walkthrough?</a>
            </li>
            <li>
              <a href="#howpredict">
                How do I make a prediction? Can I change it later?
              </a>
            </li>
            <li>
              <a href="#reaffirming">
                What is &quot;Reaffirming&quot; a prediction?
              </a>
            </li>
            <li>
              <a href="#howwithdraw">How can I withdraw my prediction?</a>
            </li>
            <li>
              <a href="#auto-withdrawal">What is prediction auto-withdrawal?</a>
            </li>
            <li>
              <a href="#range-interface">How do I use the range interface?</a>
            </li>
            <li>
              <a href="#community-prediction">
                How is the Community Prediction calculated?
              </a>
            </li>
            <li>
              <a href="#metaculus-prediction">
                What is the Metaculus Prediction?
              </a>
            </li>
          </ul>
        </div>
        <hr />
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            Scores and Medals
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatscores">What are scores?</a>
            </li>
            <li>
              <a href="#whatmedals">What are medals?</a>
            </li>
            <li>
              <a href="#whatmedalranks">What are medal ranks?</a>
            </li>
          </ul>
        </div>
        <hr />
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            Metaculus Journal
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatisjournal">What is the metaculus Journal?</a>
            </li>
            <li>
              <a href="#fortifiedessay">What is a fortified essay?</a>
            </li>
          </ul>
        </div>
        <hr />
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">Miscellany</h2>
          <ul className="space-y-1">
            <li>
              <a href="#what-are-pros">What are Metaculus Pro Forecasters?</a>
            </li>
            <li>
              <a href="#api">Does Metaculus have an API?</a>
            </li>
            <li>
              <a href="#change-name">How do I change my username?</a>
            </li>
            <li>
              <a href="#cant-comment">
                I&apos;ve registered an account. Why can&apos;t I comment on a
                question?
              </a>
            </li>
            <li>
              <a href="#suspensions">Understanding account suspensions</a>
            </li>
            <li>
              <a href="#cant-see">
                Why can I see the Community Prediction on some questions, the
                Metaculus Prediction on others, and no prediction on some
                others?
              </a>
            </li>
            <li>
              <a href="#related-news">What is NewsMatch?</a>
            </li>
            <li>
              <a href="#community-insights">What are Community Insights?</a>
            </li>
            <li>
              <a href="#domains">Can I get my own Metaculus?</a>
            </li>
            <li>
              <a href="#spreadword">
                How can I help spread the word about Metaculus?
              </a>
            </li>
            <li>
              <a href="#closeaccount">
                How can I close my account and delete my personal information on
                Metaculus?
              </a>
            </li>
          </ul>
        </div>
        <hr />
        <h2 className="scroll-mt-nav text-2xl font-bold" id="basics">
          Basics
        </h2>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whatismetaculus"
        >
          What is Metaculus?
        </h3>
        <p>
          Metaculus is an online forecasting platform and aggregation engine
          that brings together a global reasoning community and keeps score for
          thousands of forecasters, delivering machine learning-optimized
          aggregate forecasts on topics of global importance. The Metaculus
          forecasting community is often inspired by altruistic causes, and
          Metaculus has a long history of partnering with nonprofit
          organizations, university researchers and companies to increase the
          positive impact of its forecasts.
        </p>
        <p>
          Metaculus therefore poses questions about the occurrence of a variety
          of future events, on many timescales, to a community of participating
          forecasters — you!
        </p>
        <p>
          The name &quot;Metaculus&quot; is inspired by the Mentaculus, a
          fictional probability map of the universe, from the Coen
          brothers&apos;{" "}
          <a href="https://en.wikipedia.org/wiki/A_Serious_Man">
            A Serious Man
          </a>
          .
        </p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whatisforecasting"
        >
          What is forecasting?
        </h3>
        <p>
          Forecasting is a systematic practice of attempting to answer questions
          about future events. On Metaculus, we follow a few principles to
          elevate forecasting above simple guesswork:
        </p>

        <p>
          First, questions are carefully specified so that everyone understands
          beforehand and afterward which kinds of outcomes are included in the
          resolution, and which are not. Forecasters then give precise
          probabilities that measure their uncertainty about the outcome.
        </p>

        <p>
          Second, Metaculus aggregates the forecasts into a community prediction
          based on the <a href="https://en.wikipedia.org/wiki/Median">median</a>{" "}
          of user forecasts weighted by recency. Surprisingly, the Community
          Prediction is often
          <Link href="/questions/track-record/">
            better than any individual predictor
          </Link>
          ! This principle is known as{" "}
          <a href="https://en.wikipedia.org/wiki/Wisdom_of_the_crowd">
            the wisdom of the crowd,
          </a>{" "}
          and has been demonstrated on Metaculus and by other researchers.
          Intuitively it makes sense, as each individual has separate
          information and biases which in general balance each other out
          (provided the whole group is not biased in the same way).
        </p>

        <p>
          Third, we measure the relative skill of each forecaster, using their
          quantified forecasts. When we know the outcome of the question, the
          question is &quot;resolved&quot;, and forecasters receive their
          scores. By tracking these scores from many forecasts on different
          topics over a long period of time, they become an increasingly better
          metric of how good a given forecaster is. These scores provide
          aspiring forecasters with important feedback on how they did and where
          they can improve.
        </p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whenforecastingvaluable"
        >
          When is forecasting valuable?
        </h3>
        <p>
          Forecasting is uniquely valuable primarily in complex, multi-variable
          problems or in situations where a lack of data makes it difficult to
          predict using explicit or exact models.
        </p>
        <p>
          In these and other scenarios, aggregated predictions of strong
          forecasters offer one of the best ways of predicting future events. In
          fact, work by the political scientist Philip Tetlock demonstrated that
          aggregated predictions were able to outperform professional
          intelligence analysts with access to classified information when
          forecasting various geopolitical outcomes.
        </p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="aim">
          Why should I be a forecaster?
        </h3>
        <p>
          Research has shown that great forecasters come from various
          backgrounds—and oftentimes from fields that have nothing to do with
          predicting the future. Like many mental capabilities, prediction is a
          talent that persists over time and is a skill that can be developed.
          Steady quantitative feedback and regular practice can greatly improve
          a forecaster&apos;s accuracy.
        </p>
        <p>
          Some events — such as eclipse timing and well-polled elections, can
          often be predicted with high resolution, e.g. 99.9% likely or 3%
          likely. Others — such as the flip of a coin or a close horse-race —
          cannot be accurately predicted; but their odds still can be. Metaculus
          aims at both: to provide a central generation and aggregation point
          for predictions. With these in hand, we believe that individuals,
          groups, corporations, governments, and humanity as a whole will make
          better decisions.
        </p>
        <p>
          As well as being worthwhile, Metaculus aims to be interesting and fun,
          while allowing participants to hone their prediction prowess and amass
          a track-record to prove it.
        </p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="whocreated">
          Who created Metaculus?
        </h3>
        <p>
          {" "}
          Metaculus originated with two researcher scientists, Anthony Aguirre
          and Greg Laughlin. Aguirre, a physicist, is a co-founder of{" "}
          <a href="https://fqxi.org/">The Foundational Questions Institute</a>,
          which catalyzes breakthrough research in fundamental physics, and of{" "}
          <a href="https://futureoflife.org/">The Future of Life Institute</a>,
          which aims to increase the benefit and safety of disruptive
          technologies like AI. Laughlin, an astrophysicist, is an expert at
          predictions from the millisecond predictions relevant to
          high-frequency trading to the ultra-long-term stability of the solar
          system.
        </p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whattournaments"
        >
          What Are Metaculus Tournaments and Question Series?
        </h3>

        <h4 className="text-lg font-semibold">Tournaments</h4>
        <p>
          Metaculus tournaments are organized around a central topic or theme.
          Tournaments are often collaborations between Metaculus and a
          nonprofit, government agency, or other organization seeking to use
          forecasting to support effective decision making. You can find current
          and archived tournaments in our{" "}
          <Link href="/tournaments/">Tournaments page</Link>.
        </p>
        <p>
          Tournaments are the perfect place to prove your forecasting skills,
          while helping to improve our collective decision making ability. Cash
          prizes and <Link href="/help/medals-faq/">Medals</Link>are awarded to
          the most accurate forecasters, and sometimes for other valuable
          contributions (like comments). Follow a Tournament (with the Follow
          button) to never miss new questions.
        </p>
        <p>
          After at least one question has resolved, a Leaderboard will appear on
          the tournament page displaying current scores and rankings. A personal
          score board (&quot;My Score&quot;) will also appear, detailing your
          performance for each question (see{" "}
          <Link href="/help/scores-faq/#tournament-scores">
            How are Tournaments Scored?
          </Link>
          ).
        </p>
        <p>
          At the end of a tournament, the prize pool is divided among
          forecasters according to their forecasting performance. The more you
          forecasted and the more accurate your forecasts were, the greater
          proportion of the prize pool you receive.
        </p>

        <p>
          For more information about how scores are calculated and prizes are
          awarded, see the tournament scores section of our{" "}
          <Link href="/help/scores-faq/#tournament-scores">scores FAQ</Link>.
        </p>

        <h4 className="text-lg font-semibold">
          Can I donate my tournament winnings?
        </h4>
        <p>
          If you have outstanding tournament winnings, Metaculus is happy to
          facilitate donations to various non-profits, regranting organizations,
          and funds. You can find the list of organizations we facilitate
          payments to{" "}
          <Link href="/questions/11556/donating-tournament-prizes/">here</Link>.
        </p>

        <h4 className="text-lg font-semibold">Question Series</h4>
        <p>
          Like Tournaments, Question Series are organized around a central topic
          or theme. Unlike tournaments, they do not have a prize pool.
        </p>
        <p>
          Question Series still show leaderboards, for interest and fun. However
          they do <b>not</b> award medals.
        </p>
        <p>
          You can find all Question Series in a special section of the{" "}
          <Link href="/tournaments/">Tournaments page</Link>.
        </p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="predmarket">
          Is Metaculus a prediction market?
        </h3>
        <p>
          Metaculus has some similarities to a prediction market, but ultimately
          is not one. Metaculus aims to aggregate many people&apos;s
          information, expertise, and predictive power into high-quality
          forecasts. However, prediction markets generally operate using real or
          virtual currency, where participants buy (or sell) shares if they
          think that the standing prices reflect too low (or high) a probability
          of an event occurring. Metaculus, in contrast, directly solicits
          predicted probabilities from its users, then aggregates those
          probabilities. We believe that this sort of &quot;prediction
          aggregator&quot; has both advantages and disadvantages relative to a
          prediction market, and we go into detail about these in our blog post{" "}
          <i>
            <a
              href="https://www.metaculus.com/notebooks/38198/metaculus-and-markets-whats-the-difference/"
              target="_blank"
            >
              Metaculus and Markets: What&#39;s the Difference?
            </a>
          </i>
          . Here&#39;s a graphic from that post with a quick overview:
        </p>

        <Image
          src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/metac-vs-markets_D2ekmH1.jpg"
          alt="Metaculus and Markets Comparison"
          className="my-4"
          width={700}
          height={207}
        />

        <h3 className="scroll-mt-nav text-xl font-semibold" id="justpolling">
          Are Metaculus Questions Polls?
        </h3>
        <p>
          No. Opinion polling can be a useful way to gauge the sentiment and
          changes in a group or culture, but there is often no single
          &quot;right answer&quot;, as in a{" "}
          <a href="https://news.gallup.com/poll/391547/seven-year-stretch-elevated-environmental-concern.aspx">
            Gallup poll
          </a>{" "}
          &quot;How worried are you about the environment?&quot;
        </p>

        <p>
          In contrast, Metaculus questions are designed to be objectively
          resolvable (like in{" "}
          <Link href="/questions/9942/brent-oil-to-breach-140-before-may">
            Will Brent Crude Oil top $140/barrel before May 2022?
          </Link>
          ), and forecasters are not asked for their preferences, but for their
          predictions. Unlike in a poll, over many predictions, participants
          accrue a track record indicating their forecasting accuracy. These
          track records are incorporated into the{" "}
          <Link href="/faq/#metaculus-prediction">Metaculus Prediction</Link>.
          The accuracy of the Metaculus track record itself is tracked{" "}
          <Link href="/questions/track-record/">here</Link>.
        </p>

        <h2
          className="scroll-mt-nav text-2xl font-bold"
          id="metaculus-questions"
        >
          Metaculus Questions
        </h2>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="whatsort">
          What sorts of questions are allowed, and what makes a good question?
        </h3>
        <p>
          Questions should focus on tangible, objective facts about the world
          which are well-defined and not a matter of opinion. &quot;When will
          the United States collapse?&quot; is a poor, ambiguous question;{" "}
          <q>
            <Link href="/questions/8579/us-freedom-in-the-world-score-in-2050/">
              What will be the US&apos; score in the Freedom in the World Report
              for 2050?
            </Link>
          </q>{" "}
          is more clear and definite. They generally take the form{" "}
          <q>Will (event) X happen by (date) Y?</q> or{" "}
          <q>When will (event) X occur?</q> or{" "}
          <q>What will the value or quantity of X be by (date) Y?</q>
        </p>
        <p>
          A good question will be unambiguously resolvable. A community reading
          the question terms should be able to agree, before and after the event
          has occurred, whether the outcome satisfies the question&apos;s terms.
        </p>
        <p>Questions should also follow some obvious rules:</p>

        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>
            Questions should respect privacy and not address the personal lives
            of non-public figures.
          </li>
          <li>
            Questions should not be directly potentially defamatory or generally
            in bad taste.
          </li>
          <li>
            Questions should never aim to predict mortality of individual people
            or even small groups. In cases of public interest (such as court
            appointees and political figures), the question should be phrased in
            other more directly relevant terms such as &quot;when will X no
            longer serve on the court&quot; or &quot;will Y be unable to run for
            office on date X&quot;. When the topic is death (or longevity)
            itself questions should treat people in aggregate or hypothetically.
          </li>
          <li>
            More generally, questions should avoid being written in a way that
            incentivizes illegal or harmful acts — that is, hypothetically, if
            someone were motivated enough by a Metaculus Question to influence
            the real world and change the outcome of a question&apos;s
            resolution, those actions should not be inherently illegal or
            harmful.
          </li>
        </ol>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="whocreates">
          Who creates the questions, and who decides which get posted?
        </h3>
        <p>
          Many questions are launched by Metaculus staff, but any logged-in user
          can propose a question. Proposed questions will be reviewed by a group
          of moderators appointed by Metaculus. Moderators will select the best
          questions submitted, and help to edit the question to be clear,
          well-sourced, and{" "}
          <Link href="/question-writing/">aligned with our writing style</Link>.
        </p>

        <p>
          Metaculus hosts questions on{" "}
          <Link href="/questions/categories/">many topics</Link>, but our
          primary focus areas are Science,{" "}
          <Link href="/questions/?categories=technology">Technology</Link>,{" "}
          <Link href="/questions/?tags=effective-altruism">
            Effective Altruism
          </Link>
          , <Link href="/questions/?topic=ai">Artificial Intelligence</Link>,{" "}
          <Link href="/questions/?topic=biosecurity">Health</Link>, and{" "}
          <Link href="/questions/?categories=geopolitics">Geopolitics</Link>.
        </p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="whoedits">
          Who can edit questions?
        </h3>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            Admins can edit all questions at any time (however, once predictions
            have begun, great care is taken not to change a question&apos;s
            resolution terms unless necessary).
          </li>
          <li>
            Moderators can edit questions when they are Pending and Upcoming
            (before predictions have begun).
          </li>
          <li>
            Authors can edit their questions when they are Drafts and Pending.
          </li>
          <li>
            Authors can invite other users to edit questions that are in Draft
            or Pending.
          </li>
        </ul>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="question-submission"
        >
          How can I get my own question posted?
        </h3>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>
            If you have a basic idea for a question but don&apos;t have
            time/energy to work out the details, you&apos;re welcome to submit
            it, discuss it in our{" "}
            <Link href="/questions/956/discussion-topic-what-are-some-suggestions-for-questions-to-launch/">
              question idea thread
            </Link>
            , or on our{" "}
            <a href="https://discord.gg/v2Bf5tppeT">Discord channel</a>.
          </li>
          <li>
            If you have a pretty fully-formed question, with at least a couple
            of linked references and fairly careful unambiguous resolution
            criteria, it&apos;s likely that your question will be reviewed and
            launched quickly.
          </li>
          <li>
            Metaculus hosts questions on{" "}
            <Link href="/questions/categories/">many topics</Link>, but our
            primary focus areas are Science,{" "}
            <Link href="/questions/?categories=technology">Technology</Link>,{" "}
            <Link href="/questions/?tags=effective-altruism">
              Effective Altruism
            </Link>
            , <Link href="/questions/?topic=ai">Artificial Intelligence</Link>,{" "}
            <Link href="/questions/?topic=biosecurity">Health</Link>, and{" "}
            <Link href="/questions/?categories=geopolitics">Geopolitics</Link>.
            Questions on other topics, especially that require a lot of
            moderator effort to get launched, will be given lower priority and
            may be deferred until a later time.
          </li>
          <li>
            We regard submitted questions as suggestions and take a free hand in
            editing them. If you&apos;re worried about having your name on a
            question that is altered from what you submit, or would like to see
            the question before it&apos;s launched, please note this in the
            question itself; questions are hidden from public view until they
            are given &quot;upcoming&quot; status, and can be posted anonymously
            upon request.
          </li>
        </ol>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="pending-question"
        >
          What can I do if a question I submitted has been pending for a long
          time?
        </h3>
        <p>
          We currently receive a large volume of question submissions, many of
          which are interesting and well-written. That said, we try to approve
          just enough questions that they each can get the attention they
          deserve from our forecasters. Metaculus prioritizes questions on
          Science,{" "}
          <Link href="/questions/?categories=technology">Technology</Link>,{" "}
          <Link href="/questions/?tags=effective-altruism">
            Effective Altruism
          </Link>
          , <Link href="/questions/?topic=ai">Artificial Intelligence</Link>,{" "}
          <Link href="/questions/?topic=biosecurity">Health</Link>, and{" "}
          <Link href="/questions/?categories=geopolitics">Geopolitics</Link>. If
          your question falls into one of these categories, or is otherwise very
          urgent or important, you can tag us with @moderators to get our
          attention.
        </p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="admins-resolution"
        >
          What can I do if a question should be resolved but isn&apos;t?
        </h3>
        <p>
          If a question is still waiting for resolution, check to make sure
          there hasn&apos;t been a comment from staff explaining the reason for
          the delay. If there hasn&apos;t, you can tag @admins to alert the
          Metaculus team. Please do not use the @admins tag more than once per
          week regarding a single question or resolution.
        </p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="question-private"
        >
          Where are my private questions?
        </h3>
        <p>
          Private questions are deprecated, it is no longer possible to create
          new ones. If you had private questions, you can still find them by
          going to the <Link href="/questions/">Feed Home</Link>, selecting
          &quot;My questions and posts&quot; in the sidebar, and using the
          &quot;Personal&quot; special filter.
        </p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="comments">
          What are the rules and guidelines for comments and discussions?
        </h3>
        <p>
          We have a full set of{" "}
          <Link href="/help/guidelines/">community etiquette guidelines</Link>
          but in summary:
        </p>

        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>Users are welcome comment on any question.</li>
          <li>
            Comments and questions can use{" "}
            <Link href="/help/markdown/">markdown formatting</Link>.
          </li>
          <li>
            Metaculus aims at a high level of discourse. Comments should be on
            topic, relevant and interesting. Comments should not only state the
            author&apos;s opinion (with the exception of quantified
            predictions). Comments which are spammy, aggressive, profane,
            offensive, derogatory, or harassing are not tolerated, as well as
            those that are explicitly commercial advertising or those that are
            in some way unlawful. See the Metaculus{" "}
            <Link href="/terms-of-use/">terms of use</Link> for more.
          </li>
          <li>
            You can ping other users using &quot;@username&quot;, which will
            send that user a notification (if they set that option in their
            notification settings).
          </li>
          <li>
            You are invited to upvote comments which contain relevant
            information to the question, and you can report comments that fail
            to uphold our{" "}
            <Link href="/help/guidelines/">etiquette guidelines</Link>.
          </li>
          <li>
            If a comment is spam, inappropriate/offensive, or flagrantly breaks
            our rules, please send us a report (under the &quot;...&quot;menu).
          </li>
        </ul>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="definitions">
          What do &quot;credible source&quot; and &quot;before [date X]&quot;
          and such phrases mean exactly?
        </h3>
        <p>
          To reduce ambiguity in an efficient way, here are some definitions
          that can be used in questions, with a meaning set by this FAQ:
        </p>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>
            A &quot;credible source&quot; will be taken to be an online or print
            published article from a journalistic or academic source,
            information publicly posted by an authoritative source with specific
            knowledge or responsibility for the subject matter, or in general
            information from a source where the preponderance of evidence
            suggests that the information is correct—provided in all cases that
            there is no significant controversy surrounding its correctness.
            Credible sources will generally not include unsourced information
            found in blogs, social media postings, or websites of individuals.
          </li>
          <li>
            The phrase &quot;Before [date X] will be taken to mean prior to the
            first moment at which [date X] would apply, in UTC. For example,
            &quot;Before 2010&quot; will be taken to mean prior to midnight
            January 1, 2010; &quot;Before June 30&quot; would mean prior to
            midnight (00:00:00) UTC June 30.
            <ul className="ml-4 mt-2 list-inside list-disc space-y-2">
              <li>
                <strong>Note:</strong> Previously this section used &quot;by
                [date x]&quot; instead of &quot;before [date x]&quot;, however
                &quot;before&quot; is much clearer and should always be used
                instead of &quot;by&quot;, where feasible.
              </li>
            </ul>
          </li>
        </ol>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="question-types">
          What types of questions are there?
        </h3>
        <h4 className="text-lg font-semibold">Binary Questions</h4>
        <p>
          Binary questions can resolve as either <strong>Yes</strong> or{" "}
          <strong>No</strong> (unless the resolution criteria were
          underspecified or otherwise circumvented, in which case they can
          resolve as <strong>Ambiguous</strong>). Binary questions are
          appropriate when an event can either occur or not occur. For example,
          the question &quot;
          <Link href="/questions/6296/us-unemployment-above-5-through-nov-2021/">
            Will the US unemployment rate stay above 5% through November 2021?
          </Link>
          &quot; resolved as <strong>No</strong> because the unemployment rate
          dropped below 5% before the specified time.
        </p>

        <h4 className="text-lg font-semibold">Range Questions</h4>
        <p>
          Range questions resolve to a certain value, and forecasters can
          specify a probability distribution to estimate the likelihood of each
          value occurring. Range questions can have open or closed bounds. If
          the bounds are closed, probability can only be assigned to values that
          fall within the bounds. If one or more of the bounds are open,
          forecasters may assign probability outside the boundary, and the
          question may resolve as outside the boundary.{" "}
          <a href="#out-of-bounds-resolution">See here</a>for more details about
          boundaries on range questions.
        </p>
        <p>
          The range interface allows you to input multiple probability
          distributions with different weights.{" "}
          <a href="#range-interface">See here</a>for more details on using the
          interface.
        </p>
        <p>
          There are two types of range questions, numeric range questions and
          date range questions.
        </p>

        <h5 className="text-lg font-semibold">Numeric Range</h5>
        <p>
          Numeric range questions can resolve as a numeric value. For example,
          the question &quot;
          <Link href="/questions/7346/initial-jobless-claims-july-2021/">
            What will be the 4-week average of initial jobless claims (in
            thousands) filed in July 2021?
          </Link>
          &quot; resolved as <strong>395</strong>, because the underlying source
          reported 395 thousand initial jobless claims for July 2021.
        </p>
        <p>
          Questions can also resolve outside the numeric range. For example, the
          question &quot;
          <Link href="/questions/6645/highest-us-core-cpi-growth-in-2021/">
            What will the highest level of annualised core US CPI growth be, in
            2021, according to U.S. Bureau of Labor Statistics data?
          </Link>
          &quot; resolved as <strong>&gt; 6.5</strong> because the underlying
          source reported more than 6.5% annualized core CPI growth in the US,
          and 6.5 was the upper bound.
        </p>

        <h5 className="text-lg font-semibold">Discrete Range</h5>
        {/* TODO: put a real Discrete question example after one exists */}
        <p>
          Discrete range questions resolve to a specific value (usually a whole
          number). For example, the question &quot;How many days will it rain in
          New York City in the month of June?&quot; could resolve to 10 or 11,
          but not 10.5.
        </p>
        <p>
          Same as numeric range questions, discrete questions can sometimes
          resolve to a value outside of the given range. For example, the
          question &quot;What will be the rate of inflation in the United States
          next year to the nearest tenth of a percent?&quot; that has a discrete
          range of 0% to 10% could resolve to 10.5% even if it is unlikely.
        </p>

        <h5 className="text-lg font-semibold">Date Range</h5>
        <p>
          Date range questions can resolve as a certain date. For example, the
          question &quot;
          <Link href="/questions/8723/date-of-next-who-pheic-declaration/">
            When will the next Public Health Emergency of International Concern
            be declared by the WHO?
          </Link>
          &quot; resolved as <strong>July 23, 2022</strong>, because a Public
          Health Emergency of International Concern was declared on that date.
        </p>
        <p>
          Questions can also resolve outside the date range. For example, the
          question &quot;
          <Link href="/questions/6947/first-super-heavy-flight/">
            When will a SpaceX Super Heavy Booster fly?
          </Link>
          &quot; resolved as <strong>&gt; March 29, 2022</strong> because a
          SpaceX Super Heavy booster was not launched before March 29, 2022,
          which was the upper bound.
        </p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="question-groups"
        >
          What are question groups?
        </h3>
        <p>
          Question groups are sets of closely related questions or question
          outcomes all collected on a single page. Forecasters can predict
          quickly and efficiently on these interconnected outcomes, confident
          that they are keeping all of their predictions internally consistent.
        </p>

        <h4 className="text-lg font-semibold">
          How do question groups facilitate more efficient, more accurate
          forecasting?
        </h4>
        <p>
          With question groups, it&apos;s easy to forecast progressively wider
          distributions the further into the future you predict to reflect
          increasing uncertainty. A question group collecting multiple binary
          questions on a limited set of outcomes or on mutually exclusive
          outcomes makes it easier to see which forecasts are in tension with
          each other.
        </p>

        <h4 className="text-lg font-semibold">
          What happens to the existing question pages when they are combined in
          a question group?
        </h4>
        <p>
          When regular forecast questions are converted into
          &quot;subquestions&quot; of a question group, the original pages are
          replaced by a single question group page. Comments that previously
          lived on the individual question pages are moved to the comment
          section of the newly created group page with a note indicating the
          move.
        </p>

        <h4 className="text-lg font-semibold">
          Do I need to forecast on every outcome / subquestion of a question
          group?
        </h4>
        <p>
          No. Question groups comprise multiple <i>independent</i> subquestions.
          For that reason, there is no requirement that you forecast on every
          outcome within a group.
        </p>

        <h4 className="text-lg font-semibold">
          How are question groups scored?
        </h4>
        <p>
          Each outcome or subquestion is scored in the same manner as a normal
          independent question.
        </p>

        <h4 className="text-lg font-semibold">
          Why don&apos;t question group outcome probabilities sum to 100%?
        </h4>
        <p>
          Even if there can only be one outcome for a particular question group,
          the Community Prediction functions as it would for normal independent
          questions. The Community Prediction will still display a median or a
          weighted aggregate of the forecasts on each subquestion, respectively.
          These medians and weighted aggregates are not constrained to sum to
          100%
        </p>
        <p>
          Feedback for question groups can be provided on the{" "}
          <Link href="/questions/9861/2022-3-9-update-forecast-question-groups/">
            question group discussion post
          </Link>
          .
        </p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="conditionals">
          What are Conditional Pairs?
        </h3>
        <p>
          A Conditional Pair is a special type of{" "}
          <Link href="/faq/#question-groups">Question Group</Link>that elicits{" "}
          <a href="https://en.wikipedia.org/wiki/Conditional_probability">
            conditional probabilities
          </a>
          . Each Conditional Pair sits between a Parent Question and a Child
          Question. Both Parent and Child must be existing Metaculus{" "}
          <Link href="/faq/#question-types">Binary Questions</Link>.
        </p>

        <p>
          Conditional Pairs ask two Conditional Questions (or
          &quot;Conditionals&quot; for short), each corresponding to a possible
          outcome of the Parent:
        </p>

        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>If the Parent resolves Yes, how will the Child resolve?</li>
          <li>If the Parent resolves No, how will the Child resolve?</li>
        </ol>

        <p>
          The first Conditional assumes that &quot;The Parent resolves Yes&quot;
          (or &quot;if Yes&quot; for short). The second conditional does the
          same for No.
        </p>

        <p>
          Conditional probabilities are probabilities, so forecasting is very
          similar to Binary Questions. The main difference is that we present
          both conditionals next to each other for convenience:
        </p>

        <Image
          src="https://metaculus-public.s3.us-west-2.amazonaws.com/conditional_faq_2.jpg"
          alt="The two conditionals next to each other"
          width={730}
          height={75}
        />

        <p>
          Conditional questions are automatically resolved when their Parent and
          Child resolve:
        </p>

        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            When the Parent resolves Yes, the &quot;if No&quot; Conditional is{" "}
            <Link href="/faq/#ambiguous-annulled">Annulled</Link>. (And vice
            versa.)
          </li>
          <li>
            When the Child resolves, the Conditional that was not annulled
            resolves to the same value.
          </li>
        </ul>

        <p>Let&apos;s work through an example:</p>

        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>The Parent is &quot;Will it rain today?&quot;.</li>
          <li>The Child is &quot;Will it rain tomorrow?&quot;.</li>
        </ul>

        <p>So the two Conditionals in the Conditional Pair will be:</p>

        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>&quot;If it rains today, will it rain tomorrow?&quot;</li>
          <li>&quot;If it does not rain today, will it rain tomorrow?&quot;</li>
        </ol>

        <p>
          For simplicity, Metaculus presents conditional questions graphically.
          In the forecasting interface they are in a table:
        </p>

        <Image
          src="https://metaculus-public.s3.us-west-2.amazonaws.com/conditional_faq_3.jpg"
          alt="The Conditional Pair forecasting interface"
          width={754}
          height={253}
        />

        <p>
          And in the feeds, each possible outcome of the Parent is an arrow, and
          each conditional probability is a bar:
        </p>

        <Image
          src="https://metaculus-public.s3.us-west-2.amazonaws.com/conditional_faq_1.jpg"
          alt="The Conditional Pair feed tile"
          width={746}
          height={142}
        />

        <p>Back to the example:</p>

        <p>
          It rains today. The parent resolves Yes. This triggers the second
          conditional (&quot;if No&quot;) to be annulled. It is not scored.
        </p>

        <p>
          You wait a day. This time it doesn&apos;t rain. The Child resolves No.
          This triggers the remaining Conditional (&quot;if Yes&quot;) to
          resolve No. It is scored like a normal Binary Question.
        </p>

        <h4 className="text-lg font-semibold">
          How do I create conditional pairs?
        </h4>
        <p>
          You can create and submit conditional pairs like any other question
          type. On the &apos;
          <Link href="/questions/create/">Create a Question</Link>
          &apos; page, select Question Type &apos;conditional pair&apos; and
          select Parent and Child questions.
        </p>

        <p>
          Note: You can use question group subquestions as the Parent or Child
          by clicking the Parent or Child button and then either searching for
          the subquestion in the field or pasting the URL for the subquestion.
        </p>

        <p>
          To copy the URL for a subquestion, simply visit a question group page
          and click the &apos;...&apos; more options menu to reveal the Copy
          Link option.
        </p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="navigation-and-filtering"
        >
          How do I find certain questions on Metaculus?
        </h3>
        <p>
          Questions on Metaculus are sorted by activity by default. Newer
          questions, questions with new comments, recently upvoted questions,
          and questions with many new predictions will appear at the top of the{" "}
          <Link href="/questions/">Metaculus homepage</Link>. However, there are
          several additional ways to find questions of interest and customize
          the way you interact with Metaculus.
        </p>

        <h4 className="scroll-mt-nav text-lg font-semibold" id="search-bar">
          Search Bar
        </h4>
        <p>
          The search bar can be used to find questions using keywords and
          semantic matches. At this time it cannot search comments or users.
        </p>

        <h4 className="scroll-mt-nav text-lg font-semibold" id="filters">
          Filters
        </h4>
        <p>
          Questions can be sorted and filtered in a different manner from the
          default using the filters menu. Questions can be filtered by type,
          status and participation. Questions can also be ordered, for example
          by &quot;Newest&quot;. Note that the options available change when
          different filters are selected. For example, if you filter by
          &quot;Closed&quot; questions you will then be shown an option to order
          by &quot;Soonest Resolving&quot;.
        </p>

        <h2
          className="scroll-mt-nav text-2xl font-bold"
          id="question-resolution"
        >
          Question Resolution
        </h2>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="closers">
          What are the &quot;open date&quot;, &quot;close date&quot; and
          &quot;resolve date?&quot;
        </h3>
        <p>
          When submitting a question, you are asked to specify the closing date
          (when the question is no longer available for predicting) and
          resolution date (when the resolution is expected to occur). The date
          the question is set live for others to forecast on is known as the
          open date.
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            The <strong>open date</strong> is the date/time when the question is
            open for predictions. Prior to this time, if the question is active,
            it will have &quot;upcoming&quot; status, and is potentially subject
            to change based on feedback. After the open date, changing questions
            is highly discouraged (as it could change details which are relevant
            to forecasts that have already been submitted) and such changes are
            typically noted in the question body and in the comments on the
            question
          </li>
          <li>
            The <strong>close date</strong> is the date/time after which
            predictions can no longer be updated.
          </li>
          <li>
            The <strong>resolution date</strong> is the date when the event
            being predicted is expected to have definitively occurred (or not).
            This date lets Metaculus Admins know when the question might be
            ready for resolution. However, this is often just a guess, and is
            not binding in any way.
          </li>
        </ul>
        <p>
          In some cases, questions must resolve at the resolution date according
          to the best available information. In such cases, it becomes important
          to choose the resolution date carefully. Try to set resolution dates
          that make for interesting and insightful questions! The date or time
          period the question is asking about must always be explicitly
          mentioned in the text (for example, &quot;this question resolves as
          the value of X on January 1, 2040, according to source Y&quot; or
          &quot;this question resolves as <strong>Yes</strong> if X happens
          before January 1, 2040)&quot;.
        </p>
        <p>
          The close date <em>must</em> be at least one hour prior to the
          resolution date, but can be much earlier, depending upon the context.
          Here are some guidelines for specifying the close date:
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            If the outcome of the question will very likely or assuredly be
            determined at a fixed known time, then the closing time should be
            immediately before this time, and the resolution time just after
            that. (Example: a scheduled contest between competitors or the
            release of scheduled data)
          </li>
          <li>
            If the outcome of a question will be determined by some process that
            will occur at an unknown time, but the outcome is likely to be
            independent of this time, then it should be specified that the
            question{" "}
            <Link href="/faq/#retroactive-closure">retroactively closes</Link>
            some appropriate time before the process begins. (Example: success
            of a rocket launch occurring at an unknown time)
          </li>
          <li>
            If the outcome of a question depends on a discrete event that may or
            may not happen, the close time should be specified as shortly before
            the resolve time. The resolve time is chosen based on author
            discretion of the period of interest.
          </li>
        </ul>
        <p>
          <strong>Note:</strong> Previous guidance suggested that a question
          should close between 1/2 to 2/3 of the way between the open time and
          resolution time. This was necessary due to the scoring system at the
          time, but has been replaced by the above guidelines due to an{" "}
          <Link href="/questions/10801/discontinuing-the-final-forecast-bonus/">
            update to the scoring system
          </Link>
          .
        </p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="timezone">
          What timezone is used for questions?
        </h3>
        <p>
          For dates and times written in the question, such as &quot;will event
          X happen before January 1, 2030?&quot;, if the timezone is not
          specified{" "}
          <a href="https://en.wikipedia.org/wiki/Coordinated_Universal_Time">
            Coordinated Universal Time (UTC)
          </a>{" "}
          will be used. Question authors are free to specify a different
          timezone in the resolution criteria, and any timezone specified in the
          text will be used.
        </p>
        <p>
          For <Link href="/faq/#question-types">date range</Link>questions, the
          dates on the interface are in UTC. Typically the time of day makes
          little difference as one day is miniscule in comparison to the full
          range, but occasionally for shorter term questions the time of day
          might materially impact scores. If it is not clear what point in a
          specified period a date range question will be resolved as, it
          resolves as the{" "}
          <Link href="/faq/#whenresolve">midpoint of that period</Link>. For
          example, if a question says it will resolve as a certain day, but not
          what time of day, it will resolve as noon UTC on that day.
        </p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="who-resolves">
          Who decides the resolution to a question?
        </h3>
        <p>
          Only Metaculus Administrators can resolve questions. Binary questions
          can resolve <strong>Yes</strong>, <strong>No</strong>,{" "}
          <Link href="/faq/#ambiguous-annulled">Ambiguous, or Annulled</Link>.
          Range questions can resolve to a specific value, an out-of-bounds
          value,{" "}
          <Link href="/faq/#ambiguous-annulled">Ambiguous, or Annulled</Link>.
        </p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="ambiguous-annulled"
        >
          What are &quot;Ambiguous&quot; and &quot;Annulled&quot; resolutions?
        </h3>
        <p>
          Sometimes a question cannot be resolved because the state of the
          world, the <q>truth of the matter</q>, is too uncertain. In these
          cases, the question is resolved as Ambiguous.
        </p>
        <p>
          Other times, the state of the world is clear, but a key assumption of
          the question was overturned. In these cases, the question is Annulled.
        </p>
        <p>
          In the same way, when a Conditional turns out to be based on an
          outcome that did not occur, it is Annulled. For example, when a{" "}
          <Link href="/faq/#conditionals">Conditional Pair</Link>
          &apos;s parent resolves Yes, the <q>if No</q> Conditional is Annulled.
        </p>
        <p>
          When questions are Annulled or resolved as Ambiguous, they are no
          longer open for forecasting, and they are not scored.
        </p>
        <p>
          <em>
            If you&apos;d like to read more about why Ambiguous and Annulled
            resolutions are necessary you can expand the section below.
          </em>
        </p>

        <div>
          <p className="cursor-pointer font-semibold">
            Reasons for Ambiguous and Annulled resolutions
          </p>
          <div className="mt-2">
            <h3
              className="scroll-mt-nav text-lg font-semibold"
              id="reason-annulled"
            >
              Why was this question Annulled or resolved as Ambiguous?
            </h3>
            <p>
              An Ambiguous or Annulled resolution generally implies that there
              was some inherent ambiguity in the question, that real-world
              events subverted one of the assumptions of the question, or that
              there is not a clear consensus as to what in fact occurred.
              Metaculus strives for satisfying resolutions to all questions, and
              we know that Ambiguous and Annulled resolutions are disappointing
              and unsatisfying. However, when resolving questions we have to
              consider factors such as fairness to all participating forecasters
              and the underlying incentives toward accurate forecasting.
            </p>
            <p>
              To avoid this unfairness and provide the most accurate
              information, we resolve all questions in accordance with the
              actual written text of the resolution criteria whenever possible.
              By adhering as closely as possible to a reasonable interpretation
              of what&apos;s written in the resolution criteria, we minimize the
              potential for forecasters to arrive at different interpretations
              of what the question is asking, which leads to fairer scoring and
              better forecasts. In cases where the outcome of a question does
              not clearly correspond to the direction or assumptions of the text
              of the resolution criteria, Ambiguous resolution or Annulling the
              question allows us to preserve fairness in scoring.
            </p>

            <h3
              className="scroll-mt-nav text-lg font-semibold"
              id="types-annulled"
            >
              Types of Ambiguous or Annulled Resolutions
            </h3>
            <p>
              A question&apos;s resolution criteria can be thought of as akin to
              a legal contract. The resolution criteria create a shared
              understanding of what forecasters are aiming to predict, and
              define the method by which they agree to be scored for accuracy
              when choosing to participate. When two forecasters who have
              diligently read the resolution criteria of a question come away
              with significantly different perceptions about the meaning of that
              question, it creates unfairness for at least one of these
              forecasters. If both perceptions are reasonable interpretations of
              the text, then one of these forecasters will likely receive a poor
              score at resolution time through no fault of their own.
              Additionally, the information provided by the forecasts on the
              question will be poor due to the differing interpretations.
            </p>
            <p>
              The following sections provide more detail about common reasons we
              resolve questions as Ambiguous or Annul them and some examples.
              Some of these examples could fit into multiple categories, but
              we&apos;ve listed them each in one main category as illustrative
              examples. This list of types of Ambiguous or Annulled resolutions
              is not exhaustive &mdash; there are other reasons that a question
              may resolve Ambiguous or be Annulled &mdash; but these cover some
              of the more common and some of the trickier scenarios. Here&apos;s
              a condensed version, but read on for more details:
            </p>
            <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
              <li>
                <a href="#ambiguous-details">
                  <strong>Ambiguous resolution</strong>
                </a>
                <strong>.</strong> Reserved for questions where reality is not
                clear.
              </li>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  <a href="#no-clear-consensus">
                    <strong>No clear consensus</strong>
                  </a>
                  <strong>.</strong> There is not enough information available
                  to arrive at an appropriate resolution.
                </li>
              </ul>
              <li>
                <a href="#annulment-details">
                  <strong>Annulment</strong>
                </a>
                <strong>.</strong> Reserved for questions where the reality is
                clear but the question is not.
              </li>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  <a href="#annulled-underspecified">
                    <strong>Underspecified questions</strong>
                  </a>
                  <strong>.</strong> The question did not clearly describe an
                  appropriate method to resolve the question.
                </li>
                <li>
                  <a href="#annulled-subverted">
                    <strong>Subverted assumptions</strong>
                  </a>
                  <strong>.</strong> The question made assumptions about the
                  present or future state of the world that were violated.
                </li>
                <li>
                  <a href="#annulled-imbalanced">
                    <strong>
                      Imbalanced outcomes and consistent incentives
                    </strong>
                  </a>
                  <strong>.</strong> The binary question did not adequately
                  specify a means for either Yes or No resolution, leading to
                  imbalanced outcomes and bad incentives.
                </li>
              </ul>
            </ul>
            <p>
              <strong>Note:</strong> Previously Metaculus only had one
              resolution type &mdash; Ambiguous &mdash; for cases where a
              question could not otherwise be resolved. We&apos;ve since
              separated these into two types &mdash; Ambiguous and Annulled
              &mdash; to provide clarity on the reason that a question could not
              otherwise be resolved. Annulling questions first became an option
              in April of 2023.
            </p>

            <h4
              className="scroll-mt-nav text-lg font-semibold"
              id="ambiguous-details"
            >
              Ambiguous Resolution
            </h4>
            <p>
              Ambiguous resolution is reserved for questions where reality is
              not clear. Either because reporting about an event is conflicted
              or unclear about what actually happened, or available material is
              silent on the information being sought. We&apos;ve described the
              types of questions where Ambiguous resolution is appropriate as
              those with <a href="#no-clear-consensus">No Clear Consensus</a>.
            </p>
          </div>
        </div>
        <h5
          className="scroll-mt-nav text-lg font-semibold"
          id="no-clear-consensus"
        >
          No Clear Consensus
        </h5>
        <p>
          Questions can also resolve Ambiguous when there is not enough
          information available to arrive at an appropriate resolution. This can
          be because of conflicting or unclear media reports, or because a data
          source that was expected to provide resolution information is no
          longer available. The following are some examples where there was no
          clear consensus.
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <Link href="/questions/9459/russian-troops-in-kiev-in-2022/">
              <strong>
                <em>
                  Will Russian troops enter Kyiv, Ukraine before December 31,
                  2022?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                This question asked if at least 100 Russian troops would enter
                Ukraine before the end of 2022. It was clear that some Russian
                troops entered Ukraine, and even probable that there were more
                than 100 Russian troops in Ukraine. However there was no clear
                evidence that could be used to resolve the question, so it was
                necessary to resolve as Ambiguous. In addition to the lack of a
                clear consensus, this question is also an example of imbalanced
                outcomes and the need to preserve incentives.{" "}
                <Link href="/questions/9459/russian-troops-in-kiev-in-2022/#comment-93915">
                  As an Admin explains here
                </Link>
                , due to the uncertainty around events in February the question
                could not remain open to see if a qualifying event would happen
                before the end of 2022. This is because the ambiguity around the
                events in February would necessitate that the question could
                only resolve as Yes or Ambiguous, which creates an incentive to
                forecast confidently in an outcome of Yes.
              </li>
            </ul>
          </li>
          <li>
            <Link
              href="/questions/10134/average-ransomware-kit-cost-in-2022/"
              target="_blank"
              rel="noopener"
            >
              <strong>
                <em>
                  What will the average cost of a ransomware kit be in 2022?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                This question relied on data published in a report by Microsoft,
                however Microsoft&apos;s report for the year in question no
                longer contained the relevant data. It&apos;s{" "}
                <Link href="/faq/#ressrc">Metaculus policy</Link>that by default
                if a resolution source is not available Metaculus may use a
                functionally equivalent source in its place unless otherwise
                specified in the resolution text, but for this question a search
                for alternate sources did not turn anything up, leading to
                Ambiguous resolution.
              </li>
            </ul>
          </li>
        </ul>

        <h4
          className="scroll-mt-nav text-lg font-semibold"
          id="annulment-details"
        >
          Annulment
        </h4>
        <p>
          Annulling a question is reserved for situations where reality is clear
          but the question is not. In other words, the question failed to
          adequately capture a method for clear resolution.
        </p>
        <p>
          <strong>Note:</strong> Annulment was introduced in April of 2023, so
          while the following examples describe Annulment the questions in
          actuality were resolved as Ambiguous.
        </p>

        <h5
          className="scroll-mt-nav text-lg font-semibold"
          id="annulled-underspecified"
        >
          The Question Was Underspecified
        </h5>
        <p>
          Writing good forecasting questions is hard, and it only gets harder
          the farther the question looks into the future. To fully eliminate the
          potential for a question to be Annulled the resolution criteria must
          anticipate all the possible outcomes that could occur in the future;
          in other words, there must be clear direction for how the question
          resolves in every possible outcome. Most questions, even very
          well-crafted ones, can&apos;t consider <em>every</em> possible
          outcome. When an outcome occurs that does not correspond to the
          instructions provided in the resolution criteria of the question then
          that question may have to be Annulled. In some cases we may be able to
          find an interpretation that is clearly an appropriate fit for the
          resolution criteria, but this is not always possible.
        </p>
        <p>
          Here are some examples of Annulment due to underspecified questions:
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <Link href="/questions/12433/substacks-google-trends-at-end-of-2022/">
              <strong>
                <em>
                  What will Substack&apos;s Google Trends index be at end of
                  2022?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                This question did not clearly specify how Google trends would be
                used to arrive at the average index for December of 2022,
                because the index value depends on the date range specified in
                Google Trends. An Admin provided more details in{" "}
                <Link href="/questions/12433/substacks-google-trends-at-end-of-2022/#comment-112592">
                  this comment
                </Link>
                .
              </li>
            </ul>
          </li>
          <li>
            <Link href="/questions/3727/when-will-a-fusion-reactor-reach-ignition/">
              <strong>
                <em>When will a fusion reactor reach ignition?</em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                This question did not clearly define what was meant by
                &ldquo;ignition&rdquo;. As an Admin described in{" "}
                <Link href="/questions/3727/when-will-a-fusion-reactor-reach-ignition/#comment-110164">
                  this comment
                </Link>
                , the definition of ignition may vary depending on the
                researchers using it and the fusion method, as well as the
                reference frame for what counts as an energy input and output.
              </li>
            </ul>
          </li>
          <li>
            <Link href="/questions/12532/russia-general-mobilization-before-2023/">
              <strong>
                <em>
                  Will Russia order a general mobilization by January 1, 2023?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                This question asked about Russia ordering a general
                mobilization, but the difficult task of determining that a
                general mobilization was ordered was not adequately addressed in
                the resolution criteria. The text of the question asked about a
                &ldquo;general mobilization&rdquo;, but the definitions used in
                the resolution criteria differed from the common understanding
                of a &ldquo;general mobilization&rdquo; and didn&rsquo;t
                adequately account for the actual partial mobilization that was
                eventually ordered, as{" "}
                <Link href="/questions/12532/russia-general-mobilization-before-2023/">
                  explained by an Admin here
                </Link>
                .
              </li>
            </ul>
          </li>
        </ul>

        <h5
          className="scroll-mt-nav text-lg font-semibold"
          id="annulled-subverted"
        >
          The Assumptions of the Question Were Subverted
        </h5>
        <p>
          Questions often contain assumptions in their resolution criteria, many
          of which are unstated. For example, assuming that the underlying
          methodology of a data source will remain the same, assuming that an
          organization will provide information about an event, or assuming that
          an event would play out a certain way. The best practice is to specify
          what happens in the event certain assumptions are violated (including
          by specifying that the question will be Annulled in certain
          situations) but due to the difficulty in anticipating these outcomes
          this isn&apos;t always done.
        </p>
        <p>Here are some examples of Annulment due to subverted assumptions:</p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <Link href="/questions/10444/cause-of-flight-5735-crash/">
              <strong>
                <em>
                  Will a technical problem be identified as the cause of the
                  crash of China Eastern Airlines Flight 5735?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                This question relied on the conclusions of a future National
                Transportation Safety Board (NTSB) report. However, it was a
                Chinese incident so it was unlikely that the NTSB would publish
                such a report. Additionally, the question did not specify a date
                by which the report must be published resulting in a resolution
                of No. Since this was not specified and the assumption of a
                future NTSB report was violated the question was Annulled, as{" "}
                <Link href="/questions/10444/cause-of-flight-5735-crash/">
                  explained by an Admin here
                </Link>
                .
              </li>
            </ul>
          </li>
          <li>
            <Link href="/questions/6249/november-2021-production-of-semiconductors/">
              <strong>
                <em>
                  What will the Federal Reserves&apos; Industrial Production
                  Index be for November 2021, for semiconductors, printed
                  circuit boards and related products?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                This question did not provide a description of how it should
                resolve in the event the underlying source changed its
                methodology. It anticipated the possibility of the base period
                changing, however, the entire methodology used to construct the
                series changed before this question resolved, not just the base
                period. Because the unwritten assumption of a consistent
                methodology was violated, the question was Annulled.
              </li>
            </ul>
          </li>
          <li>
            <Link href="/questions/10048/russia-to-return-to-nuclear-level-1/">
              <strong>
                <em>
                  When will Russia&apos;s nuclear readiness scale return to
                  Level 1?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Media reporting about Russia&apos;s nuclear readiness level gave
                the impression that the level had been changed to level 2,
                leading to the creation of this question. However, a more
                thorough investigation found that Russia&apos;s nuclear
                readiness most likely did not change. This violated the
                assumption of the question leading to the question being
                Annulled, as{" "}
                <Link href="/questions/10048/russia-to-return-to-nuclear-level-1/#comment-100275">
                  explained by an Admin here
                </Link>
                .
              </li>
            </ul>
          </li>
          <li>
            <Link href="/questions/9000/us-social-cost-of-carbon-in-2022/">
              <strong>
                <em>
                  What will be the Biden Administration&apos;s social cost of 1
                  ton of CO2 in 2022?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                This question specified that it would resolve according to a
                report published by the US Interagency Working Group (IWG),
                however the IWG did not publish an estimate before the end of
                2022. This question anticipated this outcome and appropriately
                specified that it should be Annulled if no report was published
                before the end of 2022, and the question was resolved
                accordingly.
              </li>
            </ul>
          </li>
        </ul>

        <h5
          className="scroll-mt-nav text-lg font-semibold"
          id="annulled-imbalanced"
        >
          Imbalanced Outcomes and Consistent Incentives
        </h5>
        <p>
          Sometimes questions imply imbalanced outcomes, for example where the
          burden of proof for an event to be considered to have occurred is high
          and tips the scales toward a binary question resolving No, or where
          the question would require a substantial amount of research to surface
          information showing that an event occurred, which also favors a
          resolution of No. In certain circumstances these kinds of questions
          are okay, so long as there is a clear mechanism for the question to
          resolve as Yes and to resolve as No. However, sometimes questions are
          formulated such that there&apos;s no clear mechanism for a question to
          resolve as No, leading to the only realistic outcomes being a
          resolution of Yes or Annulled. This creates a bias in the question and
          also produces bad incentives if the question isn&apos;t Annulled.
        </p>
        <p>
          The case of imbalanced outcomes and consistent incentives is best
          explained with examples, such as the following:
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <Link href="/questions/6047/1m-lost-in-prediction-market/">
              <strong>
                <em>
                  Will any prediction market cause users to lose at least $1M
                  before 2023?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                This question asks whether certain incidents such as hacking,
                scams, or incorrect resolution lead to users losing $1 million
                or more from a prediction market. However, there&apos;s no clear
                mechanism specified to find information about this, as
                prediction markets aren&apos;t commonly the subject of media
                reports. Concretely proving that this did not occur would
                require extensive research. This creates an imbalance in the
                resolution criteria. The question would resolve as Yes if there
                was a clear report from credible sources that this occurred.
                However, to resolve as No it would require extensive research to
                confirm that it didn&apos;t occur and a knowledge of the
                happenings in prediction markets that most people do not
                possess. To resolve as No Metaculus would either have to do an
                absurd amount of research, or assume that a lack of prominent
                reports on the topic is sufficient to resolve as No. In this
                case the question had to be Annulled.
              </li>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  Now consider if there had been a clear report that this had
                  actually occurred. In a world where that happened the question
                  could arguably have been resolved as Yes. However, savvy users
                  who follow our methods on Metaculus might realize that when a
                  mechanism for a No resolution is unclear, that the question
                  will then resolve as Yes or be Annulled. This creates bad
                  incentives, as these savvy forecasters might begin to raise
                  the likelihood of Yes resolution on future similar forecasts
                  as they meta-predict how Metaculus handles these questions.
                  For this reason, binary questions must have a clear mechanism
                  for how they resolve as both Yes and No. If the mechanism is
                  unclear, then it can create bad incentives. Any questions
                  without a clear mechanism to resolve as both possible outcomes
                  should be Annulled, even if a qualifying event occurs that
                  would resolve the question as Yes.
                </li>
              </ul>
            </ul>
          </li>
          <li>
            <Link href="/questions/13521/any-ftx-depositor-to-get-anything-out-by-2023/">
              <strong>
                <em>
                  Will any remaining FTX depositor withdraw any amount of
                  tradeable assets from FTX before 2023?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                This question asked if an FTX depositor would withdraw assets
                where the withdrawal was settled by FTX. Unfortunately this
                question required a knowledge of the details of FTX withdrawals
                that was unavailable to Admins, resulting in there being no real
                mechanism to resolve the question as No. This led to an
                imbalance in possible outcomes, where the question could only
                truly resolve as Yes or be Annulled. The imbalance necessitated
                that the question be resolved as Ambiguous to preserve
                consistent incentives for forecasting.
              </li>
            </ul>
          </li>
        </ul>
        <div>
          <h3 id="allres" className="mb-4 scroll-mt-nav text-2xl font-semibold">
            Do all questions get resolved?
          </h3>
          <p>Currently, all questions will be resolved.</p>
        </div>

        <div>
          <h3
            id="whenresolve"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            When will a question be resolved?
          </h3>
          <p>
            Questions will be resolved when they have satisfied the criteria
            specified in the resolution section of the question (or conversely,
            when those criteria have conclusively failed to be met). Each
            question also has a &quot;Resolution Date&quot; listed in our system
            for purposes such as question sorting; however, this listed date is
            often nothing more than an approximation, and the actual date of
            resolution may not be known in advance.
          </p>
          <p>
            For questions which ask when something will happen (such as{" "}
            <q>
              <Link href="/questions/3515/when-will-the-first-humans-land-successfully-on-mars/">
                When will the first humans land successfully on Mars?
              </Link>
            </q>
            ), forecasters are asked to predict the date/time when the criteria
            have been satisfied (though the question may be decided and points
            awarded at some later time, when the evidence is conclusive). Some
            questions predict general time intervals, such as &quot;In which
            month will unemployment pass below 4%?&quot;; when such a question
            has specified the date/time which will be used, those terms will be
            used. If these terms are not given, the default policy will be to
            resolve as the <strong>midpoint of that period</strong> (for
            example, if the January report is the first month of unemployment
            under 4%, the resolution date will default to January 15).
          </p>
        </div>

        <div>
          <h3
            id="resolvebackground"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Is the background material used for question resolution?
          </h3>
          <p>
            No, only the resolution criteria is relevant for resolving a
            question, the background section is intended only to provide
            potentially useful information and context for forecasters. In a
            well-specified question, the resolution criteria should stand on its
            own as a set of self-contained instructions for resolving the
            question. In rare cases or older questions on Metaculus, the
            background material may be necessary to inform resolution, but the
            information in the resolution criteria supersedes conflicting
            information in the background material.
          </p>
          <p>
            Still, we want the background material to be as helpful as possible
            and accurately capture the context and relevant information
            available at the time the question was written, so if you see errors
            or misleading information in the background of a question please let
            Admins know by tagging @admins in a comment!
          </p>
        </div>

        <div>
          <h3
            id="unclearresolve"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What happens if the resolution criteria of a question is unclear or
            suboptimal?
          </h3>
          <p>
            We take care to launch questions that are as clearly specified as
            possible. Still, writing clear and objectively resolvable questions
            is challenging, and in some cases a question&apos;s resolution
            criteria may unintentionally allow for multiple different
            interpretations or may not accurately represent the question being
            asked. In deciding how to approach questions that have been launched
            with these deficiencies, Admins primarily consider fairness to
            forecasters. Issuing clarifications or edits for open questions can
            harm some forecaster&apos;s scores when the clarification
            significantly changes the meaning of the question. Based on an
            assessment of fairness and other factors, Admins may issue a
            clarification to an open question to better specify the meaning.
            This is typically most appropriate when a question has not been open
            for long (and therefore forecasts can be updated with negligible
            impact to scores), when a question contains inconsistent or
            conflicting criteria, or when the clarification adds specificity
            where there previously was none in a way that avoids substantial
            changes to the meaning.
          </p>
          <p>
            In many cases such questions must be resolved as{" "}
            <a href="#ambiguous-annulled">ambiguous or annulled</a>to preserve
            fairness in scoring. If you believe there are ambiguities or
            conflicts in the resolution criteria for a question please let
            Admins know by tagging @admins in a comment. We hope inconsistencies
            can be identified as early as possible in the lifetime of a question
            so that they can be addressed. Claims of unclear resolution criteria
            made for questions which have already closed or claims of incorrect
            resolution for questions which have already resolved will be held to
            a higher standard of evidence if the issue(s) with the resolution
            criteria was not previously mentioned while the question was open to
            forecasting.
          </p>
        </div>
        <div>
          <h3
            id="reresolve"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Can questions be re-resolved?
          </h3>
          <p>
            Yes, at times questions are resolved and it is later discovered
            these resolutions were in error given the information available at
            the time. Some questions may even specify that they will be resolved
            according to initial reporting or results, but specify re-resolution
            in the event that the final results disagree with the initial
            results (for example, questions about elections might use this
            mechanism to allow prompt feedback for forecasters but arrive at the
            correct answer in the rare event that the initial election call was
            wrong). Questions may be re-resolved in such cases if Metaculus
            determines that re-resolution is appropriate.
          </p>
        </div>

        <div>
          <h3
            id="whatifres"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What happens if a question gets resolved in the real world prior to
            the close time?
          </h3>
          <p>
            When resolving a question, the Moderator has an option to change the
            effective closing time of a question, so that if the question is
            unambiguously resolved prior to the closing time, the closing time
            can be changed to a time prior to which the resolution is uncertain.
          </p>
          <p>
            When a question closes early, the points awarded are <em>only</em>{" "}
            those accumulated up until the (new) closing time. This is necessary
            in order to keep scoring &quot;proper&quot; (i.e. maximally reward
            predicting the right probability) and prevent gaming of points, but
            it does mean that the overall points (positive or negative) may end
            up being less than expected.
          </p>
        </div>

        <div>
          <h3
            id="retroactive-closure"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            When should a question specify retroactive closure?
          </h3>
          <p>
            In some cases when the timing of an event is unknown it may be
            appropriate to change the closing date to a time before the question
            resolved, after the resolution is known. This is known as
            retroactive closure. Retroactive closure is not allowed except in
            the case of an event where the timing of the event is unknown and
            the outcome of the event is independent of the timing of the event,
            as described in the question closing guidelines above. When the
            timing of the event impacts the outcome of the event retroactive
            closure would violate proper scoring. For scoring to be proper a
            question must only close retroactively when the outcome is
            independent of the timing of the event. Here are several examples:
          </p>
          <ul className="ml-5 list-disc">
            <li>
              The date of a rocket launch can often vary based on launch windows
              and weather, and the success or failure of the launch is primarily
              independent of when the launch occurs.{" "}
              <strong>In this case retroactive closure is appropriate</strong>,
              as the timing of the launch is very unlikely to impact forecasts
              for the success of the launch.
            </li>
            <li>
              In some countries elections can be called earlier than scheduled
              (these are known as{" "}
              <a href="https://en.wikipedia.org/wiki/Snap_election">
                snap elections
              </a>
              ). The timing of snap elections is often up to the party in power,
              and elections are often scheduled at a time the incumbent party
              considers to be favorable to their prospects.{" "}
              <strong>
                In this case retroactive closure is <ins>not</ins> appropriate
              </strong>
              , as the timing of the election will impact forecasts for the
              outcome of the election, violating proper scoring.
            </li>
            <li>
              Previously some questions on Metaculus were approved with
              inappropriate retroactive closure clauses. For example, the
              question &quot;
              <Link href="/questions/6662/date-earth-functional-satellites-exceed-5000/">
                When will the number of functional artificial satellites in
                orbit exceed 5,000?
              </Link>
              &quot; specifies retroactive closure to the date when the 5,001st
              satellite is launched.{" "}
              <strong>
                In this case retroactive closure was <ins>not</ins> appropriate
              </strong>
              , because the resolution of the question was dependent on the
              closure date since both relied on the number of satellites
              launched.
            </li>
          </ul>
          <p>
            Forecasters often like retroactive closure because it prevents
            points from being truncated when an event occurs before the
            originally scheduled close date. But in order to elicit the best
            forecasts it’s important to follow proper scoring rules. For more on
            point truncation{" "}
            <Link href="/help/scores-faq/#score-truncation">
              this section of the FAQ
            </Link>
            .
          </p>
          <p>
            While Metaculus will try not to approve questions which specify
            inappropriate retroactive closure, sometimes new or existing
            questions do specify it. It is the policy of Metaculus to ignore
            inappropriate retroactive closure when resolving questions.
          </p>
        </div>

        <div>
          <h3
            id="whatifres2"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What happens if a question&apos;s resolution criteria turn out to
            have been fulfilled prior to the opening time?
          </h3>
          <p>
            Our Moderators and question authors strive to be as clear and
            informed as possible on each question, but mistakes occasionally
            happen, and will be decided by our Admins&apos; best judgement. For
            a hypothetical question like{" "}
            <q>Will a nuclear detonation occur in a Japanese City by 2030?</q>{" "}
            it can be understood by common sense that we are asking about the{" "}
            <em>next</em> detonation after the detonations in 1945. In other
            questions like{" "}
            <q>
              <Link href="/questions/8946/facebook-uses-explainable-news-feed-by-2026/)">
                Will Facebook implement a feature to explain news feed
                recommendations before 2026?
              </Link>
            </q>
            , we are asking about the <em>first</em> occurrence of this event.
            Since this event occurred before the question opened and this was
            not known to the question author, the question resolved ambiguously.
          </p>
        </div>

        <div>
          <h3 id="ressrc" className="mb-4 scroll-mt-nav text-2xl font-semibold">
            What happens if a resolution source is no longer available?
          </h3>
          <p>
            There are times when the intent of a question is to specifically
            track the actions or statements of specific organizations or people
            (such as, &quot;how many Electoral Votes will the Democrat win in
            the 2020 US Presidential Election{" "}
            <em>according to the Electoral College</em>
            &quot;); at other times, we are interested only in the actual truth,
            and we accept a resolution source as being an acceptable
            approximation (such as, &quot;how many COVID-19 deaths will there be
            in the US in 2021 according to the CDC?&quot;). That said, in many
            cases it is not clear which is intended.
          </p>
          <p>
            Ideally, every question would be written with maximally clear
            language, but some ambiguities are inevitable. Unless specifically
            indicated otherwise, if a resolution source is judged by Metaculus
            Admins to be defunct, obsolete, inadequate, or in error, Admins will
            make a best effort to replace it with a functional equivalent or may
            annul the question. Questions can over-rule this policy with
            language such as &quot;If [this source] is no longer available, the
            question will resolve Ambiguously&quot; or &quot;This question
            tracks publications by [this source], regardless of publications by
            other sources or perceived errors in the publication.&quot;
          </p>
        </div>

        <div>
          <h3
            id="resmethod"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What happens if a resolution source changes methodology?
          </h3>
          <p>
            Some questions on Metaculus are resolved based on estimates from
            credible sources, which can substantially vary depending on each
            source&#39;s methodology. For example, the Global Study on Homicide{" "}
            <a
              href="https://www.unodc.org/documents/data-and-analysis/gsh/2023/GSH23_Special_Points.pdf"
              target="_blank"
            >
              estimated
            </a>{" "}
            a rate of 5.8 per 100k people in 2021, while Our World in Data{" "}
            <a
              href="https://ourworldindata.org/grapher/homicide-rate?tab=chart&country=~OWID_WRL"
              target="_blank"
            >
              reported
            </a>{" "}
            a rate of 5.0 per 100k people using data from the Institute for
            Health Metrics and Evaluation. If Our World in Data were to change
            its underlying source to the Global Study on Homicide, then its
            reported homicide rate for 2021 would change.
          </p>
          <p>
            Ideally such questions should clearly specify how they would resolve
            if the source&#39;s methodology changes. If not specified, Metaculus
            Admins will resolve the question based on the new estimates if they
            judge the change in methodology to be minor. If the change is
            substantial, then Metaculus Admins will generally resolve the
            question based on the previous methodology, if this is available, or
            use an alternate credible source with similar estimates to the
            previous methodology. If resulting data from the previous
            methodology or alternate credible sources is unavailable, Admins
            will annul the question.
          </p>
        </div>

        <div>
          <h3
            id="rescouncil"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What are Resolution Councils?
          </h3>
          <p>
            Metaculus uses Resolution Councils to reduce the likelihood of
            ambiguous resolutions for important questions—those that we feel
            have the potential to be in the top 1% of all questions on the
            platform in terms of impact.
          </p>
          <p>
            A Resolution Council is an individual or group that is assigned to
            resolve a question. Resolution Council questions resolve at the
            authority of the individual or individuals identified in the
            resolution criteria. These individuals will identify the resolution
            that best aligns with the question and its resolution criteria.
          </p>
          <p>
            If a Resolution Council member is not available to resolve a
            question, Metaculus may choose a suitable replacement.
          </p>
        </div>
        <hr />
        <div>
          <h2
            id="predictions"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            Predictions
          </h2>
        </div>

        <div>
          <h3
            id="tutorial"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Is there a tutorial or walkthrough?
          </h3>
          <p>
            We are working on recreating the tutorial.
            {/* Yes! Start the Metaculus forecasting tutorial{" "}
            <Link href="/tutorials/">here</Link>. */}
          </p>
        </div>

        <div>
          <h3
            id="howpredict"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            How do I make a prediction? Can I change it later?
          </h3>
          <p>
            You make a prediction simply by sliding the slider on the
            question&apos;s page to the probability you believe most captures
            the likelihood that the event will occur.
          </p>
          <p>
            You can revise your prediction at any time up until the question
            closes, and you are encouraged to do so: as new information comes to
            light, it is beneficial to take it into account.
          </p>
        </div>

        <div>
          <h3
            id="reaffirming"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What is &quot;Reaffirming&quot; a prediction?
          </h3>
          <p>
            Sometimes you haven&apos;t changed your mind on a question, but you
            still want to record your current forecast. This is called
            &quot;reaffirming&quot;: predicting the same value you predicted
            before, now.
          </p>
          <p>
            It is also useful when sorting questions by the age of your latest
            forecast. Reaffirming a question sends it to the bottom of that
            list.
          </p>
          <p>
            You can reaffirm a question from the normal forecast interface on
            the question page, or using a special button in feeds.
          </p>
          <Image
            src="https://metaculus-public.s3.us-west-2.amazonaws.com/Screen+Shot+2023-02-14+at+2.14.38+PM.png"
            alt="Reaffirming a prediction"
            className="my-4"
            width={922}
            height={575}
          />

          <p>
            On question groups, reaffirming impacts all subquestions on which
            you had a forecast, but not the others.
          </p>
        </div>

        <div>
          <h3
            id="howwithdraw"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            How can I withdraw my prediction?
          </h3>
          <p>
            If you&apos;ve made a prediction on a question and it is still open
            for predicting, you can withdraw your prediction by pressing the
            &quot;withdraw&quot; button. For group questions, the
            &quot;withdraw&quot; button is nested in the &quot;...&quot; menu
            next to the option you wish to withdraw.
          </p>
          <Image
            src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/withdraw_button.jpg"
            alt="Prediction Interface"
            className="my-4"
            width={700}
            height={400}
          />
          <p>
            Once you’ve withdrawn, you no longer have a prediction standing for
            that question. Of course, after withdrawing, you can make a new
            prediction any time and start accruing scores again. Concretely,
            this means that, starting from the moment you withdrew and until you
            make a new prediction:
          </p>
          <div className="text-gray-700 dark:text-gray-400">
            <ul className="list-disc pl-5">
              <li>
                You stop accruing scores, including Peer scores, Baseline
                scores, etc.
              </li>
              <li>You stop accruing Coverage for the Peer leaderboards.</li>
              <li>
                You aren’t part of the Community Prediction or other aggregates.
              </li>
            </ul>
          </div>
          <p>
            None of those behaviours are retroactive: you still get scores and
            coverage for times up until you withdrew, and your past predictions
            are not removed from the Community Prediction.
          </p>
          <p>
            Let’s work through an example. A 5-day question has 3 forecasters,
            Alex, Bailey and Cedar, who makes these forecasts:
          </p>
          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-300-dark">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-100-dark">
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  day
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  1
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  2
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  3
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  4
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  5
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Alex
                </td>
                {[80, 80, 80, 80, 80].map((percentage, i) => (
                  <td
                    key={i}
                    className="border border-gray-300 p-2 dark:border-gray-300-dark"
                  >
                    {percentage}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Bailey
                </td>
                {[60, 60, 60, null, null].map((percentage, i) => (
                  <td
                    key={i}
                    className="border border-gray-300 p-2 dark:border-gray-300-dark"
                  >
                    {percentage ? `${percentage}%` : ""}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Cedar
                </td>
                {[null, 20, 20, 20, 20].map((percentage, i) => (
                  <td
                    key={i}
                    className="border border-gray-300 p-2 dark:border-gray-300-dark"
                  >
                    {percentage ? `${percentage}%` : ""}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Community Prediction
                </td>
                {[70, 60, 60, 50, 50].map((percentage, i) => (
                  <td
                    key={i}
                    className="border border-gray-300 p-2 dark:border-gray-300-dark"
                  >
                    {percentage}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <p>
            As you can see, Bailey withdraws at the end of the third day, and
            Cedar only joins the second day. This changes the community
            prediction on day 4: it is now 50%. But this does not retroactively
            change the Community prediction on day 2: it is still the case that
            it was 60% on day 2.
          </p>
          <p>
            To complete the example, let’s say the question resolves Yes. Here
            are the scores and coverages that each forecaster will get for each
            day:
          </p>

          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-300-dark">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-100-dark">
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  day
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  1
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  2
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  3
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  4
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  5
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Alex
                </td>
                {[
                  { baseline: "+14", peer: "+6", coverage: "0.2" },
                  { baseline: "+14", peer: "+17", coverage: "0.2" },
                  { baseline: "+14", peer: "+17", coverage: "0.2" },
                  { baseline: "+14", peer: "+28", coverage: "0.2" },
                  { baseline: "+14", peer: "+28", coverage: "0.2" },
                  { baseline: "+70", peer: "+96", coverage: "1.0" },
                ].map((data, i) => (
                  <td
                    key={i}
                    className="border border-gray-300 p-2 dark:border-gray-300-dark"
                  >
                    <div className="flex flex-col gap-1">
                      <div>Baseline: {data.baseline}</div>
                      <div>Peer: {data.peer}</div>
                      <div>Coverage: {data.coverage}</div>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Bailey
                </td>
                {[
                  { baseline: "+5", peer: "-6", coverage: "0.2" },
                  { baseline: "+5", peer: "+8", coverage: "0.2" },
                  { baseline: "+5", peer: "+8", coverage: "0.2" },
                  { baseline: "0", peer: "0", coverage: "0" },
                  { baseline: "0", peer: "0", coverage: "0" },
                  { baseline: "+15", peer: "+10", coverage: "0.6" },
                ].map((data, i) => (
                  <td
                    key={i}
                    className="border border-gray-300 p-2 dark:border-gray-300-dark"
                  >
                    <div className="flex flex-col gap-1">
                      <div>Baseline: {data.baseline}</div>
                      <div>Peer: {data.peer}</div>
                      <div>Coverage: {data.coverage}</div>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Cedar
                </td>
                {[
                  { baseline: "0", peer: "0", coverage: "0" },
                  { baseline: "-17", peer: "-25", coverage: "0.2" },
                  { baseline: "-17", peer: "-25", coverage: "0.2" },
                  { baseline: "-17", peer: "-28", coverage: "0.2" },
                  { baseline: "-17", peer: "-28", coverage: "0.2" },
                  { baseline: "-68", peer: "-106", coverage: "0.8" },
                ].map((data, i) => (
                  <td
                    key={i}
                    className="border border-gray-300 p-2 dark:border-gray-300-dark"
                  >
                    <div className="flex flex-col gap-1">
                      <div>Baseline: {data.baseline}</div>
                      <div>Peer: {data.peer}</div>
                      <div>Coverage: {data.coverage}</div>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <p>
            Bailey did not get any scores for days 4 and 5 when they were
            withdrawn, just like Cedar did not get any scores for day 1 before
            they made their first prediction.
          </p>
          <p>
            To quickly see which questions you’ve ever predicted, withdrawn
            from, or still have a standing prediction on, there are filters in
            the filter menu:
          </p>
          <Image
            src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/search_filters.jpg"
            alt="Search Filters"
            className="my-4"
            width={700}
            height={500}
          />
          <p>And withdrawals show up as crosses in the timeline graphs:</p>
          <Image
            src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/timeline_withdraw.jpg"
            alt="Prediction Interface"
            className="my-4"
            width={300}
            height={300}
          />
        </div>

        <div>
          <h3
            id="auto-withdrawal"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What is prediction auto-withdrawal?
          </h3>
          <p>
            Prediction auto-withdrawal is a feature that automatically{" "}
            <Link href="/faq/#howwithdraw">withdraws</Link> your forecast after
            a set amount of time, unless you update or re-affirm it.
          </p>
          <p>
            By default, a prediction will be withdrawn after 10% of the
            question’s lifetime has passed. You can adjust this percentage in
            your account <Link href="/accounts/settings/">settings</Link>.
          </p>
          <p>When a prediction is withdrawn:</p>
          <ul className="ml-5 list-disc">
            <li>
              Your forecast{" "}
              <span className="italic">up to the point of withdrawal</span>{" "}
              still counts toward your score.
            </li>
            <li>You’ll receive a reminder email before the withdrawal date.</li>
            <li>
              You can re-affirm the forecast later if it still reflects your
              view — but the time between withdrawal and re-affirmation won’t
              count toward your score.
            </li>
          </ul>

          <p>
            This helps reduce the impact of stale forecasts on your accuracy and
            the community prediction.
          </p>
        </div>

        <div>
          <h3
            id="range-interface"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            How do I use the range interface?
          </h3>
          <p>
            Some Metaculus questions are numeric, discrete, or date ranges. To
            predict, you must specify a distribution of likelyhoods over a
            certain range of outcomes. This probability distribution is known as
            a{" "}
            <a href="https://en.wikipedia.org/wiki/Probability_density_function">
              probability density function
            </a>{" "}
            (&quot;PDF&quot;) for numeric and date questions, and a{" "}
            <a href="https://en.wikipedia.org/wiki/Probability_mass_function">
              probability mass function
            </a>{" "}
            (&quot;PMF&quot;) for discrete questions, and represents the
            relative likelyhood of each possible outcome in the question range.
            We&apos;ll refer to both as pdf for simplicity in this FAQ as the
            difference is not significant. The area under the pdf curve between
            two outcomes is proportional to the probability that the resolution
            will be between these two values.
          </p>
          <p>
            To specify your pdf, move the sliders below the graph. The square
            slider moves the mode of the distribution, and the round sliders
            change the shape of the distribution. To make a more complicated
            distribution, add more components using the button below the
            sliders. The weight sliders determine the relative weight of each
            component compared to the others.
          </p>
          <p>
            When you hover over the chart you can read the probability densities
            below it. For example, in the screenshot below, you can see that for
            the value -7.0381 you assigned a density of 1.785 and the Community
            Prediction assigns a density of 0.319.
          </p>
          <Image
            src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/image_zcQBntc.png"
            alt="Continuous Prediction Interface"
            className="my-4"
            width={734}
            height={799}
          />
          <p>
            Below the sliders you can see a table. It lists your median, your
            25th and 75th percentiles, and the mass you put out of each open
            bound. It also lists the same values for the Community Prediction.
            The median, 25th percentile and 75th percentiles are also visible as
            vertical doted lines in the graph.
          </p>
          <p>
            By using the toggle at the top right of the chart, you can switch to
            the{" "}
            <a href="https://en.wikipedia.org/wiki/Cumulative_distribution_function">
              Cumulative Distribution Function
            </a>
            (&quot;CDF&quot;). It is the integral of the PDF, and for any value
            it shows the probability that the question resolves anywhere below
            that value. For example, in the screenshot below you can see that
            you predict 50.47% chance the question resolves below -7.0588, while
            the Community Prediction predicts 69.4%.
          </p>
          <Image
            src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/image_eVvUMVQ.png"
            alt="Cumulative Interface"
            className="my-4"
            width={734}
            height={799}
          />
          {/* TODO: add image of Discrete input */}

          <h4
            id="out-of-bounds-resolution"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            Out of Bounds Resolution
          </h4>
          <p>
            In the table showing the predictions at the bottom of the images
            above, you will see that in addition to the 25th percentile, median,
            and 75th percentile probabilities there is also one labeled
            &quot;&gt; 500&quot;. This question has an open upper bound, which
            means forecasters can assign a probability that the question will
            resolve as a value above the upper end of the specified range. For
            the question depicted above the community and the forecaster each
            assign a 1% probability to the question resolving above the upper
            boundary.
          </p>
          <p>
            Questions can have open or closed boundaries on either end of the
            specified range.
          </p>

          <h4
            id="closed-boundaries"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            Closed Boundaries
          </h4>
          <p>
            A closed boundary means forecasters are restricted from assigning a
            probability beyond the specified range. Closed boundaries are
            appropriate when a question cannot resolve outside the range. For
            example, a question asking what share of the vote a candidate will
            get with a range from 0 to 100 should have closed boundaries because
            it is not possible for the question to resolve outside the range.
            Closed boundaries restrict forecasters from assigning probabilities
            outside the specified range.
          </p>

          <h4
            id="open-boundaries"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            Open Boundaries
          </h4>
          <p>
            An open boundary allows a question to resolve outside the range. For
            example, a question asking what share of the vote a candidate will
            get with a range from 30 to 70 should have open boundaries because
            it is possible that the candidate could get less than 30% of the
            vote or more than 70%. Open boundaries should be specified even if
            it unlikely that the vote share falls outside the range, because it
            is theoretically possible that vote shares outside the specified
            range can occur.
          </p>
          <p>
            Forecasters can assign probabilities outside the range when the
            boundary is open by moving the slider all the way to one side. The
            weight can also be lowered or increased to adjust the probability
            assigned to an out of bounds resolution.
          </p>

          <h4
            id="multiple-components"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            Multiple Components
          </h4>
          <p>
            In the images shown above you can see that the user has assigned two
            probability distributions. Up to five logistic distributions can be
            added using the &quot;Add Component&quot; button. The relative
            weight of each can be adjusted using the &quot;weight&quot; slider
            below each component.
          </p>
        </div>

        <div>
          <h3
            id="community-prediction"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            How is the Community Prediction calculated?
          </h3>
          <p>
            The Community Prediction is a consensus of recent forecaster
            predictions. It&apos;s designed to respond to big changes in
            forecaster opinion while still being fairly insensitive to outliers.
          </p>
          <p>Here&apos;s the mathematical detail:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>Keep only the most recent prediction from each forecaster.</li>
            <li>
              Assign them a number <KatexRenderer equation="n" inline />, from
              oldest to newest (oldest is <KatexRenderer equation="1" inline />
              ).
            </li>
            <li>
              Weight each by{" "}
              <KatexRenderer equation="w(n) \propto e^{\sqrt{n}}" inline />{" "}
              before being aggregated.
            </li>
            <ul className="ml-5 list-disc">
              <li>
                For <Link href="/faq/#question-types">Binary Questions</Link>,
                the Community Prediction is a{" "}
                <a href="https://en.wikipedia.org/wiki/Weighted_median">
                  weighted median
                </a>{" "}
                of the individual forecaster probabilities.
              </li>
              <li>
                For{" "}
                <Link href="/faq/#question-types">
                  Multiple Choice Questions
                </Link>
                , the Community Prediction is a{" "}
                <a href="https://en.wikipedia.org/wiki/Weighted_median">
                  weighted median
                </a>{" "}
                of the individual forecaster probabilities, renormalized to sum
                to 1 and respect the bounds of{" "}
                <KatexRenderer equation="[0.001, 0.999]" inline />.
              </li>
              <li>
                For{" "}
                <Link href="/faq/#question-types">
                  Numeric and Date Questions
                </Link>
                , the Community Prediction is a{" "}
                <a href="https://en.wikipedia.org/wiki/Mixture_distribution">
                  weighted average
                </a>{" "}
                of the individual forecaster distributions.
              </li>
            </ul>
            <li>
              The particular form of the weights means that approximately{" "}
              <KatexRenderer equation="\sqrt{N}" inline /> forecasters need to
              predict or update their prediction in order to substantially
              change the Community Prediction on a question that already has{" "}
              <KatexRenderer equation="N" inline /> forecasters.
            </li>
          </ul>
          <p>
            Users can hide the Community Prediction from view from within their
            settings.
          </p>
          <h4
            id="include-bots"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            Are bots included in the Community Prediction?
          </h4>
          <p>
            By default, bots are not included in any aggregations. If they are,
            it is indicated in the sidebar as &quot;Include Bots&quot;.
          </p>
        </div>

        <div>
          <h3
            id="metaculus-prediction"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What is the Metaculus Prediction?
          </h3>
          <p>
            The Metaculus Prediction can only be viewed in the{" "}
            <Link href="/aggregation-explorer/">Aggregation Explorer</Link>. It
            is deprecated since November 2024, but shows a record of the
            Metaculus system&apos;s best estimate of how a question will
            resolve. It&apos;s based on predictions from community members, but
            unlike the Community Prediction, it&apos;s not a simple average or
            median. Instead, the Metaculus Prediction uses a sophisticated model
            to calibrate and weight each user, ideally resulting in a prediction
            that&apos;s better than the best of the community.
          </p>
          <p>
            For questions that resolved in 2021, the Metaculus Prediction has a
            Brier score of 0.107. Lower Brier scores indicate greater accuracy,
            with the MP slightly lower than the Community Prediction&apos;s
            Brier score of 0.108.
          </p>
        </div>

        <div>
          <h3
            id="visibility-of-the-cp-and-mp"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            Why can&apos;t I see the CP?
          </h3>
          <p>
            When a question first opens, nobody can see the Community Prediction
            for a while, to avoid giving inordinate weight to the very first
            predictions, which may &quot;ground&quot; or bias later ones.
          </p>
        </div>

        <hr />
        <div>
          <h2
            id="scores-and-medals"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            Scores and Medals
          </h2>

          <h3
            id="whatscores"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What are scores?
          </h3>
          <p>
            Scores measure forecasting performance over many predictions.
            Metaculus uses both Baseline scores, which compare you to an
            impartial baseline, and Peer scores, which compare you to all other
            forecasters. We also still use Relative scores for tournaments. We
            do not use the now-obsolete Metaculus points, though they are still
            computed and you can find them on the question page.
          </p>
          <p>
            Learn more in the dedicated{" "}
            <Link href="/help/scores-faq/">Scores FAQ</Link>.
          </p>

          <h3
            id="whatmedals"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What are medals?
          </h3>
          <p>
            Medals reward Metaculus users for excellence in forecasting
            accuracy, insightful comment writing, and engaging question writing.
            We give medals for placing well in any of the 4 leaderboards:
            Baseline Accuracy, Peer Accuracy, Comments, and Question Writing.
            Medals are awarded every year. Medals are also awarded for
            Tournament performance.
          </p>
          <p>
            Learn more in the dedicated{" "}
            <Link href="/help/medals-faq/">Medals FAQ</Link>.
          </p>

          <h4
            id="whatmedalranks"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What are medal ranks?
          </h4>
          <p>
            The ranks shown on user profiles below medals are a measure of how
            that user&#39;s achievements compare to all other users in that
            category.
          </p>
          <p>
            Each user is assigned a score based on which medal they received,
            and when they received them. Higher tier medals give more points:
            gold medals give 10 points each, silver medals give 4 each and
            bronze medals give 1 each. Points also decay by 2× per year. The
            general formula is:
          </p>
          <KatexRenderer
            equation="
            \begin{align*}
            \text{points} &=&
            1&0 \sum_{\text{gold medals} } &2^{-\text{medal age in years}}
            \\
            &&+&
            4 \sum_{\text{silver medals} } &2^{-\text{medal age in years}}
            \\
            &&+&
            1 \sum_{\text{bronze medals} } &2^{-\text{medal age in years}}
            \end{align*}
          "
            inline={false}
          />
          <p>
            Then, all Metaculus users are sorted by how many points they have in
            each medal category, and it’s their rank in that list that is shown
            in their profile. The “best ever” rank is simply the best rank they
            have ever reached in the past.
          </p>
        </div>

        <hr />
        <div>
          <h2
            id="Metaculus Journal"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            Metaculus Journal
          </h2>

          <h3
            id="whatisjournal"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What is the Metaculus Journal?
          </h3>
          <p>
            The <Link href="/project/journal/">Metaculus Journal</Link>publishes
            longform, educational essays on critical topics like emerging
            science and technology, global health, biosecurity, economics and
            econometrics, environmental science, and geopolitics—all fortified
            with testable, quantified forecasts.
          </p>
          <p>
            If you would like to write for the Metaculus Journal, email{" "}
            <a href="mailto:christian@metaculus.com">christian@metaculus.com</a>{" "}
            with a resume or CV, a writing sample, and two story pitches.
          </p>

          <h3
            id="fortifiedessay"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What is a fortified essay?
          </h3>
          <p>
            In November 2021, Metaculus introduced a new project—Fortified
            Essays. A Fortified Essay is an essay that is “fortified” by its
            inclusion of quantified forecasts which are justified in the essay.
            The goal of Fortified Essays is to leverage and demonstrate the
            knowledge and intellectual labor that went into answering
            forecasting questions while also putting the forecasts into a larger
            context.
          </p>
          <p>
            Metaculus plans to run Fortified Essay Contests regularly as part of
            some tournaments. This additional context deriving from essays is
            necessary, because a quantified forecast in isolation may not
            provide the information required to drive decision-making by
            stakeholders. In Fortified Essays, writers can explain the reasoning
            behind their predictions, discuss the factors driving the predicted
            outcomes, explore the implications of these outcomes, and offer
            their own recommendations. By placing forecasts into this larger
            context, these essays are better able to help stakeholders deeply
            understand the relevant forecasts and how much weight to place on
            them. The best essays will be shared with a vibrant and global
            effective altruism community of thousands of individuals and dozens
            of organizations.
          </p>
        </div>
        <hr />
        <div>
          <h2 id="miscellany" className="mb-4 scroll-mt-nav text-3xl font-bold">
            Miscellany
          </h2>

          <h3
            id="what-are-pros"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What are Metaculus Pro Forecasters?
          </h3>
          <p>
            For certain projects, Metaculus employs{" "}
            <Link href={"/pro-forecasters"}>Pro Forecasters</Link> who have
            demonstrated excellent forecasting ability and who have a history of
            clearly describing their rationales. Pros forecast on private and
            public sets of questions to produce well-calibrated forecasts and
            descriptive rationales for our partners. We primarily recruit
            members of the Metaculus community with the best track records for
            our Pro team, but forecasters who have demonstrated excellent
            forecasting ability elsewhere may be considered as well.
          </p>
          <p>
            If you’re interested in hiring Metaculus Pro Forecasters for a
            project, contact us at{" "}
            <a href="mailto:support@metaculus.com">support@metaculus.com</a>{" "}
            with the subject &quot;Project Inquiry&quot;.
          </p>
          <p>
            Metaculus selects individuals according to the following criteria:
          </p>
          <ol className="ml-5 list-inside list-decimal">
            <li>Have scores in the top 2% of all Metaculus forecasters.</li>
            <li>
              Have forecasted on a minimum of 75+ questions that have been
              resolved.
            </li>
            <li>Have experience forecasting for a year or more.</li>
            <li>Have forecasted across multiple subject areas.</li>
            <li>
              Have a history of providing commentary explaining their forecasts.
            </li>
          </ol>

          <h3 id="api" className="mb-4 scroll-mt-nav text-2xl font-semibold">
            Does Metaculus have an API?
          </h3>
          <p>The API documentation is still being worked on.</p>

          <h3
            id="change-name"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            How do I change my username?
          </h3>
          <p>
            You can change your name for free within the first three days of
            registering. After that, you&apos;ll be able to change it once every
            180 days.
          </p>

          <h3
            id="cant-comment"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            I&apos;m registered. Why can&apos;t I comment on a question?
          </h3>
          <p>
            In an effort to reduce spam, new users must wait 12 hours after
            signup before commenting is unlocked.
          </p>

          <h3
            id="suspensions"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Understanding account suspensions.
          </h3>
          <p>
            Metaculus may—though this thankfully occurs very rarely—issue the
            temporary suspensions of an account. This occurs when a user has
            acted in a way that we consider inappropriate, such as when our{" "}
            <Link href="/terms-of-use/">terms of use</Link>are violated. At this
            point, the user will receive a notice about the suspension and be
            made aware that continuing this behavior is unacceptable. Temporary
            suspensions serve as a warning to users that they are a few
            infractions away from receiving a permanent ban on their account.
          </p>

          <h3
            id="cant-see"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Why can I see the Community Prediction on some questions, the
            Metaculus Prediction on others, and no prediction on some others?
          </h3>
          <p>
            When a question first opens, nobody can see the Community Prediction
            for a while, to avoid giving inordinate weight to the very first
            predictions, which may &quot;ground&quot; or bias later ones. Once
            the Community Prediction is visible, the Metaculus Prediction is
            hidden until the question closes.
          </p>
        </div>
        <div>
          <h3
            id="related-news"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What is NewsMatch?
          </h3>
          <p>
            NewsMatch displays a selection of articles relevant to the current
            Metaculus question. These serve as an additional resource for
            forecasters as they discuss and predict on the question. Each
            article is listed with its source and its publication date. Clicking
            an article title navigates to the article itself. Up and downvoting
            allows you to indicate whether the article was helpful or not. Your
            input improves the accuracy and the usefulness of the model that
            matches articles to Metaculus questions.
          </p>
          <p>
            The article matching model is supported by{" "}
            <a href="https://www.improvethenews.org/">Improve the News</a>, a
            news aggregator developed by a group of researchers at MIT. Designed
            to give readers more control over their news consumption, Improve
            the News helps readers stay informed while encountering a wider
            variety of viewpoints.
          </p>
          <p>
            Articles in ITN&apos;s database are matched with relevant Metaculus
            questions by a transformer-based machine learning model trained to
            map semantically similar passages to regions in &quot;embedding
            space.&quot; The embeddings themselves are generated using{" "}
            <a href="https://arxiv.org/abs/2004.09297">MPNet</a>.
          </p>
        </div>

        <div>
          <h3
            id="community-insights"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            What are Community Insights?
          </h3>
          <p>
            Community Insights summarize Metaculus user comments on a given
            question using GPT-4. They condense recent predictions, timestamped
            comments, and the current community prediction into concise
            summaries of relevant arguments for different forecasts on a given
            question. Forecasters can use them to make more informed decisions
            and stay up-to-date with the latest insights from the community.
          </p>
          <p>
            Community Insights are currently available on binary and continuous
            questions with large comment threads and will update regularly as
            new discussion emerges in the comments. If you have feedback on
            these summaries—or would like to see them appear on a wider variety
            of questions—email{" "}
            <a href="mailto:support@metaculus.com">support@metaculus.com</a>.
          </p>
          <p>
            If you find a Community Insights summary to be incorrect, offensive,
            or misleading please use the button at the bottom of the summary to
            &quot;Flag this summary&quot; so the Metaculus team can address it.
          </p>
        </div>

        <div>
          <h3
            id="domains"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Can I get my own Metaculus?
          </h3>
          <p>
            Yes! Metaculus has a domain system, where each domain (like
            &quot;example.metaculus.com&quot;) has a subset of questions and
            users that are assigned to it. Each question has a set of domains it
            is posted on, and each user has a set of domains they are a member
            of. Thus, a domain is a flexible way of setting a particular set of
            questions that are private to a set of users, while allowing some
            questions in the domain to be posted also to metaculus.com. Domains
            are a product that Metaculus can provide with various levels of
            support for a fee; please be in touch for more details.
          </p>
        </div>

        <div>
          <h3
            id="spreadword"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            How can I help spread the word about Metaculus?
          </h3>
          <p>
            Metaculus will get more fun and more interesting to the extent that
            it grows to include more and more predictors, so we encourage
            participants to spread the word to people who they think may enjoy
            predicting, or just be interested in how the questions develop. Some
            of the most useful mechanisms are:
          </p>
          <ol className="ml-5 list-decimal">
            <li>
              Post particular questions you like to Twitter, Facebook, and
              Reddit, using the &quot;share&quot; button on each page, which
              sets up a default tweet/post that you can edit.
            </li>
            <li>
              <a href="https://www.twitter.com/metaculus/">
                Follow us on Twitter
              </a>
              , then retweet Metaculus tweets to your followers.
            </li>
            <li>
              <a href="https://www.facebook.com/metaculus/">
                Follow our Facebook page
              </a>
              , and share posts you like.
            </li>
            <li>
              <a href="mailto:support@metaculus.com">Contact us</a> for other
              ideas.
            </li>
          </ol>
        </div>

        <div>
          <h3
            id="closeaccount"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Can I close my Metaculus account and delete my information?
          </h3>
          <p>
            Of course, if you wish to close your account, please email your
            request to{" "}
            <a href="mailto:closemyaccount@metaculus.com">
              closemyaccount@metaculus.com
            </a>
            . Within five business days, we will remove your profile information
            and comments from our active database.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
