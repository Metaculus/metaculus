import { FC } from "react";

import { PostStatus, PostWithForecasts } from "@/types/post";

import SidebarContainer from "./sidebar_container";
import SidebarQuestionInfo from "./sidebar_question_info";
import SimilarQuestions from "./similar_questions";

type Props = {
  postData: PostWithForecasts;
  layout?: "mobile" | "desktop";
  variant?: "forecaster" | "consumer";
};

const Sidebar: FC<Props> = ({
  postData,
  layout = "desktop",
  variant = "forecaster",
}) => {
  if (layout === "mobile") {
    return null;
  }

  return (
    <section className="hidden h-fit w-80 shrink-0 flex-col gap-3 text-gray-700 dark:text-gray-700-dark lg:flex">
      {variant === "forecaster" && (
        <SidebarContainer>
          <div className="w-full">
            <SidebarQuestionInfo postData={postData} />
          </div>
        </SidebarContainer>
      )}

      {postData.curation_status === PostStatus.APPROVED && (
        <SimilarQuestions post={postData} variant={variant} />
      )}
    </section>
  );
};

export default Sidebar;
