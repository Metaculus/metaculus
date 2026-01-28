import dynamic from "next/dynamic";
import React, { FC, Suspense } from "react";

import { PostDropdownMenu, SharePostMenu } from "@/components/post_actions";
import PostSubscribeButton from "@/components/post_subscribe/subscribe_button";
import { PostStatus, PostWithForecasts } from "@/types/post";

import SidebarQuestionInfo from "./sidebar_question_info";
import SidebarQuestionProjects from "./sidebar_question_projects";
import QuestionEmbedButton from "../question_embed_button";
import SidebarContainer from "./sidebar_container";

const SimilarQuestions = dynamic(() => import("./similar_questions"));

type Props = {
  postData: PostWithForecasts;
  layout?: "mobile" | "desktop";
  questionTitle: string;
};

const Sidebar: FC<Props> = ({
  postData,
  layout = "desktop",
  questionTitle,
}) => {
  if (layout === "mobile") {
    return (
      <section className="flex flex-col gap-4 lg:hidden">
        <SidebarContainer>
          <SidebarQuestionInfo postData={postData} />
        </SidebarContainer>
        <SidebarQuestionProjects projects={postData.projects} />

        {postData.curation_status === PostStatus.APPROVED && (
          <>
            {/* NewsMatch disabled - using News type Key Factors instead */}
            {/* <Suspense fallback={null}>
              <NewsMatch questionId={postData.id} />
            </Suspense> */}

            <Suspense fallback={null}>
              <SimilarQuestions post_id={postData.id} />
            </Suspense>
          </>
        )}
      </section>
    );
  }

  return (
    <section className="hidden h-fit w-80 shrink-0 flex-col gap-3 text-gray-700 dark:text-gray-700-dark lg:flex">
      <SidebarContainer>
        <div className="mb-5 flex w-full items-center justify-between gap-2">
          <div className="flex gap-1">
            {postData.curation_status == PostStatus.APPROVED && (
              <PostSubscribeButton />
            )}
            <QuestionEmbedButton />
          </div>

          <div className="flex gap-2">
            <SharePostMenu
              questionTitle={questionTitle}
              questionId={postData.id}
            />
            <PostDropdownMenu post={postData} />
          </div>
        </div>
        <div className="w-full">
          <SidebarQuestionInfo postData={postData} />
        </div>
      </SidebarContainer>

      <SidebarQuestionProjects projects={postData.projects} />

      {postData.curation_status === PostStatus.APPROVED && (
        <>
          {/* NewsMatch disabled - using News type Key Factors instead */}
          {/* <Suspense fallback={null}>
            <NewsMatch questionId={postData.id} />
          </Suspense> */}

          <Suspense fallback={null}>
            <SimilarQuestions post_id={postData.id} />
          </Suspense>
        </>
      )}
    </section>
  );
};

export default Sidebar;
