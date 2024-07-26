import { FC, Suspense } from "react";

import { PostWithForecasts } from "@/types/post";

import NewsMatch from "./news_match";
import PostDropdownMenu from "./question_dropdown_menu";
import ShareQuestionMenu from "./share_question_menu";
import SidebarQuestionInfo from "./sidebar_question_info";
import SidebarQuestionTags from "./sidebar_question_tags";
import SimilarQuestions from "./similar_questions";
import { MOCK_QUESTIONS_IDS } from "./similar_questions/MOCK_QUESTIONS_IDS";
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
      <div className="lg:hidden">
        <div className="flex flex-col items-start gap-4 self-stretch border-t border-gray-300 pt-4 @container dark:border-gray-300-dark">
          <SidebarQuestionInfo postData={postData} />
          <SidebarQuestionTags
            tagData={postData.projects}
            allowModifications={allowModifications}
          />
        </div>

        <Suspense fallback={null}>
          <div className="flex w-full flex-col items-start gap-4 self-stretch">
            <NewsMatch
              allowModifications={allowModifications}
              questionId={postData.id}
            />
          </div>
        </Suspense>

        <Suspense fallback={null}>
          <SimilarQuestions ids={MOCK_QUESTIONS_IDS} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="hidden w-80 shrink-0 border border-transparent bg-gray-0 p-4 text-gray-700 dark:border-blue-200-dark dark:bg-gray-0-dark dark:text-gray-700-dark lg:block">
      <div className="mb-4 flex w-full items-center justify-between gap-2 border-b border-gray-300 pb-4 dark:border-gray-300-dark">
        <QuestionEmbedButton />

        <div className="flex gap-2">
          <ShareQuestionMenu questionTitle={questionTitle} />
          <PostDropdownMenu post={postData} />
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 self-stretch @container">
        <SidebarQuestionInfo postData={postData} />
        <SidebarQuestionTags
          tagData={postData.projects}
          allowModifications={allowModifications}
        />
      </div>

      <Suspense fallback={null}>
        <NewsMatch
          allowModifications={allowModifications}
          questionId={postData.id}
        />
      </Suspense>

      <Suspense fallback={null}>
        <SimilarQuestions ids={MOCK_QUESTIONS_IDS} />
      </Suspense>
    </div>
  );
};

export default Sidebar;
