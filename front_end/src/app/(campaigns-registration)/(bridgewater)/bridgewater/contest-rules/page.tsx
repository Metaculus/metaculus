import Link from "next/link";

import Button from "@/components/ui/button";

import GlobalHeader from "../../../../(main)/components/headers/global_header";
import PageWrapper from "../../../../(main)/components/pagewrapper";

export const metadata = {
  title: "Official Rules - Bridgewater Open Forecasting Tournament",
  description:
    "Official rules and terms for the Bridgewater Open Forecasting Tournament on Metaculus, including eligibility, prizes, and participation guidelines.",
};

export default function ContestRules() {
  return (
    <>
      <GlobalHeader />
      <div className="mx-auto mt-12 flex w-full justify-center pb-0 pt-10">
        <Button
          variant="secondary"
          className="cursor-pointer"
          href="/bridgewater/"
        >
          Register for the Tournament
        </Button>
      </div>

      <PageWrapper>
        <h1>
          Official Competition Rules for the Bridgewater Open Forecasting
          Tournament (the &quot;Tournament&quot;)
        </h1>
        <p className="opacity-70">Last modified: December 5, 2025</p>

        <hr className="my-4 border-t-2 border-gray-300 dark:border-gray-700" />

        <ul className="list-inside list-disc space-y-6">
          <li>
            <b>Description of Tournament.</b> The Tournament, run by Metaculus,
            Inc. (&quot;Metaculus&quot;), will test participants&apos; ability
            to make probabilistic forecasts on questions concerning future
            events across a variety of question types (binary, continuous,
            multiple choice, and conditional). Bridgewater Associates, LP
            (&quot;Bridgewater&quot;) may reach out to participants who perform
            well in the Tournament to gauge their interest in beginning a
            recruitment process for employment with Bridgewater. By entering and
            participating for the duration of the Tournament, you consent to
            Metaculus sharing your registration and performance information,
            including all personal information (which is information that can be
            used to identify or contact a specific individual, such as your name
            and email address) (&quot;Personal Information&quot;), with
            Bridgewater, and consent to Bridgewater contacting you via email
            following the competition regarding potential employment
            opportunities with Bridgewater.
          </li>
          <li>
            <b>How to Enter and Participate.</b> Any person wishing to
            participate must create a free Metaculus user account, if they do
            not already have one, and register for the tournament via the
            Tournament landing page, thereby accepting the Tournament terms and
            conditions. To make forecasts in this Tournament, visit the relevant
            forecasting question pages on Metaculus and submit your own
            probabilistic forecasts. To qualify for any of the prizes, you need
            to achieve a sufficiently high Peer Score, as assessed by
            Metaculus&apos;{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="/help/scores-faq/#tournament-scores"
            >
              Tournament Scoring Rules
            </a>
            . Note that you may update your forecasts as frequently as you want.
            No purchase or payment is necessary to enter or win. You may enter
            only once. Entering more than once will void all entries and result
            in disqualification. You may not enter more times than indicated by
            using multiple email addresses, identities, or devices in an attempt
            to circumvent the rules. Participants are not allowed to share
            accounts – forecasts must be your own work.
          </li>
          <li>
            <b>Eligibility.</b> Participants must be 18 years of age or older as
            of January 12, 2026. Employees of Metaculus and Bridgewater and
            their affiliates, subsidiaries, and agencies, and members of their
            immediate family or persons living in the same household are not
            eligible to participate. In compliance with U.S. laws and
            regulations, we cannot send monetary prizes, cash equivalents, or
            physical prizes to individuals located in countries subject to U.S.
            sanctions or export restrictions, including but not limited to
            Russia, Cuba, North Korea, and others as determined by current
            regulations. Automated systems, bots, artificial intelligence, or
            user accounts which are officially registered as bot accounts, are
            ineligible for tournament prizes. However, human participants are
            allowed to use AI tools or systems to assist in their forecasting,
            as long as the final submissions reflect their own decisions and
            understanding. Void where prohibited.
          </li>
          <li>
            <b>Timing.</b> The Tournament webpage will be made available on
            December 10, 2025. Practice questions will be available on the
            Metaculus platform from December 10, 2025 or earlier to January 11,
            2026. Official scored forecasting begins January 12, 2026, with
            additional questions posted January 19, 2026, January 26, 2026, and
            February 2, 2026. Final rankings will be determined and winners
            announced in mid March.
          </li>
          <li>
            <b>Prizes.</b> The Tournament will have a total prize pool of
            $30,000, which will be awarded to a number of participants based on
            their performance in the Tournament. The top 50 forecasters in the
            open category and 50 forecasters in the undergraduate category will
            be eligible for prizes.
          </li>
          <li>
            <b>Allocation of Prizes.</b> Allocation of prizes will be determined
            according to Metaculus&apos; Tournament Scoring Rules. Winners will
            receive payouts that depend on their rank and forecasting
            performance, according to their score. A total of $25,000 will be
            awarded across a maximum of 100 prize disbursements. An additional
            $5,000 in bonus prizes will be distributed to the top 10
            participants in the undergraduate category, who will receive $1,100,
            $900, $750, $600, $500, $400, $300, $200, $150, and $100,
            respectively. Payouts may be paid in the form of cash or a cash
            equivalent, which may include but is not limited to prepaid virtual
            cards, gift cards, or similar methods, at the discretion of
            Metaculus. Metaculus reserves the right to determine the specific
            form of payment, and no alternative form of payment will be offered
            unless explicitly provided by Metaculus. Participants will be scored
            using Metaculus Tournament Scoring Rules. The details of these
            scoring rules are mathematical (you may{" "}
            <Link
              href="/help/scores-faq/#tournament-scores"
              className="text-blue-600 hover:underline"
            >
              view the details here
            </Link>
            ), but there are three key features:
            <ul className="ml-6 mt-4 list-inside list-disc space-y-4">
              <li>
                You should expect to receive the highest score if you report
                your true beliefs. For continuous questions, this means that you
                should put the center of your distribution so that your
                probability of the true number falling outside of your reported
                confidence intervals actually reflects how confident you are.
              </li>
              <li>
                The scoring rules reward forecasters for being more accurate
                than the rest of the participants (Peer Score). This means
                it&apos;s worth doing equally a good job on questions that are
                difficult as it is for those which are relatively easy, as
                although your absolute accuracy might be worse for the former,
                you can still increase your score by beating the crowd.
              </li>
              <li>
                The score you are awarded is time-averaged over the time for
                which the question is open, such that the score you earn depends
                upon your predictions&apos; accuracy and when they are made.
                This means both that you should make your first prediction
                early, so as to be rewarded over more of the question&apos;s
                lifetime, and also that you should update your prediction
                anytime new information comes to light that alters your best
                estimate of the probability.
              </li>
            </ul>
            <p className="ml-6 mt-4">
              Metaculus will decide the final resolution of all questions at its
              sole and absolute discretion. Ambiguous or annulled question
              resolutions will be avoided to the maximum extent possible, but in
              the rare instances where they occur, those questions will no
              longer be scored as part of the tournament. Prize recipients will
              be required to verify their identity. Taxes and fees are paid by
              recipients.
            </p>
          </li>
          <li>
            <b>Right to cancel or modify.</b> Metaculus and/or Bridgewater
            reserve the right to cancel, suspend, or modify the Tournament if
            any unforeseen problem—technical, legal or otherwise—prevents the
            Tournament from running as planned.
          </li>
        </ul>

        <div className="mt-8 space-y-6">
          <p>
            Participation in the Tournament is additionally subject to the
            following Terms and Conditions:
          </p>

          <p className="font-bold">
            PLEASE NOTE THAT YOUR USE OF AND ACCESS TO OUR SERVICES (DEFINED
            BELOW) ARE SUBJECT TO THE FOLLOWING TERMS AND CONDITIONS. IF YOU DO
            NOT AGREE TO ALL OF THE FOLLOWING, YOU MAY NOT USE OR ACCESS THE
            SERVICES IN ANY MANNER.
          </p>
          <p>
            Welcome to Metaculus. Please read on to learn the rules and
            restrictions that govern your use of our website(s), products,
            services and applications (the &quot;Services&quot;). If you have
            any questions, comments, or concerns regarding these Terms or the
            Services, please contact Support [at] metaculus [dot] com. These
            Terms and Conditions and the site-wide{" "}
            <Link
              href="/terms-of-use"
              className="text-blue-600 hover:underline"
            >
              Terms of Use
            </Link>{" "}
            (collectively, the &quot;Terms&quot;) are a binding contract between
            you and Metaculus Inc. (&quot;Metaculus,&quot; &quot;we&quot; and
            &quot;us&quot;). In the event of a conflict between these Terms and
            Conditions and the site-wide Terms of Use, these Terms and
            Conditions shall control. You must agree to and accept all of the
            Terms, or you don&apos;t have the right to use the Services. Your
            use of the Services in any way means that you agree to all of these
            Terms, and these Terms will remain in effect while you use the
            Services. These Terms include the provisions in this document, as
            well as those in the Privacy Policy. In these Terms, the words
            &quot;include&quot; or &quot;including&quot; mean &quot;including
            but not limited to,&quot; and examples are for illustration purposes
            and are not limiting.
          </p>

          <ol className="list-inside list-decimal space-y-8">
            <li className="font-bold">Will these Terms ever change?</li>
            <p className="ml-6">
              We are constantly trying to improve our Services, so these Terms
              may need to change along with the Services. We reserve the right
              to change the Terms at any time, but if we do, we will bring it to
              your attention by placing a notice on the Metaculus website, by
              sending you an email, or by some other means. Changes will become
              effective no sooner than the day after they are posted. However,
              changes addressing new functions for a Service or changes made for
              legal reasons will be effective immediately. If you don&apos;t
              agree with the new Terms, you are free to reject them by ceasing
              all use of the Services. If you use the Services in any way after
              a change to the Terms is effective, that means you agree to all of
              the changes. Except for changes by us as described here, no other
              amendment or modification of these Terms will be effective unless
              in writing and signed by both you and us.
            </p>

            <li className="font-bold">What about my privacy?</li>
            <p className="ml-6">
              Metaculus takes the privacy of its users very seriously. For the
              current Metaculus Privacy Policy, please{" "}
              <Link
                href="/privacy-policy/"
                className="text-blue-600 hover:underline"
              >
                click here
              </Link>
              . By entering and participating for the duration of the
              Tournament, you consent to Metaculus sharing your registration,
              Personal Information and performance information with Bridgewater
              Associates, LP (&quot;<b>Bridgewater</b>&quot;), and consent to
              Bridgewater contacting you via email following the competition.
            </p>

            <li className="font-bold">
              What are the basics of using Metaculus?
            </li>
            <p className="ml-6">
              You are required to sign up for an account and select a password
              and username (&quot;<b>Metaculus User ID</b>&quot;). You promise
              to provide us with accurate, complete, and updated registration
              information about yourself. You may not select as your Metaculus
              User ID a name that you don&apos;t have the right to use, or
              another person&apos;s name with the intent to impersonate that
              person. You may not transfer your account to anyone else without
              our prior written permission. You may not have or control more
              than one active Metaculus User ID at any time. If we determine
              that you are operating under more than one Metaculus User ID, we
              may disqualify you from the Tournament without notice and revoke
              access to your Metaculus User ID.
            </p>
            <li className="font-bold">
              Are there any additional restrictions on my use of the Services?
            </li>
            <p className="ml-6">
              Yes. You represent, warrant, and agree that you will not
              contribute any Content or User Submission or otherwise use the
              Services or interact with the Services in a manner that:
            </p>
            <ul className="ml-12 mt-4 list-inside list-disc space-y-4">
              <li>
                Is harmful, threatening, harassing, defamatory, obscene, or
                otherwise objectionable;
              </li>
              <li>
                &quot;Crawls,&quot; &quot;scrapes,&quot; or &quot;spiders&quot;
                any page, data, or portion of or relating to the Services or
                Content (through use of manual or automated means);
              </li>
              <li>Copies or stores any significant portion of the Content;</li>
              <li>
                Decompiles, reverse engineers, or otherwise attempts to obtain
                the source code or underlying ideas or information relating to
                the Services.
              </li>
              <li>
                Processes or stores any data that is subject to the
                International Traffic in Arms Regulations maintained by the U.S.
                Department of State.
              </li>
            </ul>
            <p className="ml-6 mt-4">
              Without limitation to any other remedies available to Metaculus, a
              violation of any of the foregoing is grounds for termination of
              your right to use or access the Services. We reserve the right to
              remove any Content or User Submissions from the Services at any
              time, for any reason (including if someone alleges, and, Metaculus
              in its sole and absolute discretion determines that, you
              contributed that Content in violation of these Terms), and without
              notice.
            </p>

            <li className="font-bold">What are my rights in Metaculus?</li>
            <p className="ml-6">
              The materials displayed or performed or available on or through
              the Services, including text, graphics, data, articles, photos,
              images, illustrations, and User Submissions (collectively, the
              &quot;Content&quot;), are protected by copyright and other
              intellectual property laws. You promise to abide by all copyright
              notices, trademark rules, information, and restrictions contained
              in any Content you access through the Services, and you won&apos;t
              use, copy, reproduce, modify, translate, publish, broadcast,
              transmit, distribute, perform, upload, display, license, sell or
              otherwise exploit for any purpose any Content not owned by you,
              (i) without the prior consent of the owner of that Content or (ii)
              in a way that violates someone else&apos;s (including
              Metaculus&apos;s) rights.
            </p>
            <p className="ml-6">
              You understand that Metaculus owns the Services. You won&apos;t
              modify, publish, transmit, participate in the transfer or sale of,
              reproduce (except as expressly provided in this Section), create
              derivative works based on, or otherwise exploit any of the
              Services.
            </p>
            <p className="ml-6">
              The Services may allow you to copy or download certain Content;
              please remember that just because this functionality exists, it
              doesn&apos;t mean that all the restrictions above don&apos;t apply
              — they do!
            </p>
            <li className="font-bold">
              Who is responsible for what I see and do on the Services?
            </li>
            <p className="ml-6">
              Any information or content publicly posted or privately
              transmitted through the Services is the sole responsibility of the
              person from whom such content originated, and you access all such
              information and content at your own risk. We aren&apos;t liable
              for any errors or omissions in that information or content or for
              any damages or loss you might suffer in connection with it. We
              cannot control and have no duty to take any action regarding how
              you may interpret and use the Content or what actions you may take
              as a result of having been exposed to the Content, and you release
              us from all liability for you having acquired or not acquired
              Content through the Services. We can&apos;t guarantee the identity
              of any users with whom you interact in using the Services and are
              not responsible for which users gain access to the Services.
            </p>
            <p className="ml-6">
              You are responsible for all Content you contribute to the
              Services, and you represent and warrant you have all rights
              necessary to do so.
            </p>
            <p className="ml-6">
              The Services may contain links, information or connections to
              third-party websites or services that are not owned or controlled
              by Metaculus. When you access third-party websites or engage with
              third-party services, you accept that there are risks in doing so,
              and that Metaculus is not responsible for such risks. We encourage
              you to be aware when you leave the Services and to read the terms
              and privacy policy of each third-party website or service that you
              visit or utilize.
            </p>
            <p className="ml-6">
              Metaculus has no control over, and assumes no responsibility for,
              the content, accuracy, privacy policies, or practices of or
              opinions expressed in any third-party websites or by any third
              party that you interact with through the Services. In addition,
              Metaculus will not and cannot monitor, verify, censor or edit the
              content of any third-party site or service. By using the Services,
              you release and hold us and Bridgewater harmless from any and all
              liability arising from your use of any third-party website or
              service.
            </p>
            <p className="ml-6">
              Your interactions with organizations or individuals found on or
              through the Services, including payment and delivery of goods or
              services, and any other terms, conditions, warranties or
              representations associated with such dealings, are solely between
              you and such organizations or individuals. You should make
              whatever investigation you feel necessary or appropriate before
              proceeding with any online or offline transaction with any of
              these third parties. You agree that Metaculus and Bridgewater will
              not be responsible or liable for any loss or damage of any sort
              incurred as the result of any such dealings.
            </p>
            <li className="font-bold">
              What are the rules for competitions on Metaculus?
            </li>
            <p className="ml-6">
              The Tournament is run according to rules that describe
              participation guidelines, the criteria used to select a winner of
              the Competition as posted on Metaculus&apos; Web Site. The
              prize(s) awarded to such winner(s), and when such prize(s) will be
              awarded will be posted on our Site. Such rules and selection
              criteria must comply with all applicable laws, our{" "}
              <Link
                href="/tournament-rules"
                className="text-blue-600 hover:underline"
              >
                site-wide competition rules
              </Link>
              , and these Terms (collectively, &quot;Competition Rules&quot;).
              Such Competition Rules will also include how and when a
              Participant User must submit Competition Entries (defined below)
              and the rights that any third-party will be granted in such
              Competition Entry upon selecting any such Competition Entry as a
              winner (&quot;Winning Entry&quot;). Certain rights granted in the
              Competition Entries and Winning Entries are described in Section 9
              (Do I have to grant any licenses to Metaculus or to other users?)
              below. The Competition Rules may impose additional restrictions or
              requirements for Competitions.
            </p>
            <p className="ml-6">
              Each Participant User will comply with all Competition Rules.
            </p>
            <p className="ml-6">
              You acknowledge and agree that Metaculus may, without any
              liability but without any obligation to do so, remove or
              disqualify a Participant User, if Metaculus believes that such
              Participant User is in violation these Terms or otherwise poses a
              risk to Metaculus, the Service or another user of the Service.
            </p>
            <p className="ml-6">
              Regardless of anything to the contrary, Participant Users
              acknowledge and agree that Metaculus and Bridgewater have no
              obligation to hold a Competition Entry in confidence or otherwise
              restrict their activities based on receipt of such Competition
              Entry. Metaculus and Bridgewater have no obligation to become
              involved in disputes between users or between users and any third
              party relating the use of the Services. When you participate in a
              Competition, you release Metaculus and Bridgewater from claims,
              damages, and demands of every kind — known or unknown, suspected
              or unsuspected, disclosed or undisclosed — arising out of or in
              any way related to such disputes and the Services. All content you
              access or submit via the Services is at your own risk.
            </p>

            <li className="font-bold">How are prizes awarded?</li>
            <p className="ml-6">
              At the conclusion of the tournament, Metaculus will publish an
              announcement of the rankings and winners, reflecting the final
              leaderboard ranking. Metaculus may remove a Participant User at
              any time, including in the final announcement of the rankings and
              winners, if Metaculus believes that the Participant User is not
              eligible to receive a prize, is in violation of these Terms, or
              has cheated in the tournament.
            </p>
            <p className="ml-6">
              Prize winners will be notified by email, with instructions
              describing steps that must be taken by winners in order to receive
              the prize. The email may contain reasonable time period(s) by
              which certain steps must be completed in order to receive the
              prize. If the Participant User fails to respond to this email, or,
              during subsequent communications, fails to provide the necessary
              information within the sooner of (i) the time period(s) described
              in the email or (ii) 40 days after Metaculus sent the winner
              notification email, such Participant User will be deemed to have
              forfeited the prize and waived any and all claims against
              Metaculus or Bridgewater with respect to such prize winnings.
            </p>
            <p className="ml-6">
              In order to receive the prize, prize winners must sign and return
              any and all acceptance documents as may be required by Metaculus
              and Bridgewater, and provide any and all information Metaculus
              deems necessary to deliver the prize, including without
              limitation: (a) eligibility certifications or proof of identity;
              (b) U.S. tax forms (such as IRS Form W-9 if U.S. resident, IRS
              Form W-8BEN if foreign resident, or future equivalents); (c)
              payment delivery information, such as bank account information,
              provided to Metaculus or via a third-party service as instructed
              by Metaculus.
            </p>
            <p className="ml-6">
              Metaculus and Bridgewater shall have no liability for any
              failures, delays, or errors in email delivery, including but not
              limited to instances where notifications sent to prize winners are
              not received, are delayed, or are sent to incorrect email
              addresses. Additionally, Metaculus and Bridgewater are not liable
              for the failure of delivery of prizes sent electronically or
              physically, including but not limited to issues arising from
              incorrect or outdated recipient information provided by the
              Participant User, errors or delays by third-party delivery or
              courier services, or any other unforeseen circumstances. It is the
              sole responsibility of the Participant User to provide accurate
              and up-to-date contact and delivery information. Metaculus assumes
              no liability for any consequences arising from incorrect
              information or issues related to third-party service providers.
            </p>
            <p className="ml-6">
              Metaculus reserves the right to update or otherwise correct the
              leaderboard, winners announcement, and communications about prizes
              and winners if Metaculus believes there are any errors in the
              same, or if Metaculus believes that Participant Users must be
              removed or disqualified for ineligibility or violations of these
              Terms.
            </p>
            <p className="ml-6">
              Metaculus awards tournament prizes based on the information
              available and the determinations Metaculus has made at the time
              tournament winners are announced. While Metaculus retains sole
              discretion to re-resolve questions where it believes an error
              occurred in prior resolutions, it is the general policy of
              Metaculus that such re-resolutions will not result in the issuance
              of additional prizes, compensation, or modifications to previously
              announced prizes or official tournament placements.
              Notwithstanding this general policy, Metaculus reserves the right,
              at its sole discretion, to offer additional prizes or compensation
              for questions that re-resolve after tournament winners have been
              announced; however, Metaculus is under no obligation to do so.
            </p>

            <li className="font-bold">
              Do I have to grant any licenses to Metaculus or to other users?
            </li>
            <p className="ml-6">
              Anything you post, upload, share, store, or otherwise provide
              through the Services is your &quot;User Submission.&quot; Some
              User Submissions are viewable or downloadable by other users. To
              display your User Submissions on the Services, and to allow other
              users to enjoy them (where applicable), you grant us certain
              rights in those User Submissions. Please note that all of the
              following licenses are subject to our Privacy Policy to the extent
              they relate to User Submissions that are also your personal
              information.
            </p>
            <p className="ml-6">
              For all User Submissions, you grant Metaculus a license to
              translate, modify (for technical purposes, for example making sure
              your content is viewable on a mobile device as well as a
              computer), display, distribute and reproduce and otherwise act
              with respect to such User Submissions, in each case to enable us
              to operate the Services, as described in more detail below. You
              acknowledge and agree that Metaculus, in performing the required
              technical steps to provide the Services to our users (including
              you), may need to make changes to your User Submissions to conform
              and adapt those User Submissions to the technical requirements of
              communication networks, devices, services, or media, and the
              licenses you grant under these Terms include the rights to do so.
              You also agree that all of the licenses you grant under these
              Terms are royalty-free, perpetual, irrevocable, and worldwide.
              These are licenses only — your ownership in User Submissions is
              not affected.
            </p>
            <p className="ml-6">
              If you share a User Submission publicly on the Services or in a
              manner that allows more than just you or certain specified users
              to view it (such as a Dataset), or if you provide us with any
              feedback, suggestions, improvements, enhancements, or feature
              requests relating to the Services (each a &quot;Public User
              Submission&quot;), then you grant Metaculus the license stated in
              the second paragraph of this Section 8, as well as a license to
              display, perform, and distribute your Public User Submission for
              the purpose of making that Public User Submission accessible to
              all Metaculus users and providing the Services necessary to do so,
              as well as all other rights necessary to use and exercise all
              rights in that Public User Submission in connection with the
              Services for any purpose. Also, you grant all other users of the
              Services a license to access that Public User Submission, and to
              use and exercise all rights in it, as permitted by the
              functionality of the Services.
            </p>
            <p className="ml-6">
              If you are a Participant User and submit an entry to a Competition
              (&quot;Competition Entry&quot;), then you grant Metaculus the
              license stated in the second paragraph of this Section 8, as well
              as a license to display, perform, and distribute your Competition
              Entry for the purpose of making that Competition Entry accessible
              to any third parties described in the Competition Rules, making
              that Competition Entry available to other Metaculus users as part
              of a Dataset, and providing the Services necessary to do so. You
              are also granting to any of Metaculus&apos; customers who have
              entered into a sponsorship or other arrangement with us to host
              the Competition in which you participate, the same scope of
              licensed rights to those granted to Metaculus to use your
              Competition Entry. If you win a Competition, your Competition
              Entry for such Competition may be subject to further licensing as
              stated in the Competition Rules, and these Terms, but other than
              the limited licenses stated in these Terms, the intellectual
              property rights in your Competition Entries will not be
              transferred or licensed to the Competition Sponsor.
            </p>

            <li className="font-bold">
              What if I see something on the Services that infringes my
              copyright?
            </li>
            <p className="ml-6">
              You may have heard of the Digital Millennium Copyright Act (the
              &quot;
              <b>DMCA</b>&quot;), as it relates to online service providers,
              like Metaculus, being asked to remove material that allegedly
              violates someone&apos;s copyright. We respect others&apos;
              intellectual property rights, and we reserve the right to delete
              or disable Content alleged to be infringing, and to terminate the
              accounts of repeat alleged infringers. To report potentially
              infringing content, contact{" "}
              <a
                href="mailto:support@metaculus.com"
                className="text-blue-600 hover:underline"
              >
                support@metaculus.com
              </a>
              . To learn more about the DMCA,{" "}
              <a
                href="https://www.copyright.gov/dmca/"
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                click here
              </a>
              .
            </p>
            <li className="font-bold">
              Will Metaculus ever change the Services?
            </li>
            <p className="ml-6">
              We&apos;re always trying to improve the Services, so they may
              change over time. We may suspend or discontinue any part of the
              Services, or we may introduce new features or impose limits on
              certain features or restrict access to parts or all of the
              Services. We&apos;ll do our best to give you notice when we make a
              material change to the Services, but we ask for your understanding
              in cases where this isn&apos;t practical.
            </p>

            <li className="font-bold">
              What if I want to stop using Metaculus?
            </li>
            <p className="ml-6">
              If you do not have any active Competitions that you are hosting,
              then you&apos;re free to stop using the Service at any time.
              Please refer to our Privacy Policy, as well as the licenses above,
              to understand how we treat information you provide to us after you
              have stopped using our Services. If you are hosting active
              Competitions then you should complete the Competitions, in full,
              before you stop using the Services.
            </p>
            <p className="ml-6">
              Metaculus is also free to terminate (or suspend access to) your
              use of the Services or your account, for any reason in our
              discretion, including your breach of these Terms. Metaculus has
              the sole right to decide whether you are in violation of any of
              the restrictions in these Terms.
            </p>
            <p className="ml-6">
              Account termination may result in destruction of any Content
              associated with your account, so please keep that in mind before
              you decide to terminate your account.
            </p>
            <p className="ml-6">
              Provisions that, by their nature, should survive termination of
              these Terms will survive termination. By way of example, all of
              the following will survive termination: any obligation you have to
              pay us or indemnify us, any limitations on our liability, any
              terms regarding ownership or intellectual property rights, and
              terms regarding disputes between us.
            </p>

            <li className="font-bold">What else do I need to know?</li>
            <p className="ml-6">
              Warranty Disclaimer. Neither Metaculus nor its licensors or
              suppliers or Bridgewater makes any representations or warranties
              concerning any content contained in or accessed through the
              Services (including Competitions), and we will not be responsible
              or liable for the accuracy, copyright compliance, legality, or
              decency of material contained in or accessed through the Services.
              We (and our licensors and suppliers) make no representations or
              warranties regarding suggestions or recommendations of services or
              products offered or purchased through the Services. Products and
              services purchased or offered (whether or not following such
              recommendations and suggestions) through the Services are provided
              &quot;AS IS&quot; and without any warranty of any kind from
              Metaculus or others (unless, with respect to such others only,
              provided expressly and unambiguously in writing by a designated
              third-party for a specific product). THE SERVICES AND CONTENT ARE
              PROVIDED BY METACULUS (AND ITS LICENSORS AND SUPPLIERS) ON AN
              &quot;AS-IS&quot; BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER
              EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              NON-INFRINGEMENT, OR THAT USE OF THE SERVICES WILL BE
              UNINTERRUPTED OR ERROR-FREE. SOME STATES DO NOT ALLOW LIMITATIONS
              ON HOW LONG AN IMPLIED WARRANTY LASTS, SO THE ABOVE LIMITATIONS
              MAY NOT APPLY TO YOU.
            </p>
            <p className="ml-6">
              Limitation of Liability. TO THE FULLEST EXTENT ALLOWED BY
              APPLICABLE LAW, UNDER NO CIRCUMSTANCES AND UNDER NO LEGAL THEORY
              (INCLUDING TORT, CONTRACT, NEGLIGENCE, STRICT LIABILITY, OR
              OTHERWISE) WILL METACULUS (OR ITS LICENSORS OR SUPPLIERS) OR
              BRIDGEWATER BE LIABLE TO YOU OR TO ANY OTHER PERSON FOR (A) ANY
              INDIRECT, SPECIAL OR INCIDENTAL DAMAGES OF ANY KIND, INCLUDING
              DAMAGES FOR LOST PROFITS, LOSS OF GOODWILL, WORK STOPPAGE,
              ACCURACY OF RESULTS, OR COMPUTER FAILURE OR MALFUNCTION, OR (B)
              ANY AMOUNT, IN THE AGGREGATE, IN EXCESS OF THE GREATER OF (I) $100
              OR (II) THE AMOUNTS PAID BY YOU TO METACULUS IN CONNECTION WITH
              THE SERVICES IN THE TWELVE (12) MONTH PERIOD PRECEDING THIS
              APPLICABLE CLAIM, OR (C) ANY MATTER BEYOND OUR REASONABLE CONTROL.
              SOME STATES DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN
              DAMAGES, SO THE ABOVE LIMITATION AND EXCLUSIONS MAY NOT APPLY TO
              YOU.
            </p>
            <p className="ml-6">
              Indemnity. To the fullest extent allowed by applicable law, you
              will defend, indemnify and hold Metaculus and Bridgewater, and
              their respective affiliates, officers, agents, employees, and
              partners harmless from and against any and all claims,
              liabilities, damages (actual and consequential), losses and
              expenses (including attorneys&apos; fees) arising from or in any
              way related to any third-party claims (including from other users)
              relating to (a) your submissions to the Services including any
              Content, User Submissions or Competitions, (b) your use of the
              Services (including any actions taken by a third-party using your
              account), and (C) your violation of these Terms.
            </p>
            <p className="ml-6">
              Assignment. You may not assign, delegate or transfer these Terms
              or your rights or obligations hereunder, or your Services account,
              in any way (by operation of law or otherwise) without
              Metaculus&apos;s prior written consent. We may transfer, assign,
              or delegate these Terms and our rights and obligations without
              consent.
            </p>

            <li className="font-bold">About These Terms</li>
            <p className="ml-6">
              These Terms control the relationship between Metaculus and you.
              They do not create any third-party beneficiary rights.
            </p>
            <p className="ml-6">
              If you do not comply with these Terms, and we don&apos;t take
              action right away, this doesn&apos;t mean that we are giving up
              any rights that we may have (such as taking action in the future).
            </p>
            <p className="ml-6">
              If it turns out that a particular term is not enforceable, this
              will not affect any other part of the Terms.
            </p>
            <p className="ml-6">
              The laws of California, USA, excluding California&apos;s conflict
              of laws rules, will apply to any disputes arising out of or
              relating to these Terms or the Services. All claims arising out of
              or relating to these Terms or the Services will be litigated
              exclusively in the federal or state courts of San Francisco,
              California, USA, and you and Metaculus consent to personal
              jurisdiction in those courts.
            </p>
          </ol>
        </div>
      </PageWrapper>
    </>
  );
}
