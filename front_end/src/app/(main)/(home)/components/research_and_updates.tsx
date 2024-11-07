import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { intlFormat } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { FC } from "react";

import imagePlaceholder from "@/app/assets/images/tournament.webp";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import { PostWithNotebook } from "@/types/post";
import { getPostLink } from "@/utils/navigation";
import { getNotebookSummary } from "@/utils/questions";

type Props = {
  posts: PostWithNotebook[];
};

const ResearchAndUpdatesBlock: FC<Props> = async ({ posts }) => {
  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <div className="my-6 flex flex-col md:my-12 lg:my-16">
      <h2 className="mb-5 mt-0 w-full text-4xl font-bold text-blue-800 dark:text-blue-800-dark md:text-5xl">
        {t("research")} &{" "}
        <span className="text-blue-600 dark:text-blue-600-dark">
          {t("updates")}
        </span>
      </h2>
      <p className="m-0 text-xl text-blue-700 dark:text-blue-700-dark">
        {t("partnersUseForecasts")}
      </p>
      <div className="mt-6 flex flex-col gap-8 xl:flex-row">
        {posts.map(({ title, created_at, id, notebook, slug }) => (
          <Link
            key={id}
            className="flex-1 rounded-b-2xl bg-gray-0 no-underline hover:shadow-lg active:shadow-md dark:bg-gray-0-dark"
            href={getPostLink({ id, slug, notebook })}
          >
            {notebook.image_url ? (
              <Image
                src={notebook.image_url}
                alt=""
                width={265}
                height={160}
                quality={100}
                className="h-56 w-full object-cover object-center"
              />
            ) : (
              <Image
                src={imagePlaceholder}
                alt=""
                className="h-56 w-full object-cover object-center"
                quality={100}
              />
            )}

            <div className="px-5 py-6">
              <span className="rounded-full bg-blue-400 px-1.5 py-0.5 text-sm font-medium text-blue-900 dark:bg-blue-400-dark dark:text-blue-900-dark">
                {intlFormat(
                  new Date(created_at),
                  {
                    year: "numeric",
                    month: "short",
                  },
                  { locale }
                )}
              </span>
              <h3 className="mb-2 mt-3 text-2xl">{title}</h3>
              <p className="m-0 text-base text-blue-700 dark:text-blue-700-dark">
                {getNotebookSummary(notebook.markdown, 200, 80)}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <a
        href="https://metaculus.com/news/?news_type=research"
        className="mt-8 inline-flex items-center self-end text-right text-base font-bold text-blue-800 no-underline dark:text-blue-800-dark"
        target="_blank"
        rel="noreferrer"
      >
        {t("seeMorePosts")}
        <FontAwesomeIcon icon={faArrowRight} className="ml-1.5 mr-1" />
      </a>
    </div>
  );
};

export default WithServerComponentErrorBoundary(ResearchAndUpdatesBlock);
