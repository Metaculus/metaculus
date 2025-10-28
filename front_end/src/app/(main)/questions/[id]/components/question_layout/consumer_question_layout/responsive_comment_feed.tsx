"use client";

import { FC } from "react";

import CommentFeed from "@/components/comment_feed";
import { useBreakpoint } from "@/hooks/tailwind";
import { PostWithForecasts } from "@/types/post";

type Props = {
  postData: PostWithForecasts;
  compactVersion?: boolean;
};

/**
 * Responsive wrapper around CommentFeed that conditionally renders based on screen size.
 * Used in consumer question layout where both mobile (compact) and desktop versions
 * are declared but only one should exist in DOM at a time to avoid duplicate IDs.
 *
 * - compactVersion: renders only on screens < lg (< 1024px)
 * - non-compact: renders only on screens >= lg (>= 1024px)
 */
const ResponsiveCommentFeed: FC<Props> = ({
  postData,
  compactVersion = false,
}) => {
  const isLargeScreen = useBreakpoint("lg");

  // Only render compact version on small screens, desktop version on large screens
  if (compactVersion && isLargeScreen) {
    return null;
  }
  if (!compactVersion && !isLargeScreen) {
    return null;
  }

  return <CommentFeed postData={postData} compactVersion={compactVersion} />;
};

export default ResponsiveCommentFeed;
