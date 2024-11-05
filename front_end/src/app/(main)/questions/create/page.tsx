import { getTranslations } from "next-intl/server";
import React from "react";

import CommunityHeader from "@/app/(main)/components/headers/community_header";
import Header from "@/app/(main)/components/headers/header";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";

import QuestionTypePicker from "../components/question_type_picker";

const Creator: React.FC<{ searchParams: SearchParams }> = async ({
  searchParams,
}) => {
  const t = await getTranslations();
  const createHref = (
    path: string,
    extra_params: { [key: string]: string } = {}
  ) => {
    const params = new URLSearchParams(
      searchParams as { [key: string]: string }
    );
    Object.entries(extra_params).forEach(([key, value]) => {
      params.append(key, value);
    });
    return `${path}?${params.toString()}`;
  };

  const communityId = searchParams["community_id"]
    ? Number(searchParams["community_id"])
    : undefined;
  const communitiesResponse = communityId
    ? await ProjectsApi.getCommunities({ ids: [communityId] })
    : undefined;
  const community = communitiesResponse
    ? communitiesResponse.results[0]
    : undefined;

  return (
    <>
      {community ? (
        <CommunityHeader community={community} />
      ) : (
        <Header />
      )}
      <div className="mb-4 mt-2 flex max-w-4xl flex-col justify-center self-center rounded-none bg-gray-0 px-4 pb-5 pt-4 text-gray-800 dark:bg-gray-0-dark dark:text-gray-800-dark md:m-8 md:mx-auto md:rounded-md md:px-8 md:pb-8 lg:m-12 lg:mx-auto">
        <div className="text-sm md:text-base">
          <h1 className="text-2xl font-medium capitalize md:text-3xl">
            {t("createNewContent")}
          </h1>
          <p>
            {t.rich("createQuestionDescription1", {
              link1: (chunks) => (
                <a
                  href="/question-writing"
                  className="text-blue-800 hover:text-blue-900 dark:text-blue-800-dark dark:hover:text-blue-900-dark"
                >
                  {chunks}
                </a>
              ),
              link2: (chunks) => (
                <a
                  href="/questions/956/suggest-questions-to-launch/"
                  className="text-blue-800 hover:text-blue-900 dark:text-blue-800-dark dark:hover:text-blue-900-dark"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
          <p>{t("createQuestionDescription2")}</p>
        </div>
        <h2 className="mt-0 text-lg font-light capitalize">
          {t("singleQuestion")}
        </h2>
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          <QuestionTypePicker
            url={createHref("/questions/create/question", { type: "binary" })}
            questionType={t("binaryQuestion")}
            questionExample={t("binaryQuestionExample")}
          />
          <QuestionTypePicker
            url={createHref("/questions/create/question", { type: "numeric" })}
            questionType={t("numericRange")}
            questionExample={t("numericRangeExample")}
          />
          <QuestionTypePicker
            url={createHref("/questions/create/question", { type: "date" })}
            questionType={t("dateRange")}
            questionExample={t("dateRangeExample")}
          />
          <QuestionTypePicker
            url={createHref("/questions/create/question", {
              type: "multiple_choice",
            })}
            questionType={t("multipleChoice")}
            questionExample={t("multipleChoiceExample")}
          />
        </div>

        <h2 className="text-lg font-light capitalize">{t("questionGroup")}</h2>
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          <QuestionTypePicker
            url={createHref("/questions/create/group", { subtype: "binary" })}
            questionType={t("binaryGroup")}
            questionExample={t("binaryGroupExample")}
          />
          <QuestionTypePicker
            url={createHref("/questions/create/group", { subtype: "numeric" })}
            questionType={t("numericGroup")}
            questionExample={t("numericGroupExample")}
          />
          <QuestionTypePicker
            url={createHref("/questions/create/group", { subtype: "date" })}
            questionType={t("dateGroup")}
            questionExample={t("dateGroupExample")}
          />
          <QuestionTypePicker
            url={createHref("/questions/create/conditional")}
            questionType={t("conditionalPair")}
            questionExample={t("conditionalPairExample")}
          />
        </div>

        <h2 className="text-lg font-light capitalize">{t("posts")}</h2>
        <QuestionTypePicker
          url={createHref("/questions/create/notebook")}
          questionType={t("notebook")}
          questionExample={t("notebookExample")}
        />
      </div>
    </>
  );
};

export default WithServerComponentErrorBoundary(Creator);
