import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import ServerPostsApi from "@/services/api/posts/posts.server";

import QuestionLink from "./question_link";

const QUESTION_IDS = [
  28500, 28497, 26331, 26106, 28533, 20482, 28503, 21377, 20696, 28530, 28491,
];

const ElectoralConsequences: FC = async () => {
  const t = await getTranslations();
  const { results: questions } = await ServerPostsApi.getPostsWithCPAnonymous(
    {
      ids: QUESTION_IDS,
    },
    { next: { revalidate: 900 } }
  );

  return (
    <div className="relative my-4 flex w-full flex-col rounded bg-gray-0 dark:bg-gray-0-dark">
      <div className="mx-4 my-3 flex flex-col items-center gap-2 sm:flex-row">
        <Link
          href="/tournament/3574/"
          className="my-4 text-2xl font-medium leading-8 text-gray-700 no-underline dark:text-gray-700-dark sm:grow"
        >
          {t("electoralConsequences")}
        </Link>
        <div className="grid w-64 flex-none grid-cols-2 justify-items-center gap-x-4">
          <div className="flex flex-col items-center gap-2">
            <Image
              className="rounded-full"
              src="https://cdn.metaculus.com/user_uploaded/trump_bvntmGs.jpeg"
              alt="Tramp image"
              width={56}
              height={56}
            />
            <span className="hidden text-center text-sm text-[#E0152B] dark:text-[#E7858F] sm:block">
              {t("ifCandidateElected", { candidate: "Trump" })}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Image
              className="rounded-full"
              src="https://cdn.metaculus.com/user_uploaded/harris_c8Of4TX.jpeg"
              alt="Harris image"
              width={56}
              height={56}
            />
            <span className="hidden text-center text-sm text-[#0252A5] dark:text-[#A7C3DC] sm:block">
              {t("ifCandidateElected", { candidate: "Harris" })}
            </span>
          </div>
        </div>
      </div>
      {questions.map((question) => (
        <QuestionLink question={question} key={question.id} />
      ))}
    </div>
  );
};

export default WithServerComponentErrorBoundary(ElectoralConsequences);
