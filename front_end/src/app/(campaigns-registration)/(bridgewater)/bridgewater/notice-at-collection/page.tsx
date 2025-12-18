import Link from "next/link";

import Button from "@/components/ui/button";

import GlobalHeader from "../../../../(main)/components/headers/global_header";
import PageWrapper from "../../../../(main)/components/pagewrapper";

export const metadata = {
  title: "Notice at Collection - Bridgewater Open Forecasting Tournament",
  description:
    "Information about personal data collection and sharing for the Bridgewater Open Forecasting Tournament on Metaculus.",
};

export default function NoticeAtCollection() {
  return (
    <>
      <GlobalHeader />
      <div className="mx-auto mt-12 flex w-full justify-center pb-0 pt-10">
        <Button
          variant="secondary"
          className="cursor-pointer"
          href="/bridgewater/"
        >
          View Tournament Page
        </Button>
      </div>
      <PageWrapper>
        <h1>Notice at Collection</h1>

        <hr className="my-4 border-t-2 border-gray-300 dark:border-gray-700" />

        <div className="space-y-4">
          <p>
            Metaculus, Inc. (&quot;
            <b>
              <i>Metaculus</i>
            </b>
            &quot;) is collecting your personal information to support its
            business operations, including the business purposes listed in the
            chart below. We do not collect sensitive personal information.
          </p>

          <p>
            We may transfer or share some categories of personal information we
            collect to Bridgewater Associates, LP (&quot;
            <b>
              <i>Bridgewater</i>
            </b>
            &quot;), as indicated in the chart below. By entering and
            participating in this tournament, you are consenting to the
            collection, use, and sharing of information as described below. To
            opt-out of personal information sales or sharing, you may withdraw
            and cancel your participation in the tournament at any time prior to
            its conclusion by emailing{" "}
            <a
              href="mailto:contact@metaculus.com"
              className="text-blue-600 hover:underline"
            >
              contact@metaculus.com
            </a>
            .
          </p>

          <p>
            To view our full privacy policy, visit{" "}
            <Link
              href="/privacy-policy/"
              className="text-blue-600 hover:underline"
            >
              here
            </Link>
            .
          </p>

          <p>
            We may collect the personal information categories listed in the
            table below. The table also lists, for each category, our expected
            retention period, use purposes, and whether we share the
            information.
          </p>
        </div>
        <hr className="my-4 border-t-2 border-gray-300 dark:border-gray-700" />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead>
              <tr className="bg-blue-100 dark:bg-blue-800">
                <th className="px-4 py-3 text-left">
                  Personal Information Category
                </th>
                <th className="px-4 py-3 text-left">Retention Period</th>
                <th className="px-4 py-3 text-left">Business Purpose</th>
                <th className="px-4 py-3 text-left">Shared</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-6 align-top">
                  <b>Identifiers</b>, including real name, email address, and
                  account name
                </td>
                <td className="px-4 py-6 align-top">Indefinitely.</td>
                <td className="px-4 py-6 align-top">
                  Metaculus uses identifiers to maintain your Metaculus account.
                  Metaculus collects your real name and email address in
                  connection with this tournament to enable its contractual
                  counterparty Bridgewater to reach out at the conclusion of the
                  tournament for potential recruitment purposes. Metaculus may
                  use your email address to provide you information about the
                  tournament.
                </td>
                <td className="px-4 py-6 align-top">
                  Real name and email address may be shared with Bridgewater
                </td>
              </tr>

              <tr>
                <td className="px-4 py-6 align-top">
                  <b>Residency</b>, specifically the country in which you reside
                </td>
                <td className="px-4 py-6 align-top">
                  For the duration of the tournament.
                </td>
                <td className="px-4 py-6 align-top">
                  Residency is used to verify eligibility for this tournament.
                </td>
                <td className="px-4 py-6 align-top">
                  Residency information may be shared with Bridgewater
                </td>
              </tr>

              <tr>
                <td className="px-4 py-6 align-top">
                  <b>Education-related information</b>, specifically whether you
                  are currently an undergraduate student, and if so, the
                  institution that you attend and your class year
                </td>
                <td className="px-4 py-6 align-top">
                  For the duration of the tournament.
                </td>
                <td className="px-4 py-6 align-top">
                  Metaculus collects education related information to enable its
                  contractual counterparty Bridgewater to determine what
                  potential recruitment outreach may be appropriate at the
                  conclusion of the tournament.
                </td>
                <td className="px-4 py-6 align-top">
                  Education-related information may be shared with Bridgewater
                </td>
              </tr>
              <tr>
                <td className="px-4 py-6 align-top">
                  <b>Your submissions</b>, including all responses you give to
                  forecasting questions and any comments you submit during the
                  tournament
                </td>
                <td className="px-4 py-6 align-top">Indefinitely</td>
                <td className="px-4 py-6 align-top">
                  Metaculus uses your forecasting submissions to determine
                  ranking and winners of the tournament. Metaculus also uses
                  forecasting submissions to fine tune its own algorithms.
                </td>
                <td className="px-4 py-6 align-top">
                  Your submissions in the tournament may be shared with
                  Bridgewater
                </td>
              </tr>

              <tr>
                <td className="px-4 py-6 align-top">
                  <b>Performance information</b>, including your ranking in the
                  tournament
                </td>
                <td className="px-4 py-6 align-top">Indefinitely</td>
                <td className="px-4 py-6 align-top">
                  Metaculus uses your performance information in the tournament
                  to fine tune its own algorithms. Metaculus also derives
                  rankings in the tournament to enable its contractual
                  counterparty Bridgewater to determine what potential
                  recruitment outreach may be appropriate at the conclusion of
                  the tournament.
                </td>
                <td className="px-4 py-6 align-top">
                  Your ranking in the tournament may be shared with Bridgewater
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <hr className="my-4 border-t-2 border-gray-300 dark:border-gray-700" />

        <p className="mt-4">
          If you have any questions about this Notice or need to access it in an
          alternative format due to having a disability, please contact{" "}
          <a
            href="mailto:contact@metaculus.com"
            className="text-blue-600 hover:underline"
          >
            contact@metaculus.com
          </a>
          .
        </p>
      </PageWrapper>
    </>
  );
}
