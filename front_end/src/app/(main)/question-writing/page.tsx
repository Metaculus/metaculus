import PageWrapper from "../components/pagewrapper";

export const metadata = {
  title: "Question writing and submission guidelines",
  description:
    "We greatly value the contributions of our diverse community of forecasters, question authors, and forum participants, and we hope that these guidelines will promote, enhance, and safeguard a vibrant community forecasting space for many years to come.",
};

export default function QuestionChecklist() {
  return (
    <PageWrapper>
      <h1>Question writing and submission guidelines</h1>
      <div className="space-y-6">
        <p>
          Welcome to our question writing guide! Here, you&apos;ll learn about
          our best practices for writing and submitting questions, as well as
          our content rules and guidelines.
        </p>
        <p>
          We greatly value the contributions of our diverse community of
          forecasters, question authors, and forum participants, and we hope
          that these guidelines will promote, enhance, and safeguard a vibrant
          community forecasting space for many years to come.
        </p>
        <p>
          See below for the sections described in this guide. A more in-depth
          question writing guide is also available{" "}
          <a
            href="https://www.notion.so/metaculus/Detailed-Question-Writing-Guide-9e7374d638e749a2ae40b093ce619a9a"
            target="_blank"
          >
            here
          </a>
          .
        </p>
        <ul className="ml-6 list-disc space-y-2">
          <li>
            <a href="#what-types">
              What types of questions are suitable for Metaculus?
            </a>
          </li>
          <li>
            <a href="#our-guidelines">Our guidelines</a>
          </li>
          <li>
            <a href="#r-conditions">Guidelines for resolution conditions</a>
          </li>
          <li>
            <a href="#q-submissions">Best practices for question submissions</a>
          </li>
          <li>
            <a href="#close-resolve">Setting closing and resolution dates</a>
          </li>
          <li>
            <a href="#rules">Moderation rules</a>
          </li>
          <li>
            <a href="#moderators">About the Community Moderators</a>
          </li>
        </ul>
        <p>
          Submitted questions are reviewed by a group of volunteer{" "}
          <a href="#moderators">Community Moderators</a>. The Community
          Moderators team tries its best to approve all the questions that
          conform to our guidelines and best practices swiftly, typically within
          a week or two. Questions that are not immediately ready for
          publication are provided feedback by Community Moderators.
        </p>

        <h2 className="text-2xl font-bold" id="what-types">
          What types of questions are suitable for Metaculus?
        </h2>
        <p>
          Metaculus hosts questions on almost any topic — science, technology,
          politics, business, law, economics — you name it! That said, our
          primary focus areas are Science,{" "}
          <a href="https://www.metaculus.com/questions/?search=cat:tech">
            Technology
          </a>
          ,{" "}
          <a href="https://www.givingwhatwecan.org/what-is-effective-altruism/">
            Effective Altruism
          </a>
          ,{" "}
          <a href="https://en.wikipedia.org/wiki/Artificial_intelligence">
            Artificial Intelligence
          </a>
          ,{" "}
          <a href="https://www.metaculus.com/cause/healthy-communities/">
            Health
          </a>
          ,{" "}
          <a href="https://www.metaculus.com/questions/?search=cat:geopolitics">
            Geopolitics
          </a>
          , and{" "}
          <a href="https://www.metaculus.com/questions/?search=cat:category--distant-future">
            Far-Future Forecasting
          </a>{" "}
          (10 years or more in the future).
        </p>
        <p>
          Currently, we will consider any question that satisfies our guidelines
          and rules for publication on the platform.
        </p>

        <h2 className="text-2xl font-bold" id="our-guidelines">
          Our guidelines
        </h2>
        <p>
          Writing incisive questions for forecasting can be challenging and
          requires a keen eye for detail, careful precision, creativity and
          imagination, and a host of other skills. Fortunately, many of these
          skills can be cultivated with a bit of practice.
        </p>
        <p>
          For experienced question writers, we have a briefer checklist to
          address common issues{" "}
          <a href="https://www.metaculus.com/help/question-checklist/">here</a>.
          For a comprehensive guide to writing good questions, see our
          guidelines below.
        </p>

        <h2 className="text-2xl font-bold" id="r-conditions">
          Specifying precise resolution criteria
        </h2>
        <p>
          Resolution criteria are the backbone of any forecasting question—they
          spell out how and when a question will resolve. It&apos;s therefore
          key to spell these out clearly.
        </p>
        <ol className="ml-6 list-decimal space-y-4">
          <li>
            <strong>Aim for tight resolution criteria.</strong> The resolution
            criteria should leave little room for discretion in deciding the
            resolution. As best you can, try to limit the scope for ex-post
            quarrels about what really happened, and who was right.
          </li>
          <li>
            <strong>Define your terms.</strong> Questions of the sort “will X
            occur?” often hinge on how X is defined. It is therefore important
            to spell out your definitions with extra care. Don&apos;t worry
            about being too pedantic here!
          </li>
          <li>
            <strong>Be concrete.</strong> Try to specify precisely and in detail
            which steps should or shouldn&apos;t be followed when resolving the
            question. Examples are helpful for making these instructions
            concrete.
          </li>
          <li>
            <strong>Use authoritative sources, when possible.</strong> Good
            options are numerical data regularly published by a reliable
            publicly available source. Note that you should be sure that the
            sources will be available at the time of resolution, or otherwise
            you might want to specify alternative sources of information.
          </li>
          <li>
            <strong>Consider and account for edge-cases.</strong> Try to imagine
            scenarios for which the resolution conditions fail to cleanly apply,
            or cases that are just on the edge of counting towards resolution.
            If such scenarios or edge-cases are plausible, you should clarify
            how the question should resolve when such events rear their head.
          </li>
          <li>
            <strong>Consider fall-back criteria.</strong> When you have a
            resolution that should be easy to check assuming all goes well, try
            to handle also the case where all doesn&apos;t go well. What if the
            data source you specified stops being published? Is there anything
            else odd that might happen to make the outcome unclear?
          </li>
          <li>
            <strong>Try to account for unknown unknowns.</strong> Think about
            how the resolution criteria behave when something you don&apos;t
            expect happens anyway.
          </li>
          <li>
            <strong>
              Avoid requiring significant Admin effort to resolve.
            </strong>{" "}
            Questions should not burden Admins with having to do a lot of work
            to resolve them in the future. Our current policy is to reject any
            question that would require more than approximately 15 minutes of
            Admin effort to resolve, unless we judge the question to be
            important enough to warrant the amount of effort required.
          </li>
          <li>
            <strong>Leave resolution authority to Metaculus.</strong> Only
            Metaculus Admins can resolve questions and responsibility for
            determining appropriate resolution should rest solely with them.
            Questions should not give resolution authority to question authors
            or any other members of the community.
          </li>
        </ol>
        <p>
          <a href="https://www.metaculus.com/help/faq/#closers">See the FAQ</a>{" "}
          for more details about how questions resolve.
        </p>

        <h2 className="text-2xl font-bold" id="q-submissions">
          Formatting and details
        </h2>
        <p>
          Metaculus has developed its own style and norms for writing and
          submitting questions. Heeding these best-practices will be appreciated
          by Metaculus forecasters and Moderators alike. Questions which
          don&apos;t follow these best-practices may be rejected.
        </p>
        <ol className="ml-6 list-decimal space-y-4">
          <li>
            <strong>Write in a neutral and objective tone.</strong> Questions in
            a neutral point of view represent topics fairly, proportionately,
            and, as far as possible, without editorial bias (think
            Wikipedia-style).
          </li>
          <li>
            <strong>Put effort into your question submissions.</strong>{" "}
            Don&apos;t expect Moderators to develop your question from scratch.
            If you have early ideas for questions but have yet to work these
            out, you can add a comment in the{" "}
            <a href="https://www.metaculus.com/questions/956/discussion-topic-what-are-some-suggestions-for-questions-to-launch/">
              question-suggestions discussion post
            </a>
            . Questions which are not nearly ready to publish and which do not
            follow the guidelines on this page will be rejected.
          </li>
          <li>
            <strong>Keep an eye out for feedback on your questions.</strong>{" "}
            After submitting your question, keep up with the feedback provided
            by Moderators, including requests for revisions.
          </li>
          <li>
            <strong>
              Explain why your question is interesting or important.
            </strong>{" "}
            The significance or context of a question is not always common
            knowledge, so it is sometimes important to explain it in the
            Background section. Quoting predictions from public figures or
            institutions is a great way to show the significance of a question.
            Use the Background to offer information that Metaculus users should
            know, with links to any high-quality articles or resources that
            would help them get started on their forecasts. Aim for at least 100
            words in the Background.
          </li>
          <li>
            <strong>
              The title and wording of the question should match the resolution
              conditions.
            </strong>{" "}
            Make sure that the question wording and title do not give a mistaken
            impression of when and how the question might resolve.
          </li>
          <li>
            <strong>Delegate the boring stuff to the fine-print.</strong> In
            some cases, the resolution criteria might become quite detailed and
            involved. To keep questions streamlined, it can be convenient to
            relegate some of the gory details to the fine-print.
          </li>
          <li>
            <strong>
              Select ranges that (likely) contain the resolution value.
            </strong>{" "}
            For range questions, make sure the bounds cover most possible
            outcomes, not just all outcomes that appear most likely. Select open
            bounds if there is even a small chance that values could fall
            outside the range.
          </li>
          <li>
            <strong>Avoid excessively wide ranges.</strong> Select a range wide
            enough that the true value is very unlikely to fall outside, but no
            wider.
          </li>
          <li>
            <strong>
              Limit discrete questions to at most 50 options.
            </strong>{" "}
            Discrete questions are designed for outcomes with a small number of
            distinct values (e.g. number of goals in a match, number of seats
            won). If your question would have more than 50 possible outcomes,
            increase the step size or tighten the bounds. Having too many
            discrete options makes the probability mass function chart difficult
            to read and undermines the forecasting experience.
          </li>
          <li>
            <strong>Double check.</strong> Proof-read your submission,
            double-check your resolution conditions and ranges, and make sure
            the formulation of your question is consistent throughout.
          </li>
          <li>
            <strong>Acknowledge the contributions of others.</strong> When
            copying text from an existing question, acknowledge and reference
            the previous question.
          </li>
          <li>
            <strong>
              Use appropriate{" "}
              <a href="https://www.metaculus.com/help/markdown/">
                markdown formatting
              </a>
              .
            </strong>{" "}
            When posting URLs, remember to embed these. When writing equations
            and formulas, try using MathJax.
          </li>
          <li>
            <strong>Select appropriate category tags.</strong> When submitting a
            question, make sure that you categorize your question appropriately
            by selecting relevant tags.
          </li>
          <li>
            <strong>Specify units and times.</strong> When the question asks
            about amounts, be sure to specify the units precisely (e.g.
            thousands of kilograms, nominal US dollars, temperature in degrees
            celsius). When specifying dates and times, remember to indicate the
            timezone or a UTC offset, and write all dates following the format
            “January 1, 2040”.
          </li>
          <li>
            <strong>Pass Phil Tetlock&apos;s Clairvoyance Test.</strong> If you
            handed your question to a genuine clairvoyant, could they see into
            the future and definitively tell you whether your resolution
            criteria happened? Some questions like{" "}
            <i>&quot;Will the US decline as a world power?&quot;</i>,{" "}
            <i>&quot;Will Country X be at war with Country Y?&quot;</i>, and{" "}
            <i>
              &quot;Will an AI exhibit a goal not supplied by its human
              creators?&quot;
            </i>{" "}
            would all be great to know, but as standalone questions they
            struggle to pass the Clairvoyance Test. For example, what does
            &quot;war&quot; mean, exactly, in a post-WWII world when countries
            usually do not declare war and instead engage in &quot;police
            actions&quot; or &quot;special military operations&quot;? How do you
            tell one type of AI goal from another, and how do you even define
            it? If your question fails the Clairvoyance Test, another way to
            assess the outcome of interest is by asking a series of specific,
            testable propositions. In the case of whether the US might decline
            as a world power, you&apos;d want to get at the theme with multiple
            well-formed questions such as{" "}
            <i>
              &quot;Will the US lose its #1 position in the IMF&apos;s annual
              GDP rankings before 2050?&quot;
            </i>
            ,{" "}
            <i>
              &quot;Will the US dollar lose its status as the #1 foreign
              exchange reserve currency?&quot;
            </i>
            , and{" "}
            <i>
              &quot;Will the debt held by the public as a share of US GDP rise
              above 200%?&quot;
            </i>
            .
          </li>
        </ol>

        <h2 className="text-2xl font-bold" id="close-resolve">
          Setting question dates
        </h2>
        <p>
          When submitting a question, you are asked to specify the closing date
          (when the question is no longer available for predicting) and
          resolution date (when the resolution is expected to occur). The date
          the question is set live for others to forecast on is known as the
          open date.
        </p>
        <ul className="ml-6 list-disc space-y-4">
          <li>
            The <strong>open date</strong> is the date/time when the question is
            open for predictions. Prior to this time, if the question is active,
            it will have &quot;upcoming&quot; status, and is potentially subject
            to change based on feedback. After the open date, changing questions
            is highly discouraged (as it could change details which are relevant
            to forecasts that have already been submitted) and such changes are
            typically noted in the question body and in the comments on the
            question.
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
          “this question resolves as <strong>Yes</strong> if X happens before
          January 1, 2040)&quot;.
        </p>
        <p>
          The close date <em>must</em> be at least one hour prior to the
          resolution date, but can be much earlier, depending upon the context.
          Here are some guidelines for specifying the close date:
        </p>
        <ul className="ml-6 list-disc space-y-4">
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
            <a href="https://www.metaculus.com/help/faq/#retroactive-closure">
              retroactively closes
            </a>{" "}
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
          <a href="https://www.metaculus.com/questions/10801/discontinuing-the-final-forecast-bonus/">
            update to the scoring system
          </a>
          .
        </p>

        <h2 className="text-2xl font-bold" id="rules">
          Question content
        </h2>
        <p>
          In addition to specifying precise resolution criteria and following
          accepted formatting and practices, we have some rules that we adhere
          to regarding question content.
        </p>
        <ul className="ml-6 list-disc space-y-4">
          <li>
            <strong>
              Questions should not contain inappropriate or offensive material.
            </strong>{" "}
            Please refrain from posting content that is predictably disruptive.
          </li>
          <li>
            <strong>Questions should be on topics that are notable.</strong>{" "}
            Questions should reasonably be expected to be of interest to at
            least some other users. If your question idea is only interesting to
            you or a small group of friends, you can make a private question,
            and share it with them.
          </li>
          <li>
            <strong>
              Public questions should not concern the personal lives of
              non-public figures.
            </strong>{" "}
            Questions about non-public figures are generally only appropriate as{" "}
            <a href="https://www.metaculus.com/help/faq/#question-private">
              private questions
            </a>
            .
          </li>
          <li>
            <strong>
              Questions should not concern the mortality of individuals.
            </strong>{" "}
            Questions should never aim to predict the mortality of individual
            people or even small groups. In cases of public interest (such as
            court appointees and political figures), the question should be
            phrased in other more directly relevant terms such as &quot;when
            will X no longer serve on the court&quot;. When the topic is death
            (or longevity) itself, questions should treat people in aggregate or
            hypothetically.
          </li>
          <li>
            <strong>
              Questions should typically not concern harmful acts.
            </strong>{" "}
            Questions should avoid being written in a way that incentivizes
            harmful or illicit acts — that is, if one were to imagine that the
            stakes of getting a question correct were high enough to motivate
            someone to interfere in real-world events to change a
            question&apos;s resolution, those actions should not be by their
            nature illegal or harmful. Exceptions may be made in cases where
            such predictions are clearly of wide public interest, which is to be
            decided by Community Moderators.
          </li>
          <li>
            <strong>
              Questions should not contain information hazards or credibly pose
              a risk of causing harm.
            </strong>{" "}
            <a
              href="https://en.wikipedia.org/wiki/Information_hazard"
              target="_blank"
            >
              Information hazards
            </a>{" "}
            are risks posed by the spread of factual information that could lead
            to harmful outcomes if they reach certain actors or audiences. These
            range from technical vulnerabilities that could compromise systems,
            to extreme cases such as information about how to build a bioweapon.
            Questions should also seek to avoid harmful self-fulfilling or
            self-negating effects, where the aggregate forecast could itself
            influence whether the event in question occurs. Information hazards
            and circular effects are often difficult to assess and can vary
            substantially in the level of risk posed. Metaculus will weigh the
            potential benefits and risks of submitted questions and will avoid
            launching those that pose a significant risk.
          </li>
        </ul>
        <p>
          Question content rules (with the exception of the notability
          requirement, and the no non-public figures rule) apply equally to
          private questions as they do to public ones.
        </p>

        <h2 className="text-2xl font-bold" id="moderators">
          About the Community Moderators
        </h2>
        <p>
          Metaculus Community Moderators are committed members of the community
          who help the platform run smoothly. We greatly appreciate their time
          and talents, and we hope you&apos;ll do the same!
        </p>
        <p>The main responsibilities of Community Moderators include:</p>
        <ul className="ml-6 list-disc space-y-4">
          <li>
            Providing constructive feedback on user-submitted questions,
            including asking for revisions when necessary.
          </li>
          <li>
            Accepting community-suggested questions that are ready to go live
            for forecasting.
          </li>
          <li>Mediating discussions about question resolutions.</li>
          <li>
            Answering users&apos; questions about how the platform works, when
            they arise.
          </li>
        </ul>
        <p>
          Sometimes, we invite outstanding community members who give
          thoughtful, constructive feedback on questions to become paid
          moderators. Fill out our{" "}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSdebfiVQVoYj4WakqvwY-08k0x9Sfy8HMAUsKPE707YEChGlQ/viewform"
            target="_blank"
          >
            expression of interest form
          </a>{" "}
          if you would like to be considered as a moderator.
        </p>
      </div>
    </PageWrapper>
  );
}
