import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { parseISO } from "date-fns";
import { isNil } from "lodash";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import CommentFeed from "@/components/comment_feed";
import ConditionalTile from "@/components/conditional_tile";
import ConditionalTimeline from "@/components/conditional_timeline";
import Button from "@/components/ui/button";
import { EmbedModalContextProvider } from "@/contexts/embed_modal_context";
import PostsApi from "@/services/posts";
import { SearchParams } from "@/types/navigation";
import {
  Post,
  PostStatus,
  ProjectPermissions,
  PostConditional,
} from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import {
  getConditionalQuestionTitle,
  canPredictQuestion,
} from "@/utils/questions";

import BackgroundInfo from "../components/background_info";
import DetailedGroupCard from "../components/detailed_group_card";
import DetailedQuestionCard from "../components/detailed_question_card";
import ForecastMaker from "../components/forecast_maker";
import HistogramDrawer from "../components/histogram_drawer";
import Modbox from "../components/modbox";
import QuestionEmbedModal from "../components/question_embed_modal";
import QuestionHeaderInfo from "../components/question_header_info";
import Sidebar from "../components/sidebar";
import ShareQuestionMenu from "../components/sidebar/share_question_menu";
import { SLUG_POST_SUB_QUESTION_ID } from "../search_params";

type Props = {
  params: { id: number; slug: string[] };
  searchParams: SearchParams;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const postData = await PostsApi.getPost(params.id);
  if (!postData) {
    return {};
  }

  const questionTitle = getQuestionTitle(postData);
  return {
    title: questionTitle,
    description: null,
    openGraph: {
      type: "article",
    },
    twitter: {
      site: "@metaculus",
      card: "summary_large_image",
    },
  };
}

export default async function IndividualQuestion({
  params,
  searchParams,
}: Props) {
  const postData = await PostsApi.getPost(params.id);
  if (!postData) {
    return notFound();
  }

  if (postData.notebook) {
    return redirect(`/notebooks/${postData.id}`);
  }
  const preselectedGroupQuestionId =
    extractPreselectedGroupQuestionId(searchParams);
  const t = await getTranslations();

  let typeLabel: string;
  if (postData.group_of_questions) {
    typeLabel = t("group");
  } else if (postData.conditional) {
    typeLabel = t("conditionalGroup");
  } else if (postData.question) {
    typeLabel = t("question");
  } else {
    typeLabel = t("searchOptionNotebook");
  }

  const allowModifications =
    postData.user_permission === ProjectPermissions.ADMIN ||
    postData.user_permission === ProjectPermissions.CURATOR ||
    postData.user_permission === ProjectPermissions.CREATOR;

  const questionTitle = getQuestionTitle(postData);

  return (
    <EmbedModalContextProvider>
      <main className="mx-auto flex w-full max-w-max flex-col py-4">
        <div className="flex items-start gap-3 bg-gray-0 px-3 pt-3 dark:bg-gray-0-dark xs:px-4 lg:bg-transparent lg:p-0 lg:dark:bg-transparent">
          <span className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark">
            {typeLabel}
          </span>
          {allowModifications && <Modbox post={postData} />}
          <div className="ml-auto flex h-9 flex-row text-gray-700 dark:text-gray-700-dark lg:hidden">
            <ShareQuestionMenu questionTitle={questionTitle} />
            <Button
              variant="secondary"
              className="!rounded border-0"
              presentationType="icon"
            >
              <FontAwesomeIcon icon={faEllipsis}></FontAwesomeIcon>
            </Button>
          </div>
        </div>
        <div className="flex w-full items-start gap-4">
          <div className="w-[48rem] max-w-full border-transparent bg-gray-0 px-3 text-gray-900 after:mt-6 after:block after:w-full after:content-[''] dark:border-blue-200-dark dark:bg-gray-0-dark dark:text-gray-900-dark xs:px-4 lg:border">
            <div className="my-0 flex justify-between gap-2 xs:gap-4 sm:gap-8 lg:mb-2 lg:mt-4">
              {!postData.conditional && (
                <h1 className="ng-binding m-0 text-xl leading-tight sm:text-3xl">
                  {postData.title}
                </h1>
              )}
            </div>

            <QuestionHeaderInfo post={postData} />

            {!!postData.question && (
              <DetailedQuestionCard question={postData.question} />
            )}
            {!!postData.group_of_questions && (
              <DetailedGroupCard
                questions={postData.group_of_questions.questions}
                preselectedQuestionId={preselectedGroupQuestionId}
              />
            )}
            {!!postData.conditional && (
              <ConditionalTile
                postTitle={postData.title}
                conditional={postData.conditional}
                curationStatus={postData.status}
                withNavigation
              />
            )}
            <ForecastMaker
              postId={postData.id}
              postTitle={postData.title}
              permission={postData.user_permission}
              question={postData.question}
              conditional={postData.conditional}
              groupOfQuestions={postData.group_of_questions}
              canPredict={canPredictQuestion(postData)}
              canResolve={
                (postData.user_permission === ProjectPermissions.CURATOR ||
                  postData.user_permission === ProjectPermissions.ADMIN) &&
                !isNil(postData.published_at) &&
                parseISO(postData.published_at) <= new Date() &&
                postData.status === PostStatus.APPROVED
              }
            />
            {!!postData.conditional && (
              <ConditionalTimeline
                conditional={
                  postData.conditional as PostConditional<QuestionWithNumericForecasts>
                }
              />
            )}
            <BackgroundInfo post={postData} />
            <HistogramDrawer post={postData} />
            <Sidebar
              postData={postData}
              allowModifications={allowModifications}
              layout="mobile"
              questionTitle={questionTitle}
            />

            <CommentFeed
              postData={postData}
              postPermissions={postData.user_permission}
            />
          </div>

          <Sidebar
            postData={postData}
            allowModifications={allowModifications}
            questionTitle={questionTitle}
          />
        </div>
      </main>

      <QuestionEmbedModal postId={postData.id} />
    </EmbedModalContextProvider>
  );
}

function extractPreselectedGroupQuestionId(
  searchParams: SearchParams
): number | undefined {
  const param = searchParams[SLUG_POST_SUB_QUESTION_ID];
  if (typeof param === "string") {
    const id = Number(param);
    return isNaN(id) ? undefined : id;
  }
}

function getQuestionTitle(post: Post) {
  if (post.conditional) {
    return getConditionalQuestionTitle(post.conditional.question_yes);
  }

  return post.title;
}
