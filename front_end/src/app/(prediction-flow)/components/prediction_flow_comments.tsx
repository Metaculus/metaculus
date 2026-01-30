"use client";
import { useTranslations } from "next-intl";
import { FC, useEffect, useRef } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import CommentFeed from "@/components/comment_feed";
import SectionToggle from "@/components/ui/section_toggle";
import { PostWithForecasts } from "@/types/post";

export const PREDICTION_FLOW_COMMENTS_TOGGLE_ID =
  "prediction-flow-comments-section-toggle";

type Props = { postData: PostWithForecasts };

const PredictionFlowCommentsSection: FC<Props> = ({ postData }) => {
  const { totalCount, fetchTotalCount } = useCommentsFeed();
  const t = useTranslations();
  const isMounted = useRef(false);
  // fetch initial comments to display total count
  useEffect(() => {
    if (!isMounted.current) {
      fetchTotalCount({
        is_private: false,
      });
      isMounted.current = true;
    }
  }, [fetchTotalCount]);

  return (
    <SectionToggle
      id={PREDICTION_FLOW_COMMENTS_TOGGLE_ID}
      title={`${t("comments")} (${totalCount})`}
      defaultOpen={false}
    >
      <CommentFeed postData={postData} showTitle={false} />
    </SectionToggle>
  );
};

export default PredictionFlowCommentsSection;
