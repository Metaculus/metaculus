"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC, useEffect, useRef, useState } from "react";

import Button from "@/components/ui/button";
import { PostWithForecasts } from "@/types/post";

import CurveQuestionDetails from "./question_details/curve_question_details";

type Props = {
  post: PostWithForecasts;
  expandLabel?: string;
  collapseLabel?: string;
  className?: string;
};

const HEADER_HEIGHT = 48;
const CurveQuestion: FC<Props> = ({
  post,
  expandLabel: _expandLabel,
  collapseLabel: _collapseLabel,
}) => {
  const t = useTranslations();
  const expandLabel = _expandLabel ?? t("details");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [maxDetailsHeight, setMaxDetailsHeight] = useState<number>(500);
  const [isExpanded, setIsExpanded] = useState(false);
  useEffect(() => {
    if (isExpanded && wrapperRef.current) {
      const wrapperHeight = wrapperRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      setMaxDetailsHeight(windowHeight - wrapperHeight - HEADER_HEIGHT);
    }
  }, [isExpanded]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="max-h-[calc(100vh-48px)] w-full overflow-y-auto bg-blue-800 p-5 pb-3 md:rounded-t">
        <h1 className="m-0 text-2xl font-medium leading-8 text-gray-100">
          {post.title}
        </h1>

        {!isExpanded && (
          <Button
            variant="text"
            className={classNames(
              "sticky z-10 mt-2 !justify-start !p-0 !font-normal !text-blue-500 dark:!text-blue-500"
            )}
            onClick={() => setIsExpanded(true)}
          >
            <FontAwesomeIcon
              icon={faChevronDown}
              className="m-0"
              width={10}
              height={10}
            />

            {expandLabel}
          </Button>
        )}
        {isExpanded && (
          <div
            className="absolute left-0 top-full z-50 w-full overflow-y-scroll bg-blue-800 p-5 py-0 lg:!max-h-[510px]"
            style={{ maxHeight: `${maxDetailsHeight}px` }}
          >
            <CurveQuestionDetails
              question={post}
              onCollapse={() => setIsExpanded(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CurveQuestion;
