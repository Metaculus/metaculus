import PageWrapper from "../../components/pagewrapper";

export const metadata = {
  title: "Question Approval Checklist | Metaculus",
  description:
    "The guidelines below are general rules that should be followed in the large majority of cases. There are always exceptions to the rules, but if your question breaks a guideline below then it is worth checking with another moderator or admin to get a second or third opinion that it is the best path forward.",
};

export default function QuestionChecklist() {
  return (
    <PageWrapper>
      <h1>Metaculus Question Approval Checklist</h1>
      <div className="space-y-6">
        <p>
          The guidelines below are general rules that should be followed in the
          large majority of cases. There are always exceptions to the rules, but
          if your question breaks a guideline below then it is worth checking
          with another moderator or admin to get a second or third opinion that
          it is the best path forward.
        </p>

        <hr className="my-4 border-t-2 border-gray-300 dark:border-gray-700" />

        <section>
          <ul className="ml-6 list-disc space-y-4">
            <li>
              Does the question have at least 2 paragraphs / ~100 words of
              context?
              <ul className="ml-6 list-disc">
                <li>
                  If not, is the question self-explanatory or high-value and
                  urgent?
                </li>
              </ul>
            </li>
            <li>Are dates written in &quot;Month day, year&quot; format?</li>
            <li>
              Are all dates written as absolute dates?{" "}
              <em>
                &quot;September 26, 2021&quot; rather than &quot;in this
                century&quot; or &quot;after the opening of this question&quot;
              </em>
            </li>

            <li>
              Is the question resolution solely under the authority of Metaculus
              Admins or an external third-party?
            </li>
            <li>
              If the question involves currencies or prices, is the resolution
              inflation-indexed?
            </li>
            <li>
              When naming a resolution source, are we trying to forecast{" "}
              <a href="https://www.metaculus.com/help/faq/#ressrc">
                that particular source
              </a>{" "}
              more than the &quot;true answer&quot;?
              <ul className="ml-6 list-disc">
                <li>
                  If we prefer the &quot;true answer&quot;, are any fallback
                  sources listed?
                </li>
              </ul>
            </li>
            <li>
              Does the resolution avoid linking/dependence on other Metaculus
              questions?
            </li>
            <li>
              Does the resolution avoid dependence on any individual or group
              saying particular words or phrases?
              <ul className="ml-6 list-disc">
                <li>If not, are they formal or well-defined terms?</li>
              </ul>
            </li>

            <li>
              Does the question avoid predicting the mortality of an individual
              or specific small group?
            </li>
            <li>
              Does the headline question avoid making a stronger/weaker claim
              than the resolution criteria?
            </li>
            <li>
              Does the topic avoid highly controversial or potentially
              controversial subjects?
              <ul className="ml-6 list-disc">
                <li>
                  If not, has it been reviewed carefully by 2 mods/admins?
                </li>
              </ul>
            </li>
          </ul>
        </section>

        <hr className="my-4 border-t-2 border-gray-300 dark:border-gray-700" />

        <h2 className="text-xl font-bold">Explanations/Rationales</h2>

        <h3 className="text-lg font-semibold">Formatting and style</h3>

        <h4 className="text-md font-medium">
          Does the question have at least 2 paragraphs / ~100 words of context?
          If not, is the question self-explanatory or high value and urgent?
        </h4>
        <p>
          Not everyone reading/predicting a question is a domain expert, or has
          even heard of the question&apos;s subject. Good background text should
          draw the reader&apos;s interest and provide some glimpse into our
          current understanding on the subject. Inevitably some of this
          information may become out of date or irrelevant, but this is fine.
          Metaculus is as much a record/evaluation of past predictions as it is
          a tracker of current information on a subject.
        </p>
        <p>
          Exceptions to this rule can be made in some scenarios, such as
          tracking COVID-19 deaths while we&apos;re 1 year into the pandemic
          (self-explanatory), or if a question needs to be written/opened
          quickly, such as an outbreak of political violence (high value and
          urgent).
        </p>

        <h4 className="text-md font-medium">
          Are dates written in &quot;Month, day year&quot; format?
        </h4>
        <p>
          Our forecasters, readers, and question authors come from all over the
          world, and we should avoid the confusion of seeing different date
          formats in different questions/contexts. Month, day year (for example,
          &quot;September 26, 2021&quot; or &quot;Sep 26, 2021&quot;) is aligned
          with Metaculus&apos; design elements, and is easy for people to read
          and parse.
        </p>

        <h4 className="text-md font-medium">
          Are all dates written as absolute dates (not relatively, such as
          &quot;in this century&quot; or &quot;after the opening of this
          question&quot;)?
        </h4>
        <p>
          People come to our questions in many contexts, and may not be familiar
          with terms like &quot;resolution date&quot; or &quot;opening
          date&quot; or our site&apos;s interface. Many of our questions are
          meant to remain open for a long time; 10 years from now, it may be
          hard to parse the meaning of &quot;in the next 100 years&quot; or
          &quot;when this question was written&quot;.
        </p>

        <hr className="my-4 border-t-2 border-gray-300 dark:border-gray-700" />

        <h3 className="text-lg font-semibold">
          Resolution and Scoring Details
        </h3>

        <h4 className="text-md font-medium">
          Is the question resolution solely under the authority of Metaculus
          Admins or an external third-party?
        </h4>
        <p>
          Resolution should almost always come in the form of 1. Publication
          from third-parties; or 2. Discretion of Metaculus Admins. Metaculus
          moderators are valued members of our team, but they do not have
          authority to resolve questions. Resolution text including &quot;polls
          from users in comments&quot; or &quot;if at least 1 moderator
          says…&quot; should be avoided. Possible exceptions:{" "}
          <a href="https://www.metaculus.com/questions/3724/will-at-least-one-metaculus-user-report-a-positive-test-result-for-novel-coronavirus-by-the-end-of-2020/">
            Will at least one Metaculus user report a positive test result for
            novel coronavirus by the end of 2020?
          </a>{" "}
          -- users can submit verifiable claims for Admins to approve (though
          alternative resolutions are generally preferred).
        </p>

        <h4 className="text-md font-medium">
          If the question involves currencies or prices, is the resolution
          inflation-indexed?
        </h4>
        <p>
          Though there are often exceptions to this rule, Metaculus has several
          far-future forecasts where inflation can significantly change the
          terms. When considering resolution dates 10 years out or more,
          inflation indexing is generally preferred.
        </p>

        <h4 className="text-md font-medium">
          When naming a resolution source, are we trying to forecast{" "}
          <a href="https://www.metaculus.com/help/faq/#ressrc">
            that particular source
          </a>{" "}
          more than the &quot;true answer&quot;? If we prefer the &quot;true
          answer&quot;, are any fallback sources listed?
        </h4>
        <p>
          Sometimes we care about the behavior of a source, like{" "}
          <a href="https://www.metaculus.com/questions/8033/date-who-announces-end-of-covid-19-pandemic/">
            When will the WHO announce that the COVID-19 pandemic has ended?
          </a>
          , other times we care about the actual answer, like{" "}
          <a href="https://www.metaculus.com/questions/5916/will-2021-be-the-hottest-year-on-record/">
            Will 2021 be the hottest year on record according to NASA?
          </a>
          . We have a default policy in place: we will assume the question is
          tracking the &quot;true answer&quot; unless the author specifically
          stresses otherwise.
        </p>

        <h4 className="text-md font-medium">
          Does the resolution avoid linking/dependence on other Metaculus
          questions?
        </h4>
        <p>
          For example, a question might say &quot;If this linked question on
          Metaculus resolves true, then how many X by Y date?&quot;. This may
          seem to have no harm and make the question briefer and simpler, but
          this hides important complexity. Every term in the resolution criteria
          is significant, and linking questions can lead to cascades of
          simplifying and misunderstanding criteria. Even if criteria are copied
          and pasted, this redundancy encourages predictors to re-review the
          terms, potentially discovering ambiguities.
        </p>

        <h4 className="text-md font-medium">
          Does the resolution avoid dependence on any individual or group saying
          particular words or phrases? If not, are they formal or well-defined
          terms?
        </h4>
        <p>
          Examples of poor questions:{" "}
          <a href="https://www.metaculus.com/questions/4800/in-the-2020-us-presidential-election-when-will-the-losing-candidate-concede/">
            In the 2020 US Presidential election, when will the losing candidate
            concede?
          </a>{" "}
          And{" "}
          <a href="https://www.metaculus.com/questions/7211/us-conclude-covid-lab-leak-by-june-2022/">
            Will any body of the US federal government conclude that COVID-19
            originated in a lab in Hubei before June 1st 2022?
          </a>{" "}
          In cases like these, a public figure might be under great pressure to
          make a certain statement, and their reluctance to do so will often
          lead them to vague or softened word choices. No matter how broad or
          inclusive we might define resolution criteria, these situations
          frequently lead to polarizing debates and unsatisfying resolutions. If
          a question can&apos;t be defined on concrete actions or information,
          it is a sign it should be avoided (With an exception for formal or
          well-defined terms).
        </p>

        <hr className="my-4 border-t-2 border-gray-300 dark:border-gray-700" />

        <h3 className="text-lg font-semibold">Sensitive Subjects</h3>

        <h4 className="text-md font-medium">
          Does the question avoid predicting the mortality of an individual or
          specific small group?
        </h4>
        <p>
          Example of a poor question:{" "}
          <a href="https://www.metaculus.com/questions/615/will-the-number-of-living-humans-who-have-walked-on-another-world-fall-to-zero/">
            Will the number of living humans who have walked on another world
            fall to zero?
          </a>{" "}
          This question can be easily rewritten to focus on future space
          missions (a matter of public interest), rather than the health and
          longevity of retired astronauts (not appropriate).
        </p>
        <p>
          A good question:{" "}
          <a href="https://www.metaculus.com/questions/5457/date-next-scotus-vacancy-arises/">
            When will the next US Supreme Court vacancy arise?
          </a>{" "}
          Though an individual&apos;s death is a component of resolution, it is
          arguably not the most likely component; regardless, the transition is
          highly important to the public interest. Public interest can outweigh
          this rule, for instance in a question like &quot;When will Kim Jung Un
          no longer be Dictator-For-Life?&quot;
        </p>

        <h4 className="text-md font-medium">
          Does the headline question avoid making a stronger/weaker claim than
          the resolution criteria?
        </h4>
        <p>
          This is naturally somewhat more of an art than a science. Although
          every detail in the resolution criteria is relevant, the more the
          headline question matches the resolution criteria, the stronger the
          question and forecasts will be. If a complicating detail does not make
          a question more insightful, remove it.
        </p>

        <h4 className="text-md font-medium">
          Does the topic avoid highly controversial or potentially controversial
          subjects? If not, has it been reviewed carefully by 2 mods/admins?
        </h4>
        <p>
          Sometimes in controversial areas, Metaculus can offer a public service
          in gathering high-quality information and giving falsifiable
          predictions. If there is value or public interest in controversial
          subjects, they can make for good questions. However, the stakes are
          generally higher, and such questions will attract more attention. More
          care is necessary in these cases.
        </p>
      </div>
    </PageWrapper>
  );
}
