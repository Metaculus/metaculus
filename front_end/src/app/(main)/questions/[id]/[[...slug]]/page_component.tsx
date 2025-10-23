import dynamic from "next/dynamic";
import { FC } from "react";

import { CoherenceLinksProvider } from "@/app/(main)/components/coherence_links_provider";
import CommentsFeedProvider from "@/app/(main)/components/comments_feed_provider";
import CommunityHeader from "@/app/(main)/components/headers/community_header";
import Header from "@/app/(main)/components/headers/header";
import HideCPProvider from "@/contexts/cp_context";
import { EmbedModalContextProvider } from "@/contexts/embed_modal_context";
import { PostSubscriptionProvider } from "@/contexts/post_subscription_context";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { SearchParams } from "@/types/navigation";
import { TournamentType } from "@/types/projects";
import cn from "@/utils/core/cn";
import { getPostTitle } from "@/utils/questions/helpers";

import NotebookRedirect from "../components/notebook_redirect";
import QuestionEmbedModal from "../components/question_embed_modal";
import QuestionLayout from "../components/question_layout";
import QuestionView from "../components/question_view";
import Sidebar from "../components/sidebar";
import { SLUG_POST_SUB_QUESTION_ID } from "../search_params";
import { cachedGetPost } from "./utils/get_post";
import { KeyFactorsProvider } from "../components/key_factors/key_factors_provider";

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
      <CoherenceLinksProvider post={postData}>
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
                      <div className="absolute z-0 -mt-[34px] hidden w-full sm:block">
                        <CommunityDisclaimer
                          project={postData.projects.default_project}
                          variant="inline"
                        />
                      </div>
                    )}
                    <KeyFactorsProvider>
                      <QuestionLayout
                        postData={postData}
                        preselectedGroupQuestionId={preselectedGroupQuestionId}
                      >
                        {isCommunityQuestion && (
                          <CommunityDisclaimer
                            project={postData.projects.default_project}
                            variant="standalone"
                            className="block sm:hidden"
                          />
                        )}
                        <QuestionView
                          postData={postData}
                          preselectedGroupQuestionId={
                            preselectedGroupQuestionId
                          }
                        />
                      </QuestionLayout>
                    </KeyFactorsProvider>
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
      </CoherenceLinksProvider>
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
