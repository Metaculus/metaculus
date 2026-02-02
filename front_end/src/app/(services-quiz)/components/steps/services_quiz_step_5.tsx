"use client";

import { useTranslations } from "next-intl";

import { useServicesQuizAnswers } from "../quiz_state/services_quiz_answers_provider";

const ServicesQuizStep5: React.FC = () => {
  const t = useTranslations();
  const { state, setContactName, setContactEmail } = useServicesQuizAnswers();

  return (
    <div className="mx-auto max-w-md">
      <h2 className="m-0 text-center text-2xl font-bold leading-8 text-blue-800 dark:text-blue-800-dark">
        {t("submitYourAnswersTitle")}
      </h2>

      <div className="mt-8 flex flex-col gap-3">
        <label className="text-sm">
          {t("yourName")}
          <input
            value={state.contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="mt-1 w-full rounded border border-gray-200 bg-gray-0 p-2 text-sm dark:border-gray-200-dark dark:bg-gray-0-dark"
          />
        </label>

        <label className="text-sm">
          {t("emailAddress")}
          <input
            value={state.contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="mt-1 w-full rounded border border-gray-200 bg-gray-0 p-2 text-sm dark:border-gray-200-dark dark:bg-gray-0-dark"
          />
        </label>
      </div>
    </div>
  );
};

export default ServicesQuizStep5;
