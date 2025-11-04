import Link from "next/link";

import GlobalHeader from "../../../(main)/components/headers/global_header";
import PageWrapper from "../../../(main)/components/pagewrapper";

export const metadata = {
  title: "Official Rules - RAND x Metaculus Policy Challenge 2025",
  description:
    "Official rules and terms for the RAND x Metaculus Policy Challenge 2025 on Metaculus, including eligibility, prizes, and participation guidelines.",
};

export default function ContestRules() {
  return (
    <>
      <GlobalHeader />

      <PageWrapper>
        <h1 className="mt-16 md:mt-2">
          Official Competition Rules for the RAND x Metaculus Policy Challenge
          2025 (the &quot;Tournament&quot;)
        </h1>
        <p className="opacity-70">Last modified: September 30, 2025</p>
        <p className="mt-2">
          In any matter not expressly addressed in these rules, the{" "}
          <Link
            href="/tournament-rules/"
            className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            Standard Metaculus Contest Rules
          </Link>{" "}
          apply.
        </p>

        <hr className="my-4 border-t-2 border-gray-300 dark:border-gray-700" />

        <ol className="list-inside list-decimal space-y-6">
          <li>
            <b>Description of Tournament.</b> The Tournament, run by Metaculus,
            Inc. (&quot;Metaculus&quot;), tests participants&apos; ability to
            make probabilistic forecasts on policy-relevant questions. The RAND
            Corporation and the RAND Forecasting Initiative (&quot;RFI&quot;)
            are sponsors.
            <br />
            <br />
            Tournament page:{" "}
            <Link
              href="https://www.metaculus.com/tournament/rand/"
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://www.metaculus.com/tournament/rand/
            </Link>
            <br />
            <br />
            Registration page:{" "}
            <Link
              href="/rand"
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              https://www.metaculus.com/rand/
            </Link>
          </li>

          <li>
            <b>How to Enter and Participate.</b>
            <ul className="ml-6 mt-4 list-inside list-disc space-y-4">
              <li>
                Create a free Metaculus account and register for the Tournament
                via the Registration page, thereby accepting these Rules.
              </li>
              <li>
                Make forecasts on the Tournament questions on Metaculus. You may
                update forecasts at any time while questions are open.
              </li>
              <li>
                Prize eligibility requires completing the intake form and
                registering with your <b>school email address</b>. Institutional
                domains are <b>not</b> required; Metaculus will verify
                eligibility manually.
              </li>
              <li>
                One account per person. If you have a prior Metaculus account
                that does not use an institutional email, you may create a new
                account with your institutional email solely for this
                Tournament; do not use more than one account.
              </li>
              <li>
                Team entries are not permitted. Forecasts must be your own work.
              </li>
            </ul>
          </li>

          <li>
            <b>Eligibility.</b>
            <ul className="ml-6 mt-4 list-inside list-disc space-y-4">
              <li>
                Open to anyone to participate; prizes limited to undergraduate
                students (or international equivalent) enrolled as of October 1,
                2025.
              </li>
              <li>
                Full-time, part-time, and exchange/visiting students are
                eligible.
              </li>
              <li>No age minimum.</li>
            </ul>
          </li>

          <li>
            <b>Timing.</b>
            <ul className="ml-6 mt-4 list-inside list-disc space-y-4">
              <li>
                Official forecasting window: October 1, 2025 – December 31,
                2025.
              </li>
              <li>Winners announced mid-January 2026.</li>
            </ul>
          </li>

          <li>
            <b>Prizes.</b>
            <ul className="ml-6 mt-4 list-inside list-disc space-y-4">
              <li>Total prize pool: $10,000.</li>
              <li>
                $7,000 Accuracy Prizes based on Metaculus Tournament Scoring
                Rules (see{" "}
                <Link
                  href="https://www.metaculus.com/help/scores-faq/"
                  className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://www.metaculus.com/help/scores-faq/
                </Link>
                ).
              </li>
              <li>
                $3,000 Commentary Prizes for thoughtful comments that include
                key factors. Commentary winners will be selected by RFI judges
                using criteria such as clarity, substance, and usefulness to
                decision-makers.
              </li>
              <li>
                Payouts may be in cash or cash-equivalents (e.g., prepaid
                virtual cards or similar), at Metaculus&apos;s discretion.
              </li>
              <li>
                Prize recipients may be required to submit applicable tax forms
                (e.g., IRS W-9/W-8BEN or equivalents), and to provide payment
                details to receive funds.
              </li>
              <li>
                Metaculus may publish the final distribution of prizes prior to
                awards. If needed, Metaculus may update results to correct
                errors.
              </li>
            </ul>
          </li>

          <li>
            <b>Scoring and Resolution.</b>
            <ul className="ml-6 mt-4 list-inside list-disc space-y-4">
              <li>
                Participants are scored under Metaculus Tournament Scoring Rules
                (linked above).
              </li>
              <li>
                Scores are time-averaged; updating forecasts when information
                changes is encouraged.
              </li>
              <li>
                Metaculus determines final question resolutions at its
                discretion. In rare cases of ambiguity/annulment, affected
                questions will not be scored for the Tournament.
              </li>
            </ul>
          </li>

          <li>
            <b>Conduct and Use of Tools.</b>
            <ul className="ml-6 mt-4 list-inside list-disc space-y-4">
              <li>Bots/automation: Not permitted.</li>
              <li>
                Multiple accounts are prohibited except the clarified case in
                Section 2; do not submit forecasts from more than one account.
              </li>
              <li>
                Metaculus may disqualify participants for violating these Rules
                or the Metaculus Terms of Use/Privacy Policy.
              </li>
            </ul>
          </li>

          <li>
            <b>Data, Privacy, and Consent.</b>
            <ul className="ml-6 mt-4 list-inside list-disc space-y-4">
              <li>
                For this engagement, RFI will receive de-identified intake
                responses linked to each participant&apos;s public performance
                score.
              </li>
              <li>No individual forecast data will be shared with RFI.</li>
              <li>
                During registration, participants will see notice-and-consent
                language adapted for RAND/RFI reflecting the above.
              </li>
              <li>
                Contact with RAND/RFI: Metaculus will first contact winners and,
                with their confirmation, coordinate introductions to RAND/RFI.
                Metaculus will not share contact information directly with
                RAND/RFI without winner confirmation.
              </li>
              <li>
                Participation is subject to Metaculus&apos;s Terms of Use and
                Privacy Policy (linked on Metaculus).
              </li>
            </ul>
          </li>

          <li>
            <b>Optional Proficiency Exercise (External).</b> The Forecasting
            Research Institute offers an optional proficiency exercise. Taking
            this exercise will not affect Tournament standings. The link goes to
            an external site where FRI runs the study; Metaculus will not
            receive your data:{" "}
            <Link
              href="https://forecastingresearch.org/"
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://forecastingresearch.org/
            </Link>
          </li>

          <li>
            <b>Right to Cancel or Modify.</b> Metaculus and/or RFI may cancel,
            suspend, or modify the Tournament if unforeseen technical, legal, or
            other issues prevent it from running as planned.
          </li>

          <li>
            <b>Contact.</b> Questions about these Rules:{" "}
            <a
              href="mailto:support@metaculus.com"
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              support@metaculus.com
            </a>
          </li>
        </ol>
      </PageWrapper>
    </>
  );
}
