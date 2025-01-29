import { getLocale } from "next-intl/server";

import content_pt from "./page_pt";
import PageWrapper from "../../components/pagewrapper";

export const metadata = {
  title: "Guidelines | Metaculus",
  description:
    "Learn about Metaculus community etiquette, moderation rules, sanctions, and the role of Community Moderators.",
};

export default async function CommunityGuidelines() {
  const locale = await getLocale();
  if (locale === "pt") {
    return content_pt();
  }

  return (
    <PageWrapper>
      <h1>Metaculus Community Guidelines</h1>

      <p className="mb-4">
        Welcome to the Metaculus Community Guidelines page! This is a good place
        to get started for all those who are interested in engaging with the
        Metaculus platform.
      </p>
      <p className="mb-4">
        We greatly value the contributions of our diverse community of
        forecasters, question authors, and forum participants, and we hope that
        these guidelines will promote, enhance, and safeguard a vibrant
        community forecasting space for many years to come.
      </p>

      <ul className="mb-6 list-inside list-disc">
        <li>
          <a href="#etiquette">Etiquette</a>
        </li>
        <li>
          <a href="#moderation">Moderation Rules</a>
        </li>
        <li>
          <a href="#sanctions">Sanctions</a>
        </li>
        <li>
          <a href="#moderators">About the Community Moderators</a>
        </li>
      </ul>

      <p className="mb-4">
        Content on the platform is moderated by members of the Metaculus team,
        together with a group of volunteer Community Moderators.
      </p>
      <p className="mb-4">
        Content that does not adhere to our Moderation Rules will be removed,
        and the posters will be notified of this via email. Conduct that
        violates our rules and consistent norm-violating conduct will be
        appropriately sanctioned by the measures described below.
      </p>
      <p className="mb-4">
        To ensure that your contributions and comments have the maximum impact,
        we encourage you to follow the etiquette guide below.
      </p>

      <h2 className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold" id="etiquette">
        Etiquette
      </h2>
      <ol className="list-inside list-decimal space-y-2">
        <li>
          Aim for high-quality, useful and informative content. It&apos;s
          greatly appreciated when participants contribute to the discussion at
          hand. Disruptive comments, derailing, or spam aren&apos;t welcome.
        </li>
        <li>
          Be respectful of all participants and moderators. Moderators are
          volunteers whose job is to ensure that the platform runs smoothly –
          show them you appreciate their service by giving them the benefit of
          the doubt if you have a misunderstanding.
        </li>
        <li>
          Keep things civil. Offensive or insulting remarks aren&apos;t welcome.
        </li>

        <li>
          Don&apos;t fuel conflicts if they occur. Just disengage and report
          issues using the &quot;Flag&quot; feature on comments if you encounter
          content that violates these guidelines.
        </li>

        <li>
          Be constructive. It&apos;s okay to disagree with others, just keep the
          dialogue positive and respectful.
        </li>

        <li>
          Avoid excessive editorializing. Metaculus is ultimately a place where
          forecasts and individual track records speak for themselves. As a
          general rule, we encourage comments that are on topic, and free from
          personal grievances or strong politics.
        </li>

        <li>
          Show your appreciation. If you think something contributes to
          conversation, upvote it!
        </li>

        <li>
          Search first. If you have questions about how Metaculus works, check
          to see if you can find the answer in the FAQ. There are lots of
          technical details for those interested.
        </li>

        <li>
          Aim for good grammar and spelling. While perfection is certainly not
          the goal, we appreciate linguistic propriety and enjoy the fact that
          you are more likely than not to encounter complete, legible sentences
          here. Please mind your language.
        </li>
        <li>
          Report potential conflicts of interest. At times, forecasters weigh in
          on question resolution discussions. If you do so, it’s considered good
          form to indicate when you have a potential conflict of interest. A
          simple “I will win X points if this question resolves as I suggest it
          should” will suffice.
        </li>
        <li>
          Plagiarism is not tolerated. Quoting or citing other sources is very
          welcome when you give attribution to the original source. Trying to
          claim their work as your own is not acceptable.
        </li>
      </ol>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="moderation"
      >
        Moderation Rules
      </h2>
      <ol className="list-inside list-decimal space-y-2">
        <li>
          Do not engage in abusive behaviour. Abusive behaviour includes
          personal attacks, making threats, and harassment.
        </li>
        <li>
          Do not post or link to any inappropriate, offensive or illegal
          material. Please refrain from posting content that is blatantly
          disruptive to the discussion.
        </li>
        <li>
          Do not be intolerant of others. Intolerance of a person’s race,
          culture, appearance, gender, sexual preference, religion or age is
          unacceptable.
        </li>
        <li>
          Skip advertisements and spam. Linking to relevant resources is fine,
          but promoting products and commercial offerings is not.
        </li>
        <li>
          Don&apos;t impersonate others. If a user claims to be someone they are
          not in comments or in their username, Moderators may ask the user to
          provide identifying information, and remove the misrepresentation if
          the user cannot verify their identity.
        </li>
        <li>
          If you’ve found something wrong, please don’t jeopardize platform
          functionality. We’re constantly working on the Metaculus platform. If
          you have found a bug or if something isn’t working right, we
          appreciate you letting us know via the Contact link in the footer.
        </li>
      </ol>
      <p className="mt-4">
        For further details about our Acceptable Use Policy, check out our{" "}
        <a href="https://www.metaculus.com/terms-of-use/">Terms of Use</a>.
      </p>

      <h2 className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold" id="sanctions">
        Sanctions
      </h2>
      <ol className="list-inside list-decimal space-y-2">
        <li>
          Removal of Comments or Questions. Content that breaches the Moderation
          Rules will be removed.
        </li>
        <li>
          Temporary Suspension. Participants who flout the Moderation Rules will
          have access to their accounts suspended for a period of one week.
        </li>
        <li>
          Permanent Ban. Participants who repeatedly violate the Moderation
          Rules will have their access to their accounts permanently blocked.
        </li>
      </ol>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="moderators"
      >
        About the Community Moderators
      </h2>
      <p className="mb-4">
        Metaculus Community Moderators are committed members of the community
        who volunteer to help the platform run smoothly. We greatly appreciate
        their time and talents, and we hope you&apos;ll do the same!
      </p>
      <p className="mb-4">
        The main responsibilities of Community Moderators include:
      </p>
      <ol className="list-inside list-decimal space-y-2">
        <li>
          Providing constructive feedback on user-submitted questions, including
          asking for revisions when necessary.
        </li>
        <li>
          Accepting community-suggested questions that are ready to go live for
          forecasting.
        </li>
        <li>Mediating discussions about question resolutions.</li>
        <li>
          Answering users&apos; questions about how the platform works, when
          they arise.
        </li>
      </ol>
      <p className="mt-4">
        Additionally, Community Moderators can help draw extra attention to
        bugs, feature requests, or other issues that affect the platform.
        Community Moderators are appointed democratically, by way of election.
        If you&apos;d like to register interest in becoming a Community
        Moderator, please do so by commenting to this effect in the comment
        section of{" "}
        <a href="https://www.metaculus.com/questions/5596/fall-2020-metaculus-moderator-election/">
          this discussion thread
        </a>
        , and we&apos;ll reach out to you before the next election takes place.
      </p>
    </PageWrapper>
  );
}
