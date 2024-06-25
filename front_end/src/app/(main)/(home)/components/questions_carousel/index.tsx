"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React, { FC, useEffect, useState } from "react";

import { fetchMorePosts } from "@/app/(main)/questions/actions";
import Carousel, { CarouselItem } from "@/components/carousel";
import { POST_STATUS_FILTER } from "@/constants/posts_feed";
import { PostStatus, PostWithForecasts } from "@/types/post";

import QuestionCarouselItem from "./carousel_item";

type Props = {
  postIds: number[];
};

const QuestionCarousel: FC<Props> = ({ postIds }) => {
  const [data, setData] = useState<PostWithForecasts[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const postsResponse = await fetchMorePosts(
        {
          ids: postIds,
        },
        0,
        20
      );
      setData(postsResponse);
    };
    fetchData();
  }, []);

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
      {data.map((p) => (
        <CarouselItem key={p.id}>
          <QuestionCarouselItem post={p} />
        </CarouselItem>
      ))}
    </Carousel>
  );
};

export default QuestionCarousel;
