import { redirect } from "next/navigation";
import { FC } from "react";

import CommentsFeedProvider from "@/app/(main)/components/comments_feed_provider";
import CommunityHeader from "@/app/(main)/components/headers/community_header";
import Header from "@/app/(main)/components/headers/header";
import CommentFeed from "@/components/comment_feed";
import ConditionalTile from "@/components/conditional_tile";
import ConditionalTimeline from "@/components/conditional_timeline";
import ForecastMaker from "@/components/forecast_maker";
import CommunityDisclaimer from "@/components/post_card/community_disclaimer";
import { EmbedModalContextProvider } from "@/contexts/embed_modal_context";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";
import {
  GroupOfQuestionsGraphType,
  PostStatus,
  ProjectPermissions,
} from "@/types/post";
import { TournamentType } from "@/types/projects";
import cn from "@/utils/core/cn";
import {
  getPostTitle,
  isConditionalPost,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import { cachedGetPost } from "./utils/get_post";
import DetailedGroupCard from "../../../../../components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "../../../../../components/detailed_question_card/detailed_question_card";
import BackgroundInfo from "../../../../../components/question/background_info";
import HideCPProvider from "../../../../../components/question/cp_provider";
import ResolutionCriteria from "../../../../../components/question/resolution_criteria";
import HistogramDrawer from "../components/histogram_drawer";
import KeyFactorsSection from "../components/key_factors/key_factors_section";
import PostHeader from "../components/post_header";
import QuestionEmbedModal from "../components/question_embed_modal";
import QuestionHeaderInfo from "../components/question_header_info";
import QuestionResolutionStatus from "../components/question_resolution_status";
import Sidebar from "../components/sidebar";
import { SLUG_POST_SUB_QUESTION_ID } from "../search_params";

const IndividualQuestionPage: FC<{
  params: { id: number; slug: string[] };
  searchParams: SearchParams;
}> = async ({ params, searchParams }) => {
  const postData = await cachedGetPost(params.id);
  const defaultProject = postData.projects.default_project;

  if (postData.notebook) {
    return redirect(
      `/notebooks/${postData.id}${params.slug ? `/${params.slug}` : ""}`
    );
  }

  const isCommunityQuestion = defaultProject.type === TournamentType.Community;
  let currentCommunity = null;
  if (isCommunityQuestion) {
    currentCommunity = await ProjectsApi.getCommunity(
      defaultProject.slug as string
    );
  }

  const preselectedGroupQuestionId =
    extractPreselectedGroupQuestionId(searchParams);

  const allowModifications =
    postData.user_permission === ProjectPermissions.ADMIN ||
    postData.user_permission === ProjectPermissions.CURATOR ||
    (postData.user_permission === ProjectPermissions.CREATOR &&
      postData.curation_status !== PostStatus.APPROVED);

  const questionTitle = getPostTitle(postData);
  return (
    <EmbedModalContextProvider>
      <CommentsFeedProvider postData={postData} rootCommentStructure={true}>
        <HideCPProvider post={postData}>
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
                  <section className="w-[48rem] max-w-full rounded border-transparent bg-gray-0 px-3 pt-4 text-gray-900 after:mt-6 after:block after:w-full after:content-[''] dark:border-blue-200-dark dark:bg-gray-0-dark dark:text-gray-900-dark xs:px-4 lg:border">
                    {isCommunityQuestion && (
                      <CommunityDisclaimer
                        project={postData.projects.default_project}
                        variant="standalone"
                        className="mb-4 block sm:hidden"
                      />
                    )}

                    <PostHeader post={postData} questionTitle={questionTitle} />
                    {!postData.conditional && (
                      <div className="mt-2 flex justify-between gap-2 xs:gap-4 sm:gap-8 lg:mb-2 lg:mt-4">
                        <h1 className="m-0 text-xl leading-tight sm:text-3xl">
                          {postData.title}
                        </h1>
                        {postData.resolved && !!postData.question && (
                          <QuestionResolutionStatus post={postData} />
                        )}
                      </div>
                    )}

                    {isConditionalPost(postData) && (
                      <ConditionalTile
                        post={postData}
                        withNavigation
                        withCPRevealBtn
                      />
                    )}
                    <QuestionHeaderInfo post={postData} />

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
                    <ResolutionCriteria post={postData} />

                    {isConditionalPost(postData) && (
                      <ConditionalTimeline post={postData} />
                    )}

                    <div className="flex flex-col gap-2.5">
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
                            preselectedQuestionId={preselectedGroupQuestionId}
                            groupPresentationOverride={
                              GroupOfQuestionsGraphType.MultipleChoiceGraph
                            }
                            className="mt-2"
                          />
                        )}
                      <HistogramDrawer post={postData} />
                    </div>
                  </section>
                  <Sidebar
                    postData={postData}
                    allowModifications={allowModifications}
                    layout="mobile"
                    questionTitle={questionTitle}
                  />
                  <CommentFeed postData={postData} />
                </div>
              </div>
              <Sidebar
                postData={postData}
                allowModifications={allowModifications}
                questionTitle={questionTitle}
              />
            </div>
          </main>

          <QuestionEmbedModal postId={postData.id} postTitle={postData.title} />
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
