import dynamic from "next/dynamic";
import React, { FC, Suspense } from "react";

import { PostStatus, PostWithForecasts } from "@/types/post";

import SidebarContainer from "./sidebar_container";
import SidebarQuestionInfo from "./sidebar_question_info";

const SimilarQuestions = dynamic(() => import("./similar_questions"));

type Props = {
  postData: PostWithForecasts;
  layout?: "mobile" | "desktop";
};

const Sidebar: FC<Props> = ({ postData, layout = "desktop" }) => {
  if (layout === "mobile") {
    return (
      <section className="flex flex-col gap-4 lg:hidden">
        <SidebarContainer>
          <SidebarQuestionInfo postData={postData} />
        </SidebarContainer>

        {postData.curation_status === PostStatus.APPROVED && (
          <Suspense fallback={null}>
            <SimilarQuestions post_id={postData.id} />
          </Suspense>
        )}
      </section>
    );
  }

  return (
    <section className="hidden h-fit w-80 shrink-0 flex-col gap-3 text-gray-700 dark:text-gray-700-dark lg:flex">
      <SidebarContainer>
        <SidebarQuestionInfo postData={postData} />
      </SidebarContainer>

      {postData.curation_status === PostStatus.APPROVED && (
        <Suspense fallback={null}>
          <SimilarQuestions post_id={postData.id} />
        </Suspense>
      )}
    </section>
  );
};

export default Sidebar;
