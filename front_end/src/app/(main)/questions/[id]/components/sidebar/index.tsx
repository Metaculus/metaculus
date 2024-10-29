import { FC, Suspense } from "react";

import PostSubscribeButton from "@/app/(main)/questions/[id]/components/subscribe_button";
import { PostDropdownMenu, SharePostMenu } from "@/components/post_actions";
import { PostStatus, PostWithForecasts } from "@/types/post";

import NewsMatch from "./news_match";
import SidebarQuestionInfo from "./sidebar_question_info";
import SidebarQuestionTags from "./sidebar_question_tags";
import SimilarQuestions from "./similar_questions";
import QuestionEmbedButton from "../question_embed_button";

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
      <section className="lg:hidden">
        <hr className="my-4 border-blue-400 dark:border-blue-400-dark" />
        <div className="flex flex-col items-start gap-4 self-stretch @container">
          <SidebarQuestionInfo postData={postData} />
          <SidebarQuestionTags
            postId={postData.id}
            tagData={postData.projects}
            allowModifications={allowModifications}
          />
        </div>

        {postData.curation_status === PostStatus.APPROVED && (
          <>
            <Suspense fallback={null}>
              <div className="flex w-full flex-col items-start gap-4 self-stretch">
                <NewsMatch questionId={postData.id} />
              </div>
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
    <section className="hidden h-fit w-80 shrink-0 border border-transparent bg-gray-0 p-4 text-gray-700 dark:border-blue-200-dark dark:bg-gray-0-dark dark:text-gray-700-dark lg:block">
      <div className="mb-4 flex w-full items-center justify-between gap-2 border-b border-gray-300 pb-4 dark:border-gray-300-dark">
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

      <div className="flex flex-col items-start gap-4 self-stretch @container">
        <div className="w-full">
          <SidebarQuestionInfo postData={postData} />
        </div>
        <SidebarQuestionTags
          postId={postData.id}
          tagData={postData.projects}
          allowModifications={allowModifications}
        />
      </div>

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
