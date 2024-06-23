import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React, { FC } from "react";

import Carousel, { CarouselItem } from "@/components/carousel";
import { POST_STATUS_FILTER } from "@/constants/posts_feed";
import PostsApi from "@/services/posts";
import { PostStatus } from "@/types/post";

import QuestionCarouselItem from "./carousel_item";

type Props = {
  postIds: number[];
};

const QuestionCarousel: FC<Props> = async ({ postIds }) => {
  const postsResponse = await PostsApi.getPostWithoutForecasts({
    ids: postIds,
  });

  return (
    <Carousel
      className="flex flex-col gap-4 md:gap-12"
      FooterComponent={
        <div className="flex flex-1 items-start justify-end">
          <Link
            className="inline-flex items-center text-right text-base font-bold text-blue-800 no-underline dark:text-blue-800-dark"
            href={`/questions?${POST_STATUS_FILTER}=${PostStatus.APPROVED}`}
          >
            See All Forecasts
            <FontAwesomeIcon icon={faArrowRight} className="ml-1.5 mr-1" />
          </Link>
        </div>
      }
    >
      {postsResponse.results.map((p) => (
        <CarouselItem key={p.id}>
          <QuestionCarouselItem post={p} />
        </CarouselItem>
      ))}
    </Carousel>
  );
};

export default QuestionCarousel;
