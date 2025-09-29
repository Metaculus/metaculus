import GlobalHeader from "@/app/(main)/components/headers/global_header";

export const metadata = {
  title: "Consent Form - RAND x Metaculus National Forecasting Tournament",
  description:
    "Consent form for participation in the RAND x Metaculus National Forecasting Tournament research study.",
};

export default async function ConsentFormPage() {
  return (
    <>
      <GlobalHeader />
      <div className="min-h-screen bg-gray-0 dark:bg-gray-0-dark">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-100-dark">
            <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-900-dark">
              Research Consent Form
            </h1>
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-800-dark">
              RAND x Metaculus National Forecasting Tournament
            </h2>

            <div className="space-y-6 text-gray-700 dark:text-gray-700-dark">
              <section>
                <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-800-dark">
                  Purpose of the Study
                </h3>
                <p>
                  You are being invited to participate in a research study
                  conducted by the RAND Corporation in partnership with
                  Metaculus. The purpose of this study is to understand
                  forecasting accuracy and decision-making among university
                  students, and to evaluate the effectiveness of different
                  forecasting training methods.
                </p>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-800-dark">
                  What You Will Be Asked to Do
                </h3>
                <p>If you agree to participate, you will be asked to:</p>
                <ul className="ml-6 list-disc space-y-1">
                  <li>
                    Complete registration information including your academic
                    background
                  </li>
                  <li>Participate in online forecasting activities</li>
                  <li>
                    Make predictions about future events on various topics
                  </li>
                  <li>
                    Potentially participate in training sessions or educational
                    materials
                  </li>
                  <li>
                    Complete periodic surveys about your forecasting experience
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-800-dark">
                  Time Commitment
                </h3>
                <p>
                  The tournament will run for approximately 8-12 weeks. Your
                  participation is voluntary, and you may choose how much time
                  to dedicate to forecasting activities.
                </p>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-800-dark">
                  Risks and Benefits
                </h3>
                <p>
                  There are minimal risks associated with this study. The main
                  risk is the time commitment required for participation.
                  Benefits include the opportunity to develop forecasting
                  skills, compete for prizes, and contribute to research that
                  may inform public policy decisions.
                </p>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-800-dark">
                  Confidentiality and Data Use
                </h3>
                <p>
                  Your personal information will be kept confidential. Data
                  collected may be used for research purposes, including
                  academic publications and policy recommendations. Any
                  published results will not include personally identifiable
                  information.
                </p>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-800-dark">
                  Voluntary Participation
                </h3>
                <p>
                  Your participation in this study is entirely voluntary. You
                  may choose not to participate or withdraw from the study at
                  any time without penalty. Your decision will not affect your
                  relationship with RAND Corporation, Metaculus, or your
                  educational institution.
                </p>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-800-dark">
                  Contact Information
                </h3>
                <p>
                  If you have questions about this study, please contact the
                  research team at{" "}
                  <a
                    href="mailto:forecasting-tournament@rand.org"
                    className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    forecasting-tournament@rand.org
                  </a>
                  .
                </p>
                <p className="mt-2">
                  If you have questions about your rights as a research
                  participant, you may contact the RAND Human Subjects
                  Protection Committee at{" "}
                  <a
                    href="mailto:hspc@rand.org"
                    className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    hspc@rand.org
                  </a>
                  .
                </p>
              </section>

              <section className="border-t border-gray-300 pt-6 dark:border-gray-300-dark">
                <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-800-dark">
                  Consent Statement
                </h3>
                <p className="font-medium">
                  By checking the consent box in the registration form, you
                  acknowledge that:
                </p>
                <ul className="ml-6 mt-2 list-disc space-y-1">
                  <li>You have read and understand this consent form</li>
                  <li>You understand that your participation is voluntary</li>
                  <li>
                    You understand the purposes, procedures, and potential risks
                    of the study
                  </li>
                  <li>You consent to participate in this research study</li>
                </ul>
              </section>
            </div>

            <div className="mt-8 text-center">
              <a
                href="/rand"
                className="inline-block rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Back to Registration
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
