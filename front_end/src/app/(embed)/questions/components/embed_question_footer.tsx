"use client";

import Image from "next/image";
import React from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import { PostWithForecasts } from "@/types/post";

import metaculusDarkLogo from "../assets/metaculus-dark.png";
import metaculusLightLogo from "../assets/metaculus-light.png";

type Props = {
  post: PostWithForecasts;
};

const EmbedQuestionFooter: React.FC<Props> = ({ post }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ForecastersCounter
          className="px-1.5 py-1 [&_strong]:font-normal"
          forecasters={post.nr_forecasters}
        />
        <CommentStatus
          className="!px-1.5 py-1 [&_strong]:font-normal [&_svg]:text-gray-400 [&_svg]:dark:text-gray-400-dark"
          totalCount={post.comment_count ?? 0}
          unreadCount={post.unread_comment_count ?? 0}
          url={""}
        />
      </div>

      <div id="id-logo-used-by-screenshot-donot-change">
        <Image
          className="dark:hidden"
          src={metaculusDarkLogo}
          alt="Metaculus Logo"
          width={74}
          height={15}
        />
        <Image
          className="hidden dark:block"
          src={metaculusLightLogo}
          alt="Metaculus Logo"
          width={74}
          height={15}
        />
      </div>
    </div>
  );
};

export default EmbedQuestionFooter;
