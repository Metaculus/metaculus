import PageWrapper from "../components/pagewrapper";

export const metadata = {
  title: "Metaculus FAQ",
  description:
    "Frequently asked questions about Metaculus, including basics, question types, resolution processes, predictions, scoring, and more.",
};

export default function FAQ() {
  return (
    <PageWrapper>
      <h1 className="mb-6 text-3xl font-bold">Metaculus FAQ</h1>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Basics</h2>
        <ul className="space-y-2">
          <li>
            <a href="#whatismetaculus">What is Metaculus?</a>
          </li>
          <li>
            <a href="#whatisforecasting">What is forecasting?</a>
          </li>
          <li>
            <a href="#whenforecastingvaluable">When is forecasting valuable?</a>
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

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Metaculus Questions</h2>
        <ul className="space-y-2">
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
            <a href="#add-coauthors">How do I add coauthors to my question?</a>
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
            <a href="#question-private">What is a private question?</a>
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

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Question Resolution</h2>
        <ul className="space-y-2">
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
              What happens if a question&apos;s resolution criteria turn out to
              have been fulfilled prior to the opening time?
            </a>
          </li>
          <li>
            <a href="#ressrc">
              What happens if a resolution source is no longer available?
            </a>
          </li>
          <li>
            <a href="#rescouncil">What are Resolution Councils?</a>
          </li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Predictions</h2>
        <ul className="space-y-2">
          <li>
            <a href="#tutorial">Is there a tutorial or walkthrough?</a>
          </li>
          <li>
            <a href="#howpredict">
              How do I make a prediction? Can I change it later?
            </a>
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
          <li>
            <a href="#public-figure">What are public figure predictions?</a>
          </li>
          <li>
            <a href="#reaffirming">
              What is &quot;Reaffirming&quot; a prediction?
            </a>
          </li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Scores and Medals</h2>
        <ul className="space-y-2">
          <li>
            <a href="#whatscores">What are scores?</a>
          </li>
          <li>
            <a href="#whatmedals">What are medals?</a>
          </li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Metaculus Journal</h2>
        <ul className="space-y-2">
          <li>
            <a href="#whatisjournal">What is the metaculus Journal?</a>
          </li>
          <li>
            <a href="#fortifiedessay">What is a fortified essay?</a>
          </li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Miscellaneous</h2>
        <ul className="space-y-2">
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
              Metaculus Prediction on others, and no prediction on some others?
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
      <h2 className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold" id="basics">
        Basics
      </h2>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="whatismetaculus">
        What is Metaculus?
      </h3>
      <p className="mb-4">
        Metaculus is an online forecasting platform and aggregation engine that
        brings together a global reasoning community and keeps score for
        thousands of forecasters, delivering machine learning-optimized
        aggregate forecasts on topics of global importance. The Metaculus
        forecasting community is often inspired by altruistic causes, and
        Metaculus has a long history of partnering with nonprofit organizations,
        university researchers and companies to increase the positive impact of
        its forecasts.
      </p>
      <p className="mb-4">
        Metaculus therefore poses questions about the occurrence of a variety of
        future events, on many timescales, to a community of participating
        forecasters — you!
      </p>
      <p className="mb-4">
        The name &quot;Metaculus&quot; comes from the{" "}
        <a href="https://en.wikipedia.org/wiki/Eriophyidae">Metaculus genus</a>{" "}
        in the Eriophyidae family, a genus of herbivorous mites found in many
        locations around the world.
      </p>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="whatisforecasting">
        What is forecasting?
      </h3>
      <p className="mb-4">
        Forecasting is a systematic practice of attempting to answer questions
        about future events. On Metaculus, we follow a few principles to elevate
        forecasting above simple guesswork:
      </p>

      <p className="mb-4">
        First, questions are carefully specified so that everyone understands
        beforehand and afterward which kinds of outcomes are included in the
        resolution, and which are not. Forecasters then give precise
        probabilities that measure their uncertainty about the outcome.
      </p>

      <p className="mb-4">
        Second, Metaculus aggregates the forecasts into a simple{" "}
        <a href="https://en.wikipedia.org/wiki/Median">median</a> (community)
        prediction, and an advanced Metaculus Prediction. The Community
        Prediction is simple to calculate: it finds the value for which half of
        predictors predict a higher value, and half predict lower. Surprisingly,
        the Community Prediction is often{" "}
        <a href="/questions/track-record/">
          better than any individual predictor
        </a>
        ! This principle is known as{" "}
        <a href="https://en.wikipedia.org/wiki/Wisdom_of_the_crowd">
          the wisdom of the crowd,
        </a>{" "}
        and has been demonstrated on Metaculus and by other researchers.
        Intuitively it makes sense, as each individual has separate information
        and biases which in general balance each other out (provided the whole
        group is not biased in the same way).
      </p>

      <p className="mb-4">
        Third, we measure the relative skill of each forecaster, using their
        quantified forecasts. When we know the outcome of the question, the
        question is &quot;resolved&quot;, and forecasters receive their scores.
        By tracking these scores from many forecasts on different topics over a
        long period of time, they become an increasingly better metric of how
        good a given forecaster is. We use this data for our Metaculus
        Prediction, which gives greater weight to predictions by forecasters
        with better track records. These scores also provide aspiring
        forecasters with important feedback on how they did and where they can
        improve.
      </p>

      <h3
        className="mb-3 mt-6 text-xl font-semibold"
        id="whenforecastingvaluable"
      >
        When is forecasting valuable?
      </h3>
      <p className="mb-4">
        Forecasting is uniquely valuable primarily in complex, multi-variable
        problems or in situations where a lack of data makes it difficult to
        predict using explicit or exact models.
      </p>
      <p className="mb-4">
        In these and other scenarios, aggregated predictions of strong
        forecasters offer one of the best ways of predicting future events. In
        fact, work by the political scientist Philip Tetlock demonstrated that
        aggregated predictions were able to outperform professional intelligence
        analysts with access to classified information when forecasting various
        geopolitical outcomes.
      </p>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="aim">
        Why should I be a forecaster?
      </h3>
      <p className="mb-4">
        Research has shown that great forecasters come from various
        backgrounds—and oftentimes from fields that have nothing to do with
        predicting the future. Like many mental capabilities, prediction is a
        talent that persists over time and is a skill that can be developed.
        Steady quantitative feedback and regular practice can greatly improve a
        forecaster&apos;s accuracy.
      </p>
      <p className="mb-4">
        Some events — such as eclipse timing and well-polled elections, can
        often be predicted with high resolution, e.g. 99.9% likely or 3% likely.
        Others — such as the flip of a coin or a close horse-race — cannot be
        accurately predicted; but their odds still can be. Metaculus aims at
        both: to provide a central generation and aggregation point for
        predictions. With these in hand, we believe that individuals, groups,
        corporations, governments, and humanity as a whole will make better
        decisions.
      </p>
      <p className="mb-4">
        As well as being worthwhile, Metaculus aims to be interesting and fun,
        while allowing participants to hone their prediction prowess and amass a
        track-record to prove it.
      </p>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="whocreated">
        Who created Metaculus?
      </h3>
      <p className="mb-4">
        {" "}
        Metaculus originated with two researcher scientists, Anthony Aguirre and
        Greg Laughlin. Aguirre, a physicist, is a co-founder of{" "}
        <a href="https://fqxi.org/">The Foundational Questions Institute</a>,
        which catalyzes breakthrough research in fundamental physics, and of{" "}
        <a href="https://futureoflife.org/">The Future of Life Institute</a>,
        which aims to increase the benefit and safety of disruptive technologies
        like AI. Laughlin, an astrophysicist, is an expert at predictions from
        the millisecond predictions relevant to high-frequency trading to the
        ultra-long-term stability of the solar system.
      </p>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="whattournaments">
        What Are Metaculus Tournaments and Question Series?
      </h3>

      <h4 className="mb-2 mt-4 text-lg font-semibold">Tournaments</h4>
      <p className="mb-4">
        Metaculus tournaments are organized around a central topic or theme.
        Tournaments are often collaborations between Metaculus and a nonprofit,
        government agency, or other organization seeking to use forecasting to
        support effective decision making. You can find current and archived
        tournaments in our{" "}
        <a href="https://www.metaculus.com/tournaments/">Tournaments page</a>.
      </p>
      <p className="mb-4">
        Tournaments are the perfect place to prove your forecasting skills,
        while helping to improve our collective decision making ability. Cash
        prizes and{" "}
        <a href="https://www.metaculus.com/help/medals-faq/">Medals</a> are
        awarded to the most accurate forecasters, and sometimes for other
        valuable contributions (like comments). Follow a Tournament (with the
        Follow button) to never miss new questions.
      </p>
      <p className="mb-4">
        After at least one question has resolved, a Leaderboard will appear on
        the tournament page displaying current scores and rankings. A personal
        score board (&quot;My Score&quot;) will also appear, detailing your
        performance for each question (see{" "}
        <a href="https://www.metaculus.com/help/scores-faq/#tournament-scores)">
          How are Tournaments Scored?
        </a>
        .
      </p>
      <p className="mb-4">
        At the end of a tournament, the prize pool is divided among forecasters
        according to their forecasting performance. The more you forecasted and
        the more accurate your forecasts were, the greater proportion of the
        prize pool you receive.
      </p>

      <h4 className="mb-2 mt-4 text-lg font-semibold">
        Can I donate my tournament winnings?
      </h4>
      <p className="mb-4">
        If you have outstanding tournament winnings, Metaculus is happy to
        facilitate donations to various non-profits, regranting organizations,
        and funds. You can find the list of organizations we facilitate payments
        to{" "}
        <a href="https://www.metaculus.com/questions/11556/donating-tournament-prizes/">
          here
        </a>
        .
      </p>

      <h4 className="mb-2 mt-4 text-lg font-semibold">Question Series</h4>
      <p className="mb-4">
        Like Tournaments, Question Series are organized around a central topic
        or theme. Unlike tournaments, they do not have a prize pool.
      </p>
      <p className="mb-4">
        Question Series still show leaderboards, for interest and fun. However
        they do **not** award medals.
      </p>
      <p className="mb-4">
        You can find all Question Series in a special section of the{" "}
        <a href="https://www.metaculus.com/tournaments/">Tournaments page</a>.
      </p>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="predmarket">
        Is Metaculus a prediction market?
      </h3>
      <p className="mb-4">
        Sort of. Like a prediction market, Metaculus aims to aggregate many
        people&apos;s information, expertise, and predictive power into
        high-quality forecasts. However, prediction markets generally operate
        using real or virtual currency, which is used to buy and sell shares in
        &quot;event occurrence.&quot; The idea is that people buy (or sell)
        shares if they think that the standing prices reflect too low (or high)
        a probability in that event. Metaculus, in contrast, directly solicits
        predicted probabilities from its users, then aggregates those
        probabilities. We believe that this sort of &quot;prediction
        aggregator&quot; has both advantages and disadvantages relative to a
        prediction market.
      </p>

      <h4 className="mb-2 mt-4 text-lg font-semibold">
        Advantages of Metaculus over prediction markets
      </h4>
      <p className="mb-4">
        Metaculus has several advantages over prediction markets. One is that
        Metaculus forecasts are scored solely based on accuracy, while
        prediction markets may be used for other reasons, such as hedging. This
        means that sometimes prediction markets may be distorted from the true
        probability by bettors who wish to mitigate their downside risk if an
        event occurs.
      </p>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="justpolling">
        Are Metaculus Questions Polls?
      </h3>
      <p className="mb-4">
        No. Opinion polling can be a useful way to gauge the sentiment and
        changes in a group or culture, but there is often no single &quot;right
        answer&quot;, as in a{" "}
        <a href="https://news.gallup.com/poll/391547/seven-year-stretch-elevated-environmental-concern.aspx">
          Gallup poll
        </a>{" "}
        &quot;How worried are you about the environment?&quot;
      </p>

      <p className="mb-4">
        In contrast, Metaculus questions are designed to be objectively
        resolvable (like in{" "}
        <a href="https://www.metaculus.com/questions/9942/brent-oil-to-breach-140-before-may">
          Will Brent Crude Oil top $140/barrel before May 2022?
        </a>
        ), and forecasters are not asked for their preferences, but for their
        predictions. Unlike in a poll, over many predictions, participants
        accrue a track record indicating their forecasting accuracy. These track
        records are incorporated into the{" "}
        <a href="https://www.metaculus.com/help/faq/#metaculus-prediction">
          Metaculus Prediction
        </a>
        . The accuracy of the Metaculus track record itself is tracked{" "}
        <a href="https://www.metaculus.com/questions/track-record/">here</a>.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="metaculus-questions"
      >
        Metaculus Questions
      </h2>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="whatsort">
        What sorts of questions are allowed, and what makes a good question?
      </h3>
      <p className="mb-4">
        Questions should focus on tangible, objective facts about the world
        which are well-defined and not a matter of opinion. &quot;When will the
        United States collapse?&quot; is a poor, ambiguous question;{" "}
        <q>
          <a href="/questions/8579/us-freedom-in-the-world-score-in-2050/">
            What will be the US&apos; score in the Freedom in the World Report
            for 2050?
          </a>
        </q>{" "}
        is more clear and definite. They generally take the form{" "}
        <q>Will (event) X happen by (date) Y?</q> or{" "}
        <q>When will (event) X occur?</q> or{" "}
        <q>What will the value or quantity of X be by (date) Y?</q>
      </p>
      <p className="mb-4">
        A good question will be unambiguously resolvable. A community reading
        the question terms should be able to agree, before and after the event
        has occurred, whether the outcome satisfies the question&apos;s terms.
      </p>
      <p className="mb-4">Questions should also follow some obvious rules:</p>

      <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
        <li>
          Questions should respect privacy and not address the personal lives of
          non-public figures.
        </li>
        <li>
          Questions should not be directly potentially defamatory or generally
          in bad taste.
        </li>
        <li>
          Questions should never aim to predict mortality of individual people
          or even small groups. In cases of public interest (such as court
          appointees and political figures), the question should be phrased in
          other more directly relevant terms such as &quot;when will X no longer
          serve on the court&quot; or &quot;will Y be unable to run for office
          on date X&quot;. When the topic is death (or longevity) itself
          questions should treat people in aggregate or hypothetically.
        </li>
        <li>
          More generally, questions should avoid being written in a way that
          incentivizes illegal or harmful acts — that is, hypothetically, if
          someone were motivated enough by a Metaculus Question to influence the
          real world and change the outcome of a question&apos;s resolution,
          those actions should not be inherently illegal or harmful.
        </li>
      </ol>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="whocreates">
        Who creates the questions, and who decides which get posted?
      </h3>
      <p className="mb-4">
        Many questions are launched by Metaculus staff, but any logged-in user
        can propose a question. Proposed questions will be reviewed by a group
        of moderators appointed by Metaculus. Moderators will select the best
        questions submitted, and help to edit the question to be clear,
        well-sourced, and{" "}
        <a href="/question-writing/">aligned with our writing style</a>.
      </p>

      <p className="mb-4">
        Metaculus hosts questions on{" "}
        <a href="/questions/categories/">many topics</a>, but our primary focus
        areas are Science,{" "}
        <a href="https://www.metaculus.com/questions/?categories=technology">
          Technology
        </a>
        ,{" "}
        <a href="https://www.metaculus.com/questions/?tags=effective-altruism">
          Effective Altruism
        </a>
        ,{" "}
        <a href="https://www.metaculus.com/questions/?topic=ai">
          Artificial Intelligence
        </a>
        ,{" "}
        <a href="https://www.metaculus.com/questions/?topic=biosecurity">
          Health
        </a>
        , and <a href="/questions/?categories=geopolitics">Geopolitics</a>.
      </p>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="whoedits">
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
          Authors can invite other users to edit questions that are in Draft or
          Pending.
        </li>
      </ul>
      <h3 className="mb-3 mt-6 text-xl font-semibold" id="add-coauthors">
        How do I invite co-authors to my question?
      </h3>
      <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
        <li>
          When a question is a Draft or Pending review, click the &apos;Invite
          Co-authors&apos; button at the top of the page.
        </li>
        <li>
          Co-authors can edit the question, but cannot invite other co-authors
          or submit a draft for review.
        </li>
        <li>
          Note that if two writers are in the question editor at the same time,
          it&apos;s possible for one to overwrite the other&apos;s work. The
          last edit that was submitted will be saved.
        </li>
        <li>
          To leave a question you have been invited to co-author, click the
          &quot;Remove myself as Co-author&quot; button.
        </li>
      </ul>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="question-submission">
        How can I get my own question posted?
      </h3>
      <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
        <li>
          If you have a basic idea for a question but don&apos;t have
          time/energy to work out the details, you&apos;re welcome to submit it,
          discuss it in our{" "}
          <a href="/questions/956/discussion-topic-what-are-some-suggestions-for-questions-to-launch/">
            question idea thread
          </a>
          , or on our{" "}
          <a href="https://discord.gg/v2Bf5tppeT">Discord channel</a>.
        </li>
        <li>
          If you have a pretty fully-formed question, with at least a couple of
          linked references and fairly careful unambiguous resolution criteria,
          it&apos;s likely that your question will be reviewed and launched
          quickly.
        </li>
        <li>
          Metaculus hosts questions on{" "}
          <a href="/questions/categories/">many topics</a>, but our primary
          focus areas are Science,{" "}
          <a href="https://www.metaculus.com/questions/?categories=technology">
            Technology
          </a>
          ,{" "}
          <a href="https://www.metaculus.com/questions/?tags=effective-altruism">
            Effective Altruism
          </a>
          ,{" "}
          <a href="https://www.metaculus.com/questions/?topic=ai">
            Artificial Intelligence
          </a>
          ,{" "}
          <a href="https://www.metaculus.com/questions/?topic=biosecurity">
            Health
          </a>
          , and <a href="/questions/?categories=geopolitics">Geopolitics</a>.
          Questions on other topics, especially that require a lot of moderator
          effort to get launched, will be given lower priority and may be
          deferred until a later time.
        </li>
        <li>
          We regard submitted questions as suggestions and take a free hand in
          editing them. If you&apos;re worried about having your name on a
          question that is altered from what you submit, or would like to see
          the question before it&apos;s launched, please note this in the
          question itself; questions are hidden from public view until they are
          given &quot;upcoming&quot; status, and can be posted anonymously upon
          request.
        </li>
      </ol>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="pending-question">
        What can I do if a question I submitted has been pending for a long
        time?
      </h3>
      <p className="mb-4">
        We currently receive a large volume of question submissions, many of
        which are interesting and well-written. That said, we try to approve
        just enough questions that they each can get the attention they deserve
        from our forecasters. Metaculus prioritizes questions on Science,{" "}
        <a href="https://www.metaculus.com/questions/?categories=technology">
          Technology
        </a>
        ,{" "}
        <a href="https://www.metaculus.com/questions/?tags=effective-altruism">
          Effective Altruism
        </a>
        ,{" "}
        <a href="https://www.metaculus.com/questions/?topic=ai">
          Artificial Intelligence
        </a>
        ,{" "}
        <a href="https://www.metaculus.com/questions/?topic=biosecurity">
          Health
        </a>
        , and <a href="/questions/?categories=geopolitics">Geopolitics</a>. If
        your question falls into one of these categories, or is otherwise very
        urgent or important, you can tag us with @moderators to get our
        attention.
      </p>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="admins-resolution">
        What can I do if a question should be resolved but isn&apos;t?
      </h3>
      <p className="mb-4">
        If a question is still waiting for resolution, check to make sure there
        hasn&apos;t been a comment from staff explaining the reason for the
        delay. If there hasn&apos;t, you can tag @admins to alert the Metaculus
        team. Please do not use the @admins tag more than once per week
        regarding a single question or resolution.
      </p>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="question-private">
        What is a private question?
      </h3>
      <p className="mb-4">
        Private questions are questions that are not visible to the broader
        community. They aren&apos;t subject to the normal review process, so you
        can create one and predict on it right away. You can resolve your own
        private questions at any time, but points for private predictions
        won&apos;t be added to your overall Metaculus score and they won&apos;t
        affect your ranking on the leaderboard.
      </p>
      <p className="mb-4">
        You can use private questions for anything you want. Use them as
        practice to calibrate your predictions before playing for points, create
        a question series on a niche topic, or pose personal questions that only
        you can resolve.{" "}
        <strong>You can even invite up to 19 other users</strong> to view and
        predict on your own questions!
      </p>
      <p className="mb-4">
        To invite other forecasters to your private question, click the
        &apos;...&apos; more options menu and select &apos;Share Private
        Question&apos;.
      </p>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="comments">
        What are the rules and guidelines for comments and discussions?
      </h3>
      <p className="mb-4">
        We have a full set of{" "}
        <a href="/help/guidelines/">community etiquette guidelines</a> but in
        summary:
      </p>

      <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
        <li>Users are welcome comment on any question.</li>
        <li>
          Comments and questions can use{" "}
          <a href="/help/markdown/">markdown formatting</a>
        </li>
        <li>
          Metaculus aims at a high level of discourse. Comments should be on
          topic, relevant and interesting. Comments should not only state the
          author&apos;s opinion (with the exception of quantified predictions).
          Comments which are spammy, aggressive, profane, offensive, derogatory,
          or harassing are not tolerated, as well as those that are explicitly
          commercial advertising or those that are in some way unlawful. See the
          Metaculus <a href="/terms-of-use/">terms of use</a> for more
        </li>
        <li>
          You can ping other users using &quot;@username&quot;, which will send
          that user a notification (if they set that option in their
          notification settings).
        </li>
        <li>
          You are invited to upvote comments which contain relevant information
          to the question, and you can report comments that fail to uphold our{" "}
          <a href="/help/guidelines/">etiquette guidelines</a>.
        </li>
        <li>
          If a comment is spam, inappropriate/offensive, or flagrantly breaks
          our rules, please send us a report (under the &quot;...&quot;menu).
        </li>
      </ul>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="definitions">
        What do &quot;credible source&quot; and &quot;before [date X]&quot; and
        such phrases mean exactly?
      </h3>
      <p className="mb-4">
        To reduce ambiguity in an efficient way, here are some definitions that
        can be used in questions, with a meaning set by this FAQ:
      </p>
      <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
        <li>
          A &quot;credible source&quot; will be taken to be an online or
          in-print published story from a journalistic source, or information
          publicly posted on a the website of an organization by that
          organization making public information pertaining to that
          organization, or in another source where the preponderance of evidence
          suggests that the information is correct and that there is no
          significant controversy surrounding the information or its
          correctness. It will generally not include unsourced information found
          in blogs, facebook or twitter postings, or websites of individuals.
        </li>
        <li>
          The phrase &quot;Before [date X] will be taken to mean prior to the
          first moment at which [date X] would apply, in UTC. For example,
          &quot;Before 2010&quot; will be taken to mean prior to midnight
          January 1, 2010; &quot;Before June 30&quot; would mean prior to
          midnight (00:00:00) UTC June 30.
          <ul className="ml-4 mt-2 list-inside list-disc space-y-2">
            <li>
              <strong>Note:</strong> Previously this section used &quot;by [date
              x]&quot; instead of &quot;before [date x]&quot;, however
              &quot;before&quot; is much clearer and should always be used
              instead of &quot;by&quot;, where feasible.
            </li>
          </ul>
        </li>
      </ol>
      <h3 className="mb-3 mt-6 text-xl font-semibold" id="question-types">
        What types of questions are there?
      </h3>
      <h4 className="mb-2 mt-4 text-lg font-semibold">Binary Questions</h4>
      <p className="mb-4">
        Binary questions can resolve as either <strong>Yes</strong> or{" "}
        <strong>No</strong> (unless the resolution criteria were underspecified
        or otherwise circumvented, in which case they can resolve as{" "}
        <strong>Ambiguous</strong>). Binary questions are appropriate when an
        event can either occur or not occur. For example, the question &quot;
        <a href="https://www.metaculus.com/questions/6296/us-unemployment-above-5-through-nov-2021/">
          Will the US unemployment rate stay above 5% through November 2021?
        </a>
        &quot; resolved as <strong>No</strong> because the unemployment rate
        dropped below 5% before the specified time.
      </p>

      <h4 className="mb-2 mt-4 text-lg font-semibold">Range Questions</h4>
      <p className="mb-4">
        Range questions resolve to a certain value, and forecasters can specify
        a probability distribution to estimate the likelihood of each value
        occurring. Range questions can have open or closed bounds. If the bounds
        are closed, probability can only be assigned to values that fall within
        the bounds. If one or more of the bounds are open, forecasters may
        assign probability outside the boundary, and the question may resolve as
        outside the boundary. <a href="#out-of-bounds-resolution">See here</a>{" "}
        for more details about boundaries on range questions.
      </p>
      <p className="mb-4">
        The range interface allows you to input multiple probability
        distributions with different weights.{" "}
        <a href="#range-interface">See here</a> for more details on using the
        interface.
      </p>
      <p className="mb-4">
        There are two types of range questions, numeric range questions and date
        range questions.
      </p>

      <h5 className="mb-2 mt-4 text-lg font-semibold">Numeric Range</h5>
      <p className="mb-4">
        Numeric range questions can resolve as a numeric value. For example, the
        question &quot;
        <a href="https://www.metaculus.com/questions/7346/initial-jobless-claims-july-2021/">
          What will be the 4-week average of initial jobless claims (in
          thousands) filed in July 2021?
        </a>
        &quot; resolved as <strong>395</strong>, because the underlying source
        reported 395 thousand initial jobless claims for July 2021.
      </p>
      <p className="mb-4">
        Questions can also resolve outside the numeric range. For example, the
        question &quot;
        <a href="https://www.metaculus.com/questions/6645/highest-us-core-cpi-growth-in-2021/">
          What will the highest level of annualised core US CPI growth be, in
          2021, according to U.S. Bureau of Labor Statistics data?
        </a>
        &quot; resolved as <strong>&gt; 6.5</strong> because the underlying
        source reported more than 6.5% annualized core CPI growth in the US, and
        6.5 was the upper bound.
      </p>

      <h5 className="mb-2 mt-4 text-lg font-semibold">Date Range</h5>
      <p className="mb-4">
        Date range questions can resolve as a certain date. For example, the
        question &quot;
        <a href="https://www.metaculus.com/questions/8723/date-of-next-who-pheic-declaration/">
          When will the next Public Health Emergency of International Concern be
          declared by the WHO?
        </a>
        &quot; resolved as <strong>July 23, 2022</strong>, because a Public
        Health Emergency of International Concern was declared on that date.
      </p>
      <p className="mb-4">
        Questions can also resolve outside the date range. For example, the
        question &quot;
        <a href="https://www.metaculus.com/questions/6947/first-super-heavy-flight/">
          When will a SpaceX Super Heavy Booster fly?
        </a>
        &quot; resolved as <strong>&gt; March 29, 2022</strong> because a SpaceX
        Super Heavy booster was not launched before March 29, 2022, which was
        the upper bound.
      </p>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="question-groups">
        What are question groups?
      </h3>
      <p className="mb-4">
        Question groups are sets of closely related questions or question
        outcomes all collected on a single page. Forecasters can predict quickly
        and efficiently on these interconnected outcomes, confident that they
        are keeping all of their predictions internally consistent.
      </p>

      <h4 className="mb-2 mt-4 text-lg font-semibold">
        How do question groups facilitate more efficient, more accurate
        forecasting?
      </h4>
      <p className="mb-4">
        With question groups, it&apos;s easy to forecast progressively wider
        distributions the further into the future you predict to reflect
        increasing uncertainty. A question group collecting multiple binary
        questions on a limited set of outcomes or on mutually exclusive outcomes
        makes it easier to see which forecasts are in tension with each other.
      </p>

      <h4 className="mb-2 mt-4 text-lg font-semibold">
        What happens to the existing question pages when they are combined in a
        question group?
      </h4>
      <p className="mb-4">
        When regular forecast questions are converted into
        &quot;subquestions&quot; of a question group, the original pages are
        replaced by a single question group page. Comments that previously lived
        on the individual question pages are moved to the comment section of the
        newly created group page with a note indicating the move.
      </p>

      <h4 className="mb-2 mt-4 text-lg font-semibold">
        Do I need to forecast on every outcome / subquestion of a question
        group?
      </h4>
      <p className="mb-4">
        No. Question groups comprise multiple <i>independent</i> subquestions.
        For that reason, there is no requirement that you forecast on every
        outcome within a group.
      </p>

      <h4 className="mb-2 mt-4 text-lg font-semibold">
        How are question groups scored?
      </h4>
      <p className="mb-4">
        Each outcome or subquestion is scored in the same manner as a normal
        independent question.
      </p>

      <h4 className="mb-2 mt-4 text-lg font-semibold">
        Why don&apos;t question group outcome probabilities sum to 100%?
      </h4>
      <p className="mb-4">
        Even if there can only be one outcome for a particular question group,
        the Community and Metaculus Predictions function as they would for
        normal independent questions. The Community and Metaculus Predictions
        will still display a median or a weighted aggregate of the forecasts on
        each subquestion, respectively. These medians and weighted aggregates
        are not constrained to sum to 100%
      </p>
      <p className="mb-4">
        Feedback for question groups can be provided on the{" "}
        <a href="https://www.metaculus.com/questions/9861/2022-3-9-update-forecast-question-groups/">
          question group discussion post
        </a>
        .
      </p>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="conditionals">
        What are Conditional Pairs?
      </h3>
      <p className="mb-4">
        A Conditional Pair is a special type of{" "}
        <a href="https://www.metaculus.com/help/faq/#question-groups">
          Question Group
        </a>{" "}
        that elicits{" "}
        <a href="https://en.wikipedia.org/wiki/Conditional_probability">
          conditional probabilities
        </a>
        . Each Conditional Pair sits between a Parent Question and a Child
        Question. Both Parent and Child must be existing Metaculus{" "}
        <a href="https://www.metaculus.com/help/faq/#question-types">
          Binary Questions
        </a>
        .
      </p>

      <p className="mb-4">
        Conditional Pairs ask two Conditional Questions (or
        &quot;Conditionals&quot; for short), each corresponding to a possible
        outcome of the Parent:
      </p>

      <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
        <li>If the Parent resolves Yes, how will the Child resolve?</li>
        <li>If the Parent resolves No, how will the Child resolve?</li>
      </ol>

      <p className="mb-4">
        The first Conditional assumes that &quot;The Parent resolves Yes&quot;
        (or &quot;if Yes&quot; for short). The second conditional does the same
        for No.
      </p>

      <p className="mb-4">
        Conditional probabilities are probabilities, so forecasting is very
        similar to Binary Questions. The main difference is that we present both
        conditionals next to each other for convenience:
      </p>

      <img
        src="https://metaculus-public.s3.us-west-2.amazonaws.com/conditional_faq_2.jpg"
        alt="The two conditionals next to each other"
        className="mb-4"
      />

      <p className="mb-4">
        Conditional questions are automatically resolved when their Parent and
        Child resolve:
      </p>

      <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
        <li>
          When the Parent resolves Yes, the &quot;if No&quot; Conditional is{" "}
          <a href="https://www.metaculus.com/help/faq/#ambiguous-annulled">
            Annulled
          </a>
          . (And vice versa.)
        </li>
        <li>
          When the Child resolves, the Conditional that was not annulled
          resolves to the same value.
        </li>
      </ul>

      <p className="mb-4">Let&apos;s work through an example:</p>

      <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
        <li>The Parent is &quot;Will it rain today?&quot;.</li>
        <li>The Child is &quot;Will it rain tomorrow?&quot;.</li>
      </ul>

      <p className="mb-4">
        So the two Conditionals in the Conditional Pair will be:
      </p>

      <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
        <li>&quot;If it rains today, will it rain tomorrow?&quot;</li>
        <li>&quot;If it does not rain today, will it rain tomorrow?&quot;</li>
      </ol>

      <p className="mb-4">
        For simplicity, Metaculus presents conditional questions graphically. In
        the forecasting interface they are in a table:
      </p>

      <img
        src="https://metaculus-public.s3.us-west-2.amazonaws.com/conditional_faq_3.jpg"
        alt="The Conditional Pair forecasting interface"
        className="mb-4"
      />

      <p className="mb-4">
        And in the feeds, each possible outcome of the Parent is an arrow, and
        each conditional probability is a bar:
      </p>

      <img
        src="https://metaculus-public.s3.us-west-2.amazonaws.com/conditional_faq_1.jpg"
        alt="The Conditional Pair feed tile"
        className="mb-4"
      />

      <p className="mb-4">Back to the example:</p>

      <p className="mb-4">
        It rains today. The parent resolves Yes. This triggers the second
        conditional (&quot;if No&quot;) to be annulled. It is not scored.
      </p>

      <p className="mb-4">
        You wait a day. This time it doesn&apos;t rain. The Child resolves No.
        This triggers the remaining Conditional (&quot;if Yes&quot;) to resolve
        No. It is scored like a normal Binary Question.
      </p>

      <h4 className="mb-2 mt-4 text-lg font-semibold">
        How do I create conditional pairs?
      </h4>
      <p className="mb-4">
        You can create and submit conditional pairs like any other question
        type. On the &apos;
        <a href="https://www.metaculus.com/questions/create/">
          Create a Question
        </a>
        &apos; page, select Question Type &apos;conditional pair&apos; and
        select Parent and Child questions.
      </p>

      <p className="mb-4">
        Note: You can use question group subquestions as the Parent or Child by
        clicking the Parent or Child button and then either searching for the
        subquestion in the field or pasting the URL for the subquestion.
      </p>

      <p className="mb-4">
        To copy the URL for a subquestion, simply visit a question group page
        and click the &apos;...&apos; more options menu to reveal the Copy Link
        option.
      </p>

      <h3
        className="mb-3 mt-6 text-xl font-semibold"
        id="navigation-and-filtering"
      >
        How do I find certain questions on Metaculus?
      </h3>
      <p className="mb-4">
        Questions on Metaculus are sorted by activity by default. Newer
        questions, questions with new comments, recently upvoted questions, and
        questions with many new predictions will appear at the top of the{" "}
        <a href="https://www.metaculus.com/questions/">Metaculus homepage</a>.
        However, there are several additional ways to find questions of interest
        and customize the way you interact with Metaculus.
      </p>

      <h4 className="mb-2 mt-4 text-lg font-semibold" id="search-bar">
        Search Bar
      </h4>
      <p className="mb-4">
        The search bar can be used to find questions using keywords and semantic
        matches. At this time it cannot search comments or users.
      </p>

      <h4 className="mb-2 mt-4 text-lg font-semibold" id="filters">
        Filters
      </h4>
      <p className="mb-4">
        Questions can be sorted and filtered in a different manner from the
        default using the filters menu. Questions can be filtered by type,
        status and participation. Questions can also be ordered, for example by
        &quot;Newest&quot;. Note that the options available change when
        different filters are selected. For example, if you filter by
        &quot;Closed&quot; questions you will then be shown an option to order
        by &quot;Soonest Resolving&quot;.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="question-resolution"
      >
        Question Resolution
      </h2>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="closers">
        What are the &quot;open date&quot;, &quot;close date&quot; and
        &quot;resolve date?&quot;
      </h3>
      <p className="mb-4">
        When submitting a question, you are asked to specify the closing date
        (when the question is no longer available for predicting) and resolution
        date (when the resolution is expected to occur). The date the question
        is set live for others to forecast on is known as the open date.
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
          The <strong>resolution date</strong> is the date when the event being
          predicted is expected to have definitively occurred (or not). This
          date lets Metaculus Admins know when the question might be ready for
          resolution. However, this is often just a guess, and is not binding in
          any way.
        </li>
      </ul>
      <p className="mb-4">
        In some cases, questions must resolve at the resolution date according
        to the best available information. In such cases, it becomes important
        to choose the resolution date carefully. Try to set resolution dates
        that make for interesting and insightful questions! The date or time
        period the question is asking about must always be explicitly mentioned
        in the text (for example, &quot;this question resolves as the value of X
        on January 1, 2040, according to source Y&quot; or &quot;this question
        resolves as <strong>Yes</strong> if X happens before January 1,
        2040)&quot;.
      </p>
      <p className="mb-4">
        The close date <em>must</em> be at least one hour prior to the
        resolution date, but can be much earlier, depending upon the context.
        Here are some guidelines for specifying the close date:
      </p>
      <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
        <li>
          If the outcome of the question will very likely or assuredly be
          determined at a fixed known time, then the closing time should be
          immediately before this time, and the resolution time just after that.
          (Example: a scheduled contest between competitors or the release of
          scheduled data)
        </li>
        <li>
          If the outcome of a question will be determined by some process that
          will occur at an unknown time, but the outcome is likely to be
          independent of this time, then it should be specified that the
          question{" "}
          <a href="https://www.metaculus.com/help/faq/#retroactive-closure">
            retroactively closes
          </a>{" "}
          some appropriate time before the process begins. (Example: success of
          a rocket launch occurring at an unknown time)
        </li>
        <li>
          If the outcome of a question depends on a discrete event that may or
          may not happen, the close time should be specified as shortly before
          the resolve time. The resolve time is chosen based on author
          discretion of the period of interest.
        </li>
      </ul>
      <p className="mb-4">
        <strong>Note:</strong> Previous guidance suggested that a question
        should close between 1/2 to 2/3 of the way between the open time and
        resolution time. This was necessary due to the scoring system at the
        time, but has been replaced by the above guidelines due to an{" "}
        <a href="https://www.metaculus.com/questions/10801/discontinuing-the-final-forecast-bonus/">
          update to the scoring system
        </a>
        .
      </p>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="timezone">
        What timezone is used for questions?
      </h3>
      <p className="mb-4">
        For dates and times written in the question, such as &quot;will event X
        happen before January 1, 2030?&quot;, if the timezone is not specified{" "}
        <a href="https://en.wikipedia.org/wiki/Coordinated_Universal_Time">
          Coordinated Universal Time (UTC)
        </a>{" "}
        will be used. Question authors are free to specify a different timezone
        in the resolution criteria, and any timezone specified in the text will
        be used.
      </p>
      <p className="mb-4">
        For{" "}
        <a href="https://www.metaculus.com/help/faq/#question-types">
          date range
        </a>{" "}
        questions, the dates on the interface are in UTC. Typically the time of
        day makes little difference as one day is miniscule in comparison to the
        full range, but occasionally for shorter term questions the time of day
        might materially impact scores. If it is not clear what point in a
        specified period a date range question will be resolved as, it resolves
        as the{" "}
        <a href="https://www.metaculus.com/help/faq/#whenresolve">
          midpoint of that period
        </a>
        . For example, if a question says it will resolve as a certain day, but
        not what time of day, it will resolve as noon UTC on that day.
      </p>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="who-resolves">
        Who decides the resolution to a question?
      </h3>
      <p className="mb-4">
        Only Metaculus Administrators can resolve questions. Binary questions
        can resolve <strong>Yes</strong>, <strong>No</strong>,{" "}
        <a href="https://www.metaculus.com/help/faq/#ambiguous-annulled">
          Ambiguous, or Annuled
        </a>
        . Range questions can resolve to a specific value, an out-of-bounds
        value,{" "}
        <a href="https://www.metaculus.com/help/faq/#ambiguous-annulled">
          Ambiguous, or Annuled
        </a>
        .
      </p>

      <h3 className="mb-3 mt-6 text-xl font-semibold" id="ambiguous-annulled">
        What are &quot;Ambiguous&quot; and &quot;Annulled&quot; resolutions?
      </h3>
      <p className="mb-4">
        Sometimes a question cannot be resolved because the state of the world,
        the <q>truth of the matter</q>, is too uncertain. In these cases, the
        question is resolved as Ambiguous.
      </p>
      <p className="mb-4">
        Other times, the state of the world is clear, but a key assumption of
        the question was overturned. In these cases, the question is Annulled.
      </p>
      <p className="mb-4">
        In the same way, when a Conditional turns out to be based on an outcome
        that did not occur, it is Annulled. For example, when a{" "}
        <a href="https://www.metaculus.com/help/faq/#conditionals">
          Conditional Pair
        </a>
        &apos;s parent resolves Yes, the <q>if No</q> Conditional is Annulled.
      </p>
      <p className="mb-4">
        When questions are Annulled or resolved as Ambiguous, they are no longer
        open for forecasting, and they are not scored.
      </p>
      <p className="mb-4">
        <em>
          If you&apos;d like to read more about why Ambiguous and Annulled
          resolutions are necessary you can expand the section below.
        </em>
      </p>

      <div className="mb-4">
        <p className="cursor-pointer font-semibold">
          Reasons for Ambiguous and Annulled resolutions
        </p>
        <div className="mt-2">
          <h3 className="mb-2 mt-4 text-lg font-semibold" id="reason-annulled">
            Why was this question Annulled or resolved as Ambiguous?
          </h3>
          <p className="mb-4">
            An Ambiguous or Annulled resolution generally implies that there was
            some inherent ambiguity in the question, that real-world events
            subverted one of the assumptions of the question, or that there is
            not a clear consensus as to what in fact occurred. Metaculus strives
            for satisfying resolutions to all questions, and we know that
            Ambiguous and Annulled resolutions are disappointing and
            unsatisfying. However, when resolving questions we have to consider
            factors such as fairness to all participating forecasters and the
            underlying incentives toward accurate forecasting.
          </p>
          <p className="mb-4">
            To avoid this unfairness and provide the most accurate information,
            we resolve all questions in accordance with the actual written text
            of the resolution criteria whenever possible. By adhering as closely
            as possible to a reasonable interpretation of what&apos;s written in
            the resolution criteria, we minimize the potential for forecasters
            to arrive at different interpretations of what the question is
            asking, which leads to fairer scoring and better forecasts. In cases
            where the outcome of a question does not clearly correspond to the
            direction or assumptions of the text of the resolution criteria,
            Ambiguous resolution or Annulling the question allows us to preserve
            fairness in scoring.
          </p>

          <h3 className="mb-2 mt-4 text-lg font-semibold" id="types-annulled">
            Types of Ambiguous or Annulled Resolutions
          </h3>
          <p className="mb-4">
            A question&apos;s resolution criteria can be thought of as akin to a
            legal contract. The resolution criteria create a shared
            understanding of what forecasters are aiming to predict, and define
            the method by which they agree to be scored for accuracy when
            choosing to participate. When two forecasters who have diligently
            read the resolution criteria of a question come away with
            significantly different perceptions about the meaning of that
            question, it creates unfairness for at least one of these
            forecasters. If both perceptions are reasonable interpretations of
            the text, then one of these forecasters will likely receive a poor
            score at resolution time through no fault of their own.
            Additionally, the information provided by the forecasts on the
            question will be poor due to the differing interpretations.
          </p>
          <p className="mb-4">
            The following sections provide more detail about common reasons we
            resolve questions as Ambiguous or Annul them and some examples. Some
            of these examples could fit into multiple categories, but we&apos;ve
            listed them each in one main category as illustrative examples. This
            list of types of Ambiguous or Annulled resolutions is not exhaustive
            &mdash; there are other reasons that a question may resolve
            Ambiguous or be Annulled &mdash; but these cover some of the more
            common and some of the trickier scenarios. Here&apos;s a condensed
            version, but read on for more details:
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
                <strong>.</strong> There is not enough information available to
                arrive at an appropriate resolution.
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
                  <strong>Imbalanced outcomes and consistent incentives</strong>
                </a>
                <strong>.</strong> The binary question did not adequately
                specify a means for either Yes or No resolution, leading to
                imbalanced outcomes and bad incentives.
              </li>
            </ul>
          </ul>
          <p className="mb-4">
            <strong>Note:</strong> Previously Metaculus only had one resolution
            type &mdash; Ambiguous &mdash; for cases where a question could not
            otherwise be resolved. We&apos;ve since separated these into two
            types &mdash; Ambiguous and Annulled &mdash; to provide clarity on
            the reason that a question could not otherwise be resolved.
            Annulling questions first became an option in April of 2023.
          </p>

          <h4
            className="mb-2 mt-4 text-lg font-semibold"
            id="ambiguous-details"
          >
            Ambiguous Resolution
          </h4>
          <p className="mb-4">
            Ambiguous resolution is reserved for questions where reality is not
            clear. Either because reporting about an event is conflicted or
            unclear about what actually happened, or available material is
            silent on the information being sought. We&apos;ve described the
            types of questions where Ambiguous resolution is appropriate as
            those with <a href="#no-clear-consensus">No Clear Consensus</a>.
          </p>

          <h5
            className="mb-2 mt-4 text-lg font-semibold"
            id="no-clear-consensus"
          >
            No Clear Consensus
          </h5>
          <p className="mb-4">
            Questions can also resolve Ambiguous when there is not enough
            information available to arrive at an appropriate resolution. This
            can be because of conflicting or unclear media reports, or because a
            data source that was expected to provide resolution information is
            no longer available. The following are some examples where there was
            no clear consensus.
          </p>
          <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
            <li>
              <a href="https://www.metaculus.com/questions/9459/russian-troops-in-kiev-in-2022/">
                <strong>
                  <em>
                    Will Russian troops enter Kyiv, Ukraine before December 31,
                    2022?
                  </em>
                </strong>
              </a>
            </li>
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
                <a href="https://www.metaculus.com/questions/9459/russian-troops-in-kiev-in-2022/#comment-93915">
                  As an Admin explains here
                </a>
                , due to the uncertainty around events in February the question
                could not remain open to see if a qualifying event would happen
                before the end of 2022. This is because the ambiguity around the
                events in February would necessitate that the question could
                only resolve as Yes or Ambiguous, which creates an incentive to
                forecast confidently in an outcome of Yes.
              </li>
            </ul>
            <li>
              <a
                href="https://www.metaculus.com/questions/10134/average-ransomware-kit-cost-in-2022/"
                target="_blank"
                rel="noopener"
              >
                <strong>
                  <em>
                    What will the average cost of a ransomware kit be in 2022?
                  </em>
                </strong>
              </a>
            </li>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                This question relied on data published in a report by Microsoft,
                however Microsoft&apos;s report for the year in question no
                longer contained the relevant data. It&apos;s{" "}
                <a href="https://www.metaculus.com/help/faq/#ressrc">
                  Metaculus policy
                </a>{" "}
                that by default if a resolution source is not available
                Metaculus may use a functionally equivalent source in its place
                unless otherwise specified in the resolution text, but for this
                question a search for alternate sources did not turn anything
                up, leading to Ambiguous resolution.
              </li>
            </ul>
          </ul>
        </div>
      </div>
      <h5 className="mb-2 mt-4 text-lg font-semibold" id="no-clear-consensus">
        No Clear Consensus
      </h5>
      <p className="mb-4">
        Questions can also resolve Ambiguous when there is not enough
        information available to arrive at an appropriate resolution. This can
        be because of conflicting or unclear media reports, or because a data
        source that was expected to provide resolution information is no longer
        available. The following are some examples where there was no clear
        consensus.
      </p>
      <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
        <li>
          <a href="https://www.metaculus.com/questions/9459/russian-troops-in-kiev-in-2022/">
            <strong>
              <em>
                Will Russian troops enter Kyiv, Ukraine before December 31,
                2022?
              </em>
            </strong>
          </a>
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
              <a href="https://www.metaculus.com/questions/9459/russian-troops-in-kiev-in-2022/#comment-93915">
                As an Admin explains here
              </a>
              , due to the uncertainty around events in February the question
              could not remain open to see if a qualifying event would happen
              before the end of 2022. This is because the ambiguity around the
              events in February would necessitate that the question could only
              resolve as Yes or Ambiguous, which creates an incentive to
              forecast confidently in an outcome of Yes.
            </li>
          </ul>
        </li>
        <li>
          <a
            href="https://www.metaculus.com/questions/10134/average-ransomware-kit-cost-in-2022/"
            target="_blank"
            rel="noopener"
          >
            <strong>
              <em>
                What will the average cost of a ransomware kit be in 2022?
              </em>
            </strong>
          </a>
          <ul className="ml-4 list-inside list-disc space-y-2">
            <li>
              This question relied on data published in a report by Microsoft,
              however Microsoft&apos;s report for the year in question no longer
              contained the relevant data. It&apos;s{" "}
              <a href="https://www.metaculus.com/help/faq/#ressrc">
                Metaculus policy
              </a>{" "}
              that by default if a resolution source is not available Metaculus
              may use a functionally equivalent source in its place unless
              otherwise specified in the resolution text, but for this question
              a search for alternate sources did not turn anything up, leading
              to Ambiguous resolution.
            </li>
          </ul>
        </li>
      </ul>

      <h4 className="mb-2 mt-4 text-lg font-semibold" id="annulment-details">
        Annulment
      </h4>
      <p className="mb-4">
        Annulling a question is reserved for situations where reality is clear
        but the question is not. In other words, the question failed to
        adequately capture a method for clear resolution.
      </p>
      <p className="mb-4">
        <strong>Note:</strong> Annulment was introduced in April of 2023, so
        while the following examples describe Annulment the questions in
        actuality were resolved as Ambiguous.
      </p>

      <h5
        className="mb-2 mt-4 text-lg font-semibold"
        id="annulled-underspecified"
      >
        The Question Was Underspecified
      </h5>
      <p className="mb-4">
        Writing good forecasting questions is hard, and it only gets harder the
        farther the question looks into the future. To fully eliminate the
        potential for a question to be Annulled the resolution criteria must
        anticipate all the possible outcomes that could occur in the future; in
        other words, there must be clear direction for how the question resolves
        in every possible outcome. Most questions, even very well-crafted ones,
        can&apos;t consider <em>every</em> possible outcome. When an outcome
        occurs that does not correspond to the instructions provided in the
        resolution criteria of the question then that question may have to be
        Annulled. In some cases we may be able to find an interpretation that is
        clearly an appropriate fit for the resolution criteria, but this is not
        always possible.
      </p>
      <p className="mb-4">
        Here are some examples of Annulment due to underspecified questions:
      </p>
      <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
        <li>
          <a href="https://www.metaculus.com/questions/12433/substacks-google-trends-at-end-of-2022/">
            <strong>
              <em>
                What will Substack&apos;s Google Trends index be at end of 2022?
              </em>
            </strong>
          </a>
          <ul className="ml-4 list-inside list-disc space-y-2">
            <li>
              This question did not clearly specify how Google trends would be
              used to arrive at the average index for December of 2022, because
              the index value depends on the date range specified in Google
              Trends. An Admin provided more details in{" "}
              <a href="https://www.metaculus.com/questions/12433/substacks-google-trends-at-end-of-2022/#comment-112592">
                this comment
              </a>
              .
            </li>
          </ul>
        </li>
        <li>
          <a href="https://www.metaculus.com/questions/3727/when-will-a-fusion-reactor-reach-ignition/">
            <strong>
              <em>When will a fusion reactor reach ignition?</em>
            </strong>
          </a>
          <ul className="ml-4 list-inside list-disc space-y-2">
            <li>
              This question did not clearly define what was meant by
              &ldquo;ignition&rdquo;. As an Admin described in{" "}
              <a href="https://www.metaculus.com/questions/3727/when-will-a-fusion-reactor-reach-ignition/#comment-110164">
                this comment
              </a>
              , the definition of ignition may vary depending on the researchers
              using it and the fusion method, as well as the reference frame for
              what counts as an energy input and output.
            </li>
          </ul>
        </li>
        <li>
          <a href="https://www.metaculus.com/questions/12532/russia-general-mobilization-before-2023/">
            <strong>
              <em>
                Will Russia order a general mobilization by January 1, 2023?
              </em>
            </strong>
          </a>
          <ul className="ml-4 list-inside list-disc space-y-2">
            <li>
              This question asked about Russia ordering a general mobilization,
              but the difficult task of determining that a general mobilization
              was ordered was not adequately addressed in the resolution
              criteria. The text of the question asked about a &ldquo;general
              mobilization&rdquo;, but the definitions used in the resolution
              criteria differed from the common understanding of a
              &ldquo;general mobilization&rdquo; and didn&rsquo;t adequately
              account for the actual partial mobilization that was eventually
              ordered, as{" "}
              <a href="https://www.metaculus.com/questions/12532/russia-general-mobilization-before-2023/">
                explained by an Admin here
              </a>
              .
            </li>
          </ul>
        </li>
      </ul>

      <h5 className="mb-2 mt-4 text-lg font-semibold" id="annulled-subverted">
        The Assumptions of the Question Were Subverted
      </h5>
      <p className="mb-4">
        Questions often contain assumptions in their resolution criteria, many
        of which are unstated. For example, assuming that the underlying
        methodology of a data source will remain the same, assuming that an
        organization will provide information about an event, or assuming that
        an event would play out a certain way. The best practice is to specify
        what happens in the event certain assumptions are violated (including by
        specifying that the question will be Annulled in certain situations) but
        due to the difficulty in anticipating these outcomes this isn&apos;t
        always done.
      </p>
      <p className="mb-4">
        Here are some examples of Annulment due to subverted assumptions:
      </p>
      <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
        <li>
          <a href="https://www.metaculus.com/questions/10444/cause-of-flight-5735-crash/">
            <strong>
              <em>
                Will a technical problem be identified as the cause of the crash
                of China Eastern Airlines Flight 5735?
              </em>
            </strong>
          </a>
          <ul className="ml-4 list-inside list-disc space-y-2">
            <li>
              This question relied on the conclusions of a future National
              Transportation Safety Board (NTSB) report. However, it was a
              Chinese incident so it was unlikely that the NTSB would publish
              such a report. Additionally, the question did not specify a date
              by which the report must be published resulting in a resolution of
              No. Since this was not specified and the assumption of a future
              NTSB report was violated the question was Annulled, as{" "}
              <a href="https://www.metaculus.com/questions/10444/cause-of-flight-5735-crash/">
                explained by an Admin here
              </a>
              .
            </li>
          </ul>
        </li>
        <li>
          <a href="https://www.metaculus.com/questions/6249/november-2021-production-of-semiconductors/">
            <strong>
              <em>
                What will the Federal Reserves&apos; Industrial Production Index
                be for November 2021, for semiconductors, printed circuit boards
                and related products?
              </em>
            </strong>
          </a>
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
          <a href="https://www.metaculus.com/questions/10048/russia-to-return-to-nuclear-level-1/">
            <strong>
              <em>
                When will Russia&apos;s nuclear readiness scale return to Level
                1?
              </em>
            </strong>
          </a>
          <ul className="ml-4 list-inside list-disc space-y-2">
            <li>
              Media reporting about Russia&apos;s nuclear readiness level gave
              the impression that the level had been changed to level 2, leading
              to the creation of this question. However, a more thorough
              investigation found that Russia&apos;s nuclear readiness most
              likely did not change. This violated the assumption of the
              question leading to the question being Annulled, as{" "}
              <a href="https://www.metaculus.com/questions/10048/russia-to-return-to-nuclear-level-1/#comment-100275">
                explained by an Admin here
              </a>
              .
            </li>
          </ul>
        </li>
        <li>
          <a href="https://www.metaculus.com/questions/9000/us-social-cost-of-carbon-in-2022/">
            <strong>
              <em>
                What will be the Biden Administration&apos;s social cost of 1
                ton of CO2 in 2022?
              </em>
            </strong>
          </a>
          <ul className="ml-4 list-inside list-disc space-y-2">
            <li>
              This question specified that it would resolve according to a
              report published by the US Interagency Working Group (IWG),
              however the IWG did not publish an estimate before the end of
              2022. This question anticipated this outcome and appropriately
              specified that it should be Annulled if no report was published
              before the end of 2022, and the question was resolved accordingly.
            </li>
          </ul>
        </li>
      </ul>

      <h5 className="mb-2 mt-4 text-lg font-semibold" id="annulled-imbalanced">
        Imbalanced Outcomes and Consistent Incentives
      </h5>
      <p className="mb-4">
        Sometimes questions imply imbalanced outcomes, for example where the
        burden of proof for an event to be considered to have occurred is high
        and tips the scales toward a binary question resolving No, or where the
        question would require a substantial amount of research to surface
        information showing that an event occurred, which also favors a
        resolution of No. In certain circumstances these kinds of questions are
        okay, so long as there is a clear mechanism for the question to resolve
        as Yes and to resolve as No. However, sometimes questions are formulated
        such that there&apos;s no clear mechanism for a question to resolve as
        No, leading to the only realistic outcomes being a resolution of Yes or
        Annulled. This creates a bias in the question and also produces bad
        incentives if the question isn&apos;t Annulled.
      </p>
      <p className="mb-4">
        The case of imbalanced outcomes and consistent incentives is best
        explained with examples, such as the following:
      </p>
      <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
        <li>
          <a href="https://www.metaculus.com/questions/6047/1m-lost-in-prediction-market/">
            <strong>
              <em>
                Will any prediction market cause users to lose at least $1M
                before 2023?
              </em>
            </strong>
          </a>
          <ul className="ml-4 list-inside list-disc space-y-2">
            <li>
              This question asks whether certain incidents such as hacking,
              scams, or incorrect resolution lead to users losing $1 million or
              more from a prediction market. However, there&apos;s no clear
              mechanism specified to find information about this, as prediction
              markets aren&apos;t commonly the subject of media reports.
              Concretely proving that this did not occur would require extensive
              research. This creates an imbalance in the resolution criteria.
              The question would resolve as Yes if there was a clear report from
              credible sources that this occurred. However, to resolve as No it
              would require extensive research to confirm that it didn&apos;t
              occur and a knowledge of the happenings in prediction markets that
              most people do not possess. To resolve as No Metaculus would
              either have to do an absurd amount of research, or assume that a
              lack of prominent reports on the topic is sufficient to resolve as
              No. In this case the question had to be Annulled.
            </li>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Now consider if there had been a clear report that this had
                actually occurred. In a world where that happened the question
                could arguably have been resolved as Yes. However, savvy users
                who follow our methods on Metaculus might realize that when a
                mechanism for a No resolution is unclear, that the question will
                then resolve as Yes or be Annulled. This creates bad incentives,
                as these savvy forecasters might begin to raise the likelihood
                of Yes resolution on future similar forecasts as they
                meta-predict how Metaculus handles these questions. For this
                reason, binary questions must have a clear mechanism for how
                they resolve as both Yes and No. If the mechanism is unclear,
                then it can create bad incentives. Any questions without a clear
                mechanism to resolve as both possible outcomes should be
                Annulled, even if a qualifying event occurs that would resolve
                the question as Yes.
              </li>
            </ul>
          </ul>
        </li>
        <li>
          <a href="https://www.metaculus.com/questions/13521/any-ftx-depositor-to-get-anything-out-by-2023/">
            <strong>
              <em>
                Will any remaining FTX depositor withdraw any amount of
                tradeable assets from FTX before 2023?
              </em>
            </strong>
          </a>
          <ul className="ml-4 list-inside list-disc space-y-2">
            <li>
              This question asked if an FTX depositor would withdraw assets
              where the withdrawal was settled by FTX. Unfortunately this
              question required a knowledge of the details of FTX withdrawals
              that was unavailable to Admins, resulting in there being no real
              mechanism to resolve the question as No. This led to an imbalance
              in possible outcomes, where the question could only truly resolve
              as Yes or be Annulled. The imbalance necessitated that the
              question be resolved as Ambiguous to preserve consistent
              incentives for forecasting.
            </li>
          </ul>
        </li>
      </ul>
    </PageWrapper>
  );
}
