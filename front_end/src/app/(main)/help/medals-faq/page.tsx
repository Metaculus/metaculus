import Link from "next/link";

import KatexRenderer from "@/components/katex_renderer";

import PageWrapper from "../../components/pagewrapper";

export const metadata = {
  title: "Medals FAQ | Metaculus",
  description:
    "Learn about Metaculus (overview), how they are awarded for forecasting accuracy, comment quality, and question writing. Understand the h-index, medal tiers, and eligibility criteria.",
};

export default function MedalsFAQ() {
  return (
    <PageWrapper>
      <h1>Medals FAQ</h1>
      <p>
        Below are Frequently Asked Questions (and answers!) about medals. The
        general FAQ is <Link href="/faq/">here</Link>, and the scores FAQ is{" "}
        <Link href="/help/scores-faq/">here</Link>.
      </p>

      <div className="table-of-contents">
        <ul className="space-y-1">
          <li>
            <a href="#metaculus-medals">What are Metaculus medals?</a>
          </li>
          <li>
            <a href="#baseline-medals">What are Baseline Accuracy medals?</a>
          </li>
          <li>
            <a href="#peer-medals">What are Peer Accuracy medals?</a>
          </li>
          <li>
            <a href="#tournament-medals">What are tournament medals?</a>
          </li>
          <li>
            <a href="#comments-medals">What are Comments medals?</a>
          </li>
          <li>
            <a href="#question-writing-medals">
              What are Question Writing medals?
            </a>
          </li>
          <li>
            <a href="#writing-time-periods">
              What is the time period for Comments & Question writing medals?
            </a>
          </li>
          <li>
            <a href="#scores-time-periods">
              What is the time period for Baseline & Peer medals?
            </a>
          </li>
          <li>
            <a href="#h-indexes">What are h-indexes?</a>
          </li>
          <li>
            <a href="#fractional-h-index">What is the fractional h-index?</a>
          </li>
          <li>
            <a href="#medal-tiers">How are medal tiers determined?</a>
          </li>
          <li>
            <a href="#medals-forever">Are medals forever?</a>
          </li>
        </ul>
      </div>

      <hr className="my-8" />

      <h2 className="scroll-mt-nav" id="metaculus-medals">
        What are Metaculus medals?
      </h2>
      <p>
        Medals reward Metaculus users for excellence in forecasting accuracy,
        insightful comment writing, and engaging question writing.
      </p>

      <p>
        Medals are awarded based on a user&apos;s placement in the{" "}
        <Link href="/leaderboard/">Leaderboards</Link>. There are separate
        leaderboards for each medal category (
        <a href="#peer-medals">Peer Accuracy</a>,{" "}
        <a href="#baseline-medals">Baseline Accuracy</a>,{" "}
        <a href="#comments-medals">Comments</a>, and{" "}
        <a href="#question-writing-medals">Question Writing</a>), and each
        leaderboard is further separated into time periods. Medals are also
        awarded for placement in each{" "}
        <Link href="/help/scores-faq/#metaculus-tournaments">Tournament</Link>
        &apos;s leaderboard.
      </p>

      <p>
        A medal&apos;s tier (gold, silver or bronze) is based on a user&apos;s
        rank compared to other users, with only the top 1% earning Gold medals.
      </p>

      <p>
        So no one gets an unfair advantage, only public content (questions,
        comments, tournaments) counts for medals. If you are invited to a
        private tournament, your activity there will not count toward any medal.
        We have also decided the three Beginner Tournaments (
        <Link href="/tournament/Q42022-beginner-tournament/">1</Link>,{" "}
        <Link href="/tournament/Q12023-beginner-tournament/">2</Link>,{" "}
        <Link href="/tournament/beginner-tournament/">3</Link>) would not award
        medals, since that would be unfair to veteran forecasters who were
        actively discouraged from participating.
      </p>

      <p>
        Medals appear in the <Link href="/leaderboard/">Leaderboards</Link> and
        in user profiles.
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="baseline-medals">
        What are Baseline Accuracy medals?
      </h2>
      <p>
        The Baseline Accuracy medals reward accurate predictions on many
        questions.
      </p>
      <p>
        Users are ranked by the sum of their{" "}
        <Link href="/help/scores-faq/#baseline-score">Baseline scores</Link>{" "}
        over all questions in the <a href="#scores-time-periods">Time Period</a>
        .
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="peer-medals">
        What are Peer Accuracy medals?
      </h2>
      <p>
        The Peer Accuracy medals reward accurate predictions compared to others,
        and do not require forecasting a large number of questions.
      </p>
      <p>
        Forecasters are ranked by the sum of their{" "}
        <Link href="/help/scores-faq/#peer-score">Peer scores</Link>, divided by
        the sum of their{" "}
        <Link href="/help/scores-faq/#coverage">Coverages</Link> over all
        questions in the <a href="#scores-time-periods">Time Period</a>. This
        creates a weighted average, where each prediction is counted
        proportionally to how long it was standing.
      </p>
      <p>
        If the forecaster has a total coverage below 30 in a particular time
        period (e.g. they predicted 20 questions with 100% coverage, or 50
        questions with 50% coverage), then their coverage is treated as 30. This
        makes it unlikely that a user wins a medal by getting lucky on a single
        question.
      </p>
      <p>
        Before 2024, the Peer accuracy was slightly different. The forecaster
        score was the average of their Peer scores, not taking Coverage into
        account. This caused some incentives problems, see{" "}
        <Link href="/notebooks/20027/scores-and-medals-trade-offs-and-decisions/#update-july-2024-implementing-idea-4">
          here
        </Link>{" "}
        for details. The initial handicap was also 40 instead of the current 30.
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="tournament-medals">
        What are tournament medals?
      </h2>
      <p>
        Tournament medals are awarded based on a user&apos;s rank on a
        tournament leaderboard. The top 1% get gold, the next 1% silver, and
        following 3% bronze.
      </p>
      <p>
        The three Beginner Tournaments (
        <Link href="/tournament/Q42022-beginner-tournament/">1</Link>,{" "}
        <Link href="/tournament/Q12023-beginner-tournament/">2</Link>,{" "}
        <Link href="/tournament/beginner-tournament/">3</Link>) will not award
        medals, since that would be unfair to veteran forecasters who were
        actively discouraged from participating.
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="comments-medals">
        What are Comments medals?
      </h2>
      <p>
        A Comments medal is awarded for writing valuable comments, with a
        balance between quantity and quality.
      </p>

      <p>
        Users are ranked by the{" "}
        <Link href="/help/medals-faq/#h-indexes">h-index</Link> of upvotes on
        their comments made during the{" "}
        <Link href="/help/medals-faq/#writing-time-periods">Time Period</Link>.
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="question-writing-medals">
        What are Question Writing medals?
      </h2>
      <p>
        The Question Writing medals reward writing engaging questions, with a
        balance between quantity and quality.
      </p>

      <p>
        Users are ranked by the{" "}
        <Link href="/help/medals-faq/#h-indexes">h-index</Link> of the number of
        forecasters who predicted on their authored questions in the{" "}
        <Link href="/help/medals-faq/#writing-time-periods">Time Period</Link>.
        Because there are few questions but many forecasters, the number of
        forecasters is divided by 10 before being used in the h-index.
      </p>

      <p>
        All co-authors on a question receive full credit, i.e. they are treated
        the same as if they had authored the question alone.
      </p>

      <p>
        Additionally, a single question may contribute to medals over many
        years, not just the year it was written. If a question receives
        predictions from 200 unique forecasters every year, then the author
        receives credit for those 200 forecasters every year.
      </p>
      <hr />

      <h2 className="scroll-mt-nav" id="writing-time-periods">
        What are the Times Periods for Comments & Question writing medals?
      </h2>
      <p>
        Comments and Question writing medals are awarded annually, based on the
        # of upvotes on your comments and # of forecasters on your questions in
        a given calendar year.
      </p>

      <p>
        For example, if you wrote 20 long-term questions in 2016 that each
        attracted 200 forecasters in every calendar year then your score for
        Question Writing would be 20 in every year after 2016. Even though you
        didn&apos;t write any questions in 2017, the engagement that your
        questions attracted in 2017 makes you eligible for a 2017 medal. Said
        another way, a great long-term question can contribute to many medals.
      </p>
      <hr />

      <h2 className="scroll-mt-nav" id="scores-time-periods">
        What are the Time Periods for Baseline & Peer medals?
      </h2>
      <p>
        Time Periods for Accuracy medals serve two main purposes. They ensure a
        periodic fair starting line on January 1, at which point long-time and
        new forecasters are on equal grounds. They also group questions with
        similar durations together, so it is easier to separate long-term and
        short-term forecasting skill.
      </p>

      <p>
        A Time Period for the Baseline and Peer medals consists of a Duration
        (1, 2, 5, 10… years), a start year and an end year. The end date for a
        time period is December 31 of the end year. The start date for a time
        period is January 1 of the start year. So, a 5 year medal covering
        2016–2020 has a start date of Jan 1, 2016 and an end date of Dec 31,
        2020.
      </p>

      <p>
        The Time Period determines which questions are included in a medal
        calculation:
      </p>
      <ul className="ml-5 list-disc">
        <li>
          A question only belongs to exactly 1 Time Period, so it only
          contributes to 1 Baseline medal and to 1 Peer medal.
        </li>
        <li>
          A question is assigned to the shortest time period that satisfies the
          following:
        </li>
        <ul className="ml-5 list-disc">
          <li>The question opened after the Time Period start date.</li>
          <li>
            The question is <b>scheduled</b> to close <b>before</b> the Time
            Period&apos;s end date.{" "}
            <i>
              (There is a 3 day buffer here: some questions were written to
              close on Jan 1 and naturally belong in the prior year. Also,
              sometimes time zones make it unclear which date to use.)
            </i>
          </li>
          <li>
            The question resolves before the Time Period&apos;s end date + a
            buffer of 100 days.{" "}
            <i>
              (This allows time for data sources to become available. For
              instance, a question about 2022 GDP naturally should count toward
              the 2022 medal, but the final economic report is often published
              ~90 days after the year end.)
            </i>
          </li>
        </ul>
      </ul>
      <p>
        Following the rules above, almost all questions are assigned to their
        Time Period before forecasting begins. On rare occasions, a question
        will fail to be resolved before the end of the 100-day buffer: by the
        rules above it is automatically assigned to the next higher Duration in
        which it fits.
      </p>
      <p>
        Note: If a question closes early it remains in its originally assigned
        time period. This is important to ensure that an optimistic forecaster
        does not gain an advantage. For example, imagine ten 5-year questions
        that can either resolve Yes this week (with 50% probability), or resolve
        No after the full 5 years. Starting next week, an optimist looks
        misleadingly good: they predicted 99% on all of the 5 questions that
        resolved, and they all resolved Yes. After the full 5 years they
        correctly look very bad: of the 10 questions they predicted 99% on, only
        5 resolved Yes. Keeping questions in their initial time period ensures
        that optimists don&apos;t get undue early credit.
      </p>
      <hr />
      <h2 className="scroll-mt-nav" id="h-indexes">
        What are h-indexes?
      </h2>
      <p>
        An <a href="https://en.wikipedia.org/wiki/h-index">h-index</a> is a
        metric commonly used in academia to measure the quantity and quality of
        researcher publications. If a researcher has an h-index of N it means
        that they have published at least N papers that each individually have
        at least N citations.
      </p>
      <p>
        We use h-indexes for the Comments medals (number of upvotes per comment)
        and for the Question Writing medals (tens of forecasters per question).
      </p>
      <p>
        Traditional h-indexes are integers. To break ties, we use a fractional
        h-index, described below.
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="fractional-h-index">
        What is the fractional h-index?
      </h2>
      <p>
        The fractional h-index is like the standard h-index, but with an added
        fractional part that measures progress toward the next higher h-index
        value.
      </p>
      <p>
        Imagine that you have exactly 2 comments with exactly 2 upvotes. Your
        h-index is therefore 2. To reach an h-index of 3, you need to receive 1
        more upvote on each of your 2 existing comments (a total of 2 more
        upvotes) and you need to write a new comment that receives 3 upvotes. In
        total you need 5 more upvotes to reach an h-index of 3.
      </p>
      <p>
        Imagine one of your comments receives 1 new upvote, and you write a
        comment that receives 2 new upvotes. Your fractional h-index is then:
      </p>
      <p>2 + (1 + 2) / 5 = 2.6</p>
      <p>In general, the formula is:</p>
      <KatexRenderer
        equation={
          "H_f = H + \\frac{ \\sum_{i=1}^{H+1} \\min(v_i, H+1) - H^2 }{ (H+1)^2 - H^2 }"
        }
        inline={false}
      />
      <p>
        Where <KatexRenderer equation="H" inline /> is your integer h-index, and{" "}
        <KatexRenderer equation="v_i" inline /> is the number of upvotes on your
        i-th most upvoted comment.
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="medal-tiers">
        How are medal tiers determined?
      </h2>
      <p>
        Medals are awarded based on a user&apos;s rank within a Category for a
        Time Period, or in a Tournament:
      </p>
      <ul className="ml-5 list-disc">
        <li>Top 1% = Gold</li>
        <li>1% to 2% = Silver</li>
        <li>2% to 5% = Bronze</li>
      </ul>
      <p>
        The denominators for the percentages are the number of users who have
        made any contribution toward that medal. Specifically, the denominators
        are:
      </p>
      <ul className="ml-5 list-disc">
        <li>
          Baseline &amp; Peer Accuracy: the number of users who made a forecast
          on any public question in the time period.
        </li>
        <li>
          Tournament: the number of users who made a forecast on any question in
          the tournament.
        </li>
        <li>
          Comments: the number of users who made a public comment in the time
          period.
        </li>
        <li>
          Question writing: the number of users who authored (or co-authored) a
          public question that received forecasts during the time period.
        </li>
      </ul>
      <p>
        To make the leaderboards more interesting and fair, we also enforce the
        following rules:
      </p>
      <ul className="ml-5 list-disc">
        <li>
          The first, second, and third place finishers always receive (at least)
          a gold, silver, and bronze medals, in that order.
        </li>
        <li>
          If two users are tied, they always get the same medal and rank (e.g.
          if 2nd and 3rd tie, they both get 2nd place).
        </li>
        <li>
          Metaculus staff and moderators are ineligible for medals for
          contributions they made during the time they were on staff or
          moderating.
        </li>
      </ul>
      <hr />
      <h2 className="scroll-mt-nav" id="medals-forever">
        Are medals forever?
      </h2>
      <p>
        In general, yes! We designed the medal system so that once a medal is
        awarded, it never goes away.
      </p>
      <p>
        However, when we discover an error - an incorrectly resolved question or
        a bug in the code - we plan to correct the error and medals could shift,
        hopefully only very slightly. We believe this will be a rare occurrence,
        but it may happen. The spirit of Metaculus is to be accurate.
      </p>
    </PageWrapper>
  );
}
