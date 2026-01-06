import Image from "next/image";
import Link from "next/link";
import { getLocale } from "next-intl/server";

import DisclosureSection from "./components/DisclosureSection";
import ReferenceSection from "./components/ReferenceSection";
import content_pt from "./page_pt";
import PageWrapper from "../components/pagewrapper";

export const metadata = {
  title: "Metaculus for Journalists",
  description:
    "Learn about Metaculus community etiquette, moderation rules, sanctions, and the role of Community Moderators.",
};

const articles = [
  {
    outlet: "The Economist",
    title: "What would humans do in a world of super-AI?",
    link: "https://www.economist.com/finance-and-economics/2023/05/23/what-would-humans-do-in-a-world-of-super-ai/#:~:text=Metaculus",
    logoUrl: "https://cdn.metaculus.com/logos/The_Economist_Logo.svg",
  },
  {
    outlet: "Forbes",
    title: "GPT: To Ban Or Not To Ban? That Is The Question",
    link: "https://www.forbes.com/sites/calumchace/2023/05/02/gpt-to-ban-or-not-to-ban-that-is-the-question/#:~:text=Metaculus",
    logoUrl: "https://cdn.metaculus.com/logos/Forbes_logo.svg",
  },
  {
    outlet: "The Atlantic",
    title: "How Future Generations Will Remember Us",
    link: "https://www.theatlantic.com/ideas/archive/2022/08/future-generations-climate-change-pandemics-ai/671148/#:~:text=Metaculus",
    logoUrl: "https://cdn.metaculus.com/logos/The_Atlantic_magazine_logo.svg",
  },
  {
    outlet: "Politico",
    title: "We Need a Manhattan Project for AI Safety",
    link: "https://www.politico.com/news/magazine/2023/05/08/manhattan-project-for-ai-safety-00095779/#:~:text=Metaculus",
    logoUrl: "https://cdn.metaculus.com/logos/POLITICOLOGO.svg",
  },
  {
    outlet: "The Washington Post",
    title: "Want politics to be better? Focus on future generations",
    link: "https://www.washingtonpost.com/outlook/2022/09/16/future-design-yahaba-politics/#:~:text=Metaculus",
    logoUrl:
      "https://cdn.metaculus.com/logos/The_Logo_of_The_Washington_Post_Newspaper.svg",
  },
  {
    outlet: "Vox",
    title: "Predictions are hard, especially about the coronavirus",
    link: "https://www.vox.com/future-perfect/2020/4/8/21210193/coronavirus-forecasting-models-predictions/#:~:text=Metaculus",
    logoUrl: "https://cdn.metaculus.com/logos/Vox_logo.svg",
  },
  {
    outlet: "Seeking Alpha",
    title: "Nvidia May Need More Cash Flow To Join The Trillion-Dollar Club",
    link: "https://seekingalpha.com/article/4591891-nvidia-may-need-more-cash-flow-to-join-trillion-dollar-club/#:~:text=Metaculus",
    logoUrl: "https://cdn.metaculus.com/logos/Seeking_Alpha_Logo.svg",
  },
  {
    outlet: "The Conversation",
    title: "Will AI ever reach human-level intelligence? We asked five experts",
    link: "https://theconversation.com/will-ai-ever-reach-human-level-intelligence-we-asked-five-experts-202515/#:~:text=Metaculus",
    logoUrl:
      "https://cdn.metaculus.com/logos/The_Conversation_website_text_logo.svg",
  },
  {
    outlet: "BBC.com",
    title: "What is longtermism?",
    link: "https://www.bbc.com/future/article/20220805-what-is-longtermism-and-why-does-it-matter/#:~:text=Metaculus",
    logoUrl: "https://cdn.metaculus.com/logos/BBC_Logo_2021.svg",
  },
];

export default async function PressPage() {
  const locale = await getLocale();
  if (locale === "pt") {
    return content_pt();
  }

  return (
    <PageWrapper>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="pb-2">Metaculus For Journalists</h1>

          <DisclosureSection />
        </div>
        <div>
          <h2 className="pb-2">How to Reference Forecasts</h2>
          <ReferenceSection />
        </div>
        <div>
          <h2 className="pb-4">
            News That Cited{" "}
            <span className="text-blue-600 dark:text-blue-400">Metaculus</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map(({ outlet, title, link, logoUrl }) => (
              <a
                className="block rounded bg-white p-4 no-underline dark:bg-blue-400 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-400 md:dark:hover:bg-blue-300"
                key={link}
                href={link}
                target="_blank"
                rel="noreferrer"
              >
                <div className="relative mx-2 mb-4 mt-2 h-8 p-2">
                  <Image
                    fill
                    className="object-contain object-left"
                    src={logoUrl}
                    alt={outlet}
                    unoptimized
                  />
                </div>
                <h3 className="mx-2 my-0 text-base text-blue-800 dark:text-blue-800">
                  {title}
                </h3>
              </a>
            ))}
          </div>
        </div>
        <div>
          <h2>Metaculus Track Record</h2>
          <p>
            Metaculus users&apos; individual forecasts are shown on their
            profile track records, and are rigorously evaluated. Our{" "}
            <Link href="/questions/track-record">own track record</Link> is
            public and robust.
          </p>
          <h2>Download Assets</h2>
          <p>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://cdn.metaculus.com/metaculus-press-kit.zip"
            >
              Click here
            </a>{" "}
            to download a copy of the Metaculus logo and monogram.
          </p>
          <hr className="border-gray-400 dark:border-gray-600" />
          <div className="text-lg">
            For any further requests, please reach out to{" "}
            <a href="mailto:christian@metaculus.com">christian@metaculus.com</a>
            ; we&apos;re always happy to help.
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
