"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import Carousel, { CarouselItem } from "@/components/carousel";
import ForecastCard from "@/components/forecast_card";
import { POST_STATUS_FILTER } from "@/constants/posts_feed";
import { TimelineChartZoomOption } from "@/types/charts";
import { PostStatus, PostWithForecasts } from "@/types/post";

type Props = {
  posts: PostWithForecasts[];
};

const QuestionCarousel: FC<Props> = ({ posts }) => {
  const t = useTranslations();

  return (
    <Carousel
      className="flex flex-col gap-4 md:gap-12"
      FooterComponent={
        <div className="flex flex-1 items-start justify-end">
          <Link
            className="inline-flex items-center text-right text-base font-bold text-blue-800 no-underline dark:text-blue-800-dark"
            href={`/questions?${POST_STATUS_FILTER}=${PostStatus.APPROVED}`}
          >
            {t("seeAllForecasts")}
            <FontAwesomeIcon icon={faArrowRight} className="ml-1.5 mr-1" />
          </Link>
        </div>
      }
    >
      {posts.map((p) => (
        <CarouselItem key={p.id}>
          <ForecastCard
            post={p}
            defaultChartZoom={TimelineChartZoomOption.TwoMonths}
          />
        </CarouselItem>
      ))}
    </Carousel>
  );
};

export default QuestionCarousel;
