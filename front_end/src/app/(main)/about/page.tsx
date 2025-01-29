import { getLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { AboutHeader } from "./components/AboutHeader";
import TeamBlock from "./components/TeamBlock";
import content_pt from "./page_pt";
import EngageBlock from "../(home)/components/engage_block";

export const metadata = {
  title: "About Metaculus",
  description:
    "Metaculus is an online forecasting platform and aggregation engine working to improve human reasoning and coordination on topics of global importance.",
};

export default async function AboutPage() {
  const locale = await getLocale();
  if (locale === "pt") {
    return content_pt();
  }

  const t = await getTranslations();
  const numbers = [
    {
      title: "Predictions",
      number: "2,133,159",
    },
    {
      title: "Questions",
      number: "17,357",
    },
    {
      title: "Resolved Questions",
      number: "6,654",
    },
    {
      title: "Years of Predictions",
      number: "10",
    },
  ];
  return (
    <div className="prose container mx-auto my-0 max-w-6xl rounded bg-transparent p-3.5 pt-2 dark:bg-blue-900 dark:bg-transparent md:my-10 md:px-6 md:py-4 [&_a:hover]:text-blue-800 [&_a:hover]:underline [&_a:hover]:dark:text-blue-200 [&_a]:text-blue-700 [&_a]:dark:text-blue-400 [&_h1]:mb-4 [&_hr]:border-gray-300 [&_hr]:dark:border-blue-700">
      <div>
        <h1 className="mt-8 text-center text-4xl md:mt-6 md:text-left md:text-5xl">
          {t.rich("aboutMetaculusTitle", {
            blue: (chunks) => <span className="text-blue-600">{chunks}</span>,
          })}
        </h1>
        <p className="max-w-2xl text-center text-xl text-blue-700 dark:text-blue-300 md:mt-10 md:text-left md:text-2xl">
          {t("aboutMetaculusDescription")}
        </p>
      </div>
      <AboutHeader className="text-metac-blue-800 dark:text-metac-blue-800-dark -mt-40 hidden xl:block" />
      <div className="my-10 md:my-20">
        <div className="grid gap-2 xs:grid-cols-2 lg:grid-cols-4">
          {numbers.map(({ title, number }) => (
            <div
              key={title}
              className="flex flex-col bg-white py-6 dark:bg-blue-900"
            >
              <span className="mb-2 mt-0 text-center text-sm font-bold uppercase text-blue-700 dark:text-blue-700-dark">
                {title}
              </span>
              <span className="m-0 text-center text-4xl font-bold tracking-wider text-blue-800 dark:text-blue-800-dark">
                {number}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="my-4 flex flex-col gap-10 md:my-28 md:flex-row lg:gap-14">
        <div className="flex flex-1 flex-col justify-center px-4 text-center text-xl text-blue-700 dark:text-blue-300 md:px-0 md:text-left md:text-2xl">
          <p>
            Metaculus is a{" "}
            <span className="bg-[#feffbc] dark:bg-[#feffbc]/25">
              Public Benefit Corporation
            </span>
            .
          </p>
          <p>
            This organizational structure enables us to serve the public good
            through the following commitments in our charter:
          </p>
        </div>
        <ol className="relative flex flex-1 list-none flex-col gap-6 pl-20 text-lg text-blue-700 dark:text-blue-300 md:gap-14 md:text-xl">
          {[
            "Fostering the growth, learning, and development of the forecasting and forecasting research communities.",
            "Supporting stakeholders who are serving the public good by informing their decision making.",
            "Increasing public access to information regarding forecasts of public interest.",
          ].map((text, i) => (
            <li key={i}>
              <span className="absolute left-4 flex size-10 items-center justify-center rounded-full bg-white text-xl font-bold dark:bg-blue-900 md:left-0 md:size-14 md:text-3xl">
                {i + 1}
              </span>
              {text}
            </li>
          ))}
        </ol>
      </div>
      <div className="my-16 flex flex-col gap-5 rounded bg-blue-900 p-8 dark:bg-blue-300 sm:px-16 md:my-36 md:flex-row md:gap-10 md:p-12 md:py-20">
        <h2 className="my-0 flex-1 text-center text-2xl uppercase tracking-wide text-blue-500 dark:text-blue-500-dark md:my-auto md:text-left">
          Mission
        </h2>
        <p className="my-auto flex-[4] text-center font-serif text-xl text-white antialiased dark:text-blue-900 md:my-auto md:text-left md:text-2xl">
          To build epistemic infrastructure that enables the global community to
          model, understand, predict, and navigate the world’s most important
          and complex challenges.
        </p>
      </div>
      <TeamBlock />
      <EngageBlock />
    </div>
  );
}
