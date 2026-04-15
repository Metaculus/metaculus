"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import ForecastMaker from "@/components/forecast_maker";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { PostStatus, PostWithForecasts } from "@/types/post";
import {
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import QuestionHeader from "./question_header";

type Props = {
  postData: PostWithForecasts;
  preselectedGroupQuestionId?: number | undefined;
};

const ForecasterQuestionView: React.FC<Props> = ({
  postData,
  preselectedGroupQuestionId,
}) => {
  const [currentPost, setCurrentPost] = useState(postData);
  const latestRequestIdRef = useRef(0);

  // Sync local state when the server prop changes (e.g., after a
  // revalidatePath-driven re-render).
  useEffect(() => {
    setCurrentPost(postData);
  }, [postData]);

  // Refetch fresh post data (including updated CP) after a prediction is
  // submitted, so sibling components (DetailedQuestionCard /
  // DetailedGroupCard) render the updated CP immediately instead of waiting
  // for revalidatePath to land.
  const handlePredictionSubmit = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current;
    try {
      const freshPost = await ClientPostsApi.getPost(postData.id);
      // Ignore stale responses if a newer request has been issued meanwhile.
      if (requestId === latestRequestIdRef.current) {
        setCurrentPost(freshPost);
      }
    } catch (err) {
      // Surface the error for observability; the CP will still update on
      // the next revalidation / page load.
      console.error("Failed to refresh post after prediction submit:", err);
    }
  }, [postData.id]);

  const isResolved = currentPost.status === PostStatus.RESOLVED;
  const isGroup = isGroupOfQuestionsPost(currentPost);

  return (
    <Fragment>
      <QuestionHeader post={currentPost} />
      {isQuestionPost(currentPost) && (
        <DetailedQuestionCard post={currentPost} />
      )}
      {isGroup && (
        <DetailedGroupCard
          post={currentPost}
          preselectedQuestionId={preselectedGroupQuestionId}
        />
      )}
      {(!isResolved || isGroup) && (
        <ForecastMaker
          post={currentPost}
          onPredictionSubmit={handlePredictionSubmit}
        />
      )}
    </Fragment>
  );
};

export default ForecasterQuestionView;
