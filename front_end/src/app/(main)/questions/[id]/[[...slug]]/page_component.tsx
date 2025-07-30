import dynamic from "next/dynamic";
import { FC } from "react";

import CommentsFeedProvider from "@/app/(main)/components/comments_feed_provider";
import CommunityHeader from "@/app/(main)/components/headers/community_header";
import Header from "@/app/(main)/components/headers/header";
import CommentFeed from "@/components/comment_feed";
import ConditionalTimeline from "@/components/conditional_timeline";
import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import ForecastMaker from "@/components/forecast_maker";
import BackgroundInfo from "@/components/question/background_info";
import ResolutionCriteria from "@/components/question/resolution_criteria";
import HideCPProvider from "@/contexts/cp_context";
import { EmbedModalContextProvider } from "@/contexts/embed_modal_context";
import { PostSubscriptionProvider } from "@/contexts/post_subscription_context";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { SearchParams } from "@/types/navigation";
import { GroupOfQuestionsGraphType } from "@/types/post";
import { TournamentType } from "@/types/projects";
import cn from "@/utils/core/cn";
import {
  getPostTitle,
  isConditionalPost,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import { cachedGetPost } from "./utils/get_post";
import HistogramDrawer from "../components/histogram_drawer";
import KeyFactorsSection from "../components/key_factors/key_factors_section";
import NotebookRedirect from "../components/notebook_redirect";
import QuestionEmbedModal from "../components/question_embed_modal";
import QuestionHeader from "../components/question_header";
import Sidebar from "../components/sidebar";
import { SLUG_POST_SUB_QUESTION_ID } from "../search_params";

const CommunityDisclaimer = dynamic(
  () => import("@/components/post_card/community_disclaimer")
);

const IndividualQuestionPage: FC<{
  params: { id: number; slug: string[] };
  searchParams: SearchParams;
}> = async ({ params, searchParams }) => {
  const postData = await cachedGetPost(params.id);
  const defaultProject = postData.projects.default_project;
  if (postData.notebook) {
    return <NotebookRedirect id={postData.id} slug={params.slug} />;
  }

  const isCommunityQuestion = defaultProject.type === TournamentType.Community;
  let currentCommunity = null;
  if (isCommunityQuestion) {
    currentCommunity = await ServerProjectsApi.getCommunity(
      defaultProject.slug as string
    );
  }

  const preselectedGroupQuestionId =
    extractPreselectedGroupQuestionId(searchParams);

  const questionTitle = getPostTitle(postData);
  return (
    <EmbedModalContextProvider>
      <CommentsFeedProvider postData={postData} rootCommentStructure={true}>
        <HideCPProvider post={postData}>
          <PostSubscriptionProvider post={postData}>
            {isCommunityQuestion ? (
              <CommunityHeader community={currentCommunity} />
            ) : (
              <Header />
            )}
            <main
              className={cn(
                "mx-auto flex w-full max-w-max flex-col scroll-smooth py-4 md:py-10",
                {
                  "sm:mt-5": isCommunityQuestion,
                }
              )}
            >
              <div className="flex gap-4">
                <div className="relative w-full">
                  {isCommunityQuestion && (
                    <div className="absolute z-0 -mt-[41px] hidden w-full sm:block">
                      <CommunityDisclaimer
                        project={postData.projects.default_project}
                        variant="inline"
                      />
                    </div>
                  )}
                  <div className="relative z-10 flex w-full flex-col gap-4">
                    <section className="flex w-[48rem] max-w-full flex-col gap-5 rounded border-transparent bg-gray-0 p-4 text-gray-900 after:mt-6 after:block after:w-full after:content-[''] dark:border-blue-200-dark dark:bg-gray-0-dark dark:text-gray-900-dark lg:gap-6 lg:border lg:p-8">
                      {isCommunityQuestion && (
                        <CommunityDisclaimer
                          project={postData.projects.default_project}
                          variant="standalone"
                          className="block sm:hidden"
                        />
                      )}
                      <QuestionHeader post={postData} />
                      {isQuestionPost(postData) && (
                        <DetailedQuestionCard post={postData} />
                      )}
                      {isGroupOfQuestionsPost(postData) && (
                        <DetailedGroupCard
                          post={postData}
                          preselectedQuestionId={preselectedGroupQuestionId}
                        />
                      )}
                      <ForecastMaker post={postData} />
                      <div>
                        <div className="flex flex-col gap-2.5">
                          <ResolutionCriteria post={postData} />
                          {isConditionalPost(postData) && (
                            <ConditionalTimeline post={postData} />
                          )}

                          <KeyFactorsSection
                            postId={postData.id}
                            postStatus={postData.status}
                          />

                          <BackgroundInfo post={postData} />
                          {isGroupOfQuestionsPost(postData) &&
                            postData.group_of_questions.graph_type ===
                              GroupOfQuestionsGraphType.FanGraph && (
                              <DetailedGroupCard
                                post={postData}
                                preselectedQuestionId={
                                  preselectedGroupQuestionId
                                }
                                groupPresentationOverride={
                                  GroupOfQuestionsGraphType.MultipleChoiceGraph
                                }
                                className="mt-2"
                              />
                            )}
                          <HistogramDrawer post={postData} />
                        </div>
                      </div>
                    </section>
                    <Sidebar
                      postData={postData}
                      layout="mobile"
                      questionTitle={questionTitle}
                    />
                    <CommentFeed postData={postData} />
                  </div>
                </div>
                <Sidebar postData={postData} questionTitle={questionTitle} />
              </div>
            </main>

            <QuestionEmbedModal
              postId={postData.id}
              postTitle={postData.title}
              questionType={postData.question?.type}
            />
          </PostSubscriptionProvider>
        </HideCPProvider>
      </CommentsFeedProvider>
    </EmbedModalContextProvider>
  );
};

function extractPreselectedGroupQuestionId(
  searchParams: SearchParams
): number | undefined {
  const param = searchParams[SLUG_POST_SUB_QUESTION_ID];
  if (typeof param === "string") {
    const id = Number(param);
    return isNaN(id) ? undefined : id;
  }
}

export default IndividualQuestionPage;
