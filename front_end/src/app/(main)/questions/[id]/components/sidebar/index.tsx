import React, { FC, Suspense } from "react";

import { PostDropdownMenu, SharePostMenu } from "@/components/post_actions";
import PostSubscribeButton from "@/components/post_subscribe/subscribe_button";
import { PostStatus, PostWithForecasts } from "@/types/post";

import NewsMatch from "./news_match";
import SidebarQuestionInfo from "./sidebar_question_info";
import SimilarQuestions from "./similar_questions";
import QuestionEmbedButton from "../question_embed_button";

function SidebarContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="self-stretch rounded bg-gray-0 px-3 py-4 @container dark:bg-gray-0-dark xs:px-5">
      {children}
    </div>
  );
}

type Props = {
  postData: PostWithForecasts;
  allowModifications: boolean;
  layout?: "mobile" | "desktop";
  questionTitle: string;
};

const Sidebar: FC<Props> = ({
  postData,
  allowModifications,
  layout = "desktop",
  questionTitle,
}) => {
  if (layout === "mobile") {
    return (
      <section className="flex flex-col gap-4 lg:hidden">
        <SidebarContainer>
          <SidebarQuestionInfo postData={postData} />
        </SidebarContainer>
        {postData.curation_status === PostStatus.APPROVED && (
          <>
            <Suspense fallback={null}>
              <NewsMatch questionId={postData.id} />
            </Suspense>

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
              <PostSubscribeButton post={postData} />
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

      {postData.curation_status === PostStatus.APPROVED && (
        <>
          <Suspense fallback={null}>
            <NewsMatch questionId={postData.id} />
          </Suspense>

          <Suspense fallback={null}>
            <SimilarQuestions post_id={postData.id} />
          </Suspense>
        </>
      )}
    </section>
  );
};

export default Sidebar;
