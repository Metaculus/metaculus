"use client";

import { faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

import "./styles.css";

type Props = {
  question: PostWithForecasts;
  collapseLabel?: string;
  onCollapse: () => void;
};

const CurveQuestionDetails: FC<Props> = ({
  question,
  collapseLabel: _collapseLabel,
  onCollapse,
}) => {
  const t = useTranslations();
  const collapseLabel = _collapseLabel ?? t("collapse");

  return (
    <div className="flex flex-col">
      {!!question.group_of_questions?.resolution_criteria && (
        <>
          <h3 className="m-0 mt-3 text-lg font-normal leading-5 text-blue-500 dark:text-blue-500">
            {t("resolutionCriteria")}
          </h3>
          <MarkdownEditor
            markdown={question.group_of_questions?.resolution_criteria}
            contentEditableClassName="thecurve"
          />
        </>
      )}
      {!!question.group_of_questions?.fine_print && (
        <>
          <h3 className="m-0 mt-3 text-lg font-normal leading-5 text-blue-500 dark:text-blue-500">
            {t("finePrint")}
          </h3>
          <MarkdownEditor
            markdown={question.group_of_questions?.fine_print}
            contentEditableClassName="thecurve"
          />
        </>
      )}
      <div className="sticky bottom-0 left-0 flex h-12 w-full items-end bg-gradient-to-t from-blue-800/90 from-40% to-100% dark:from-blue-800">
        <Button
          variant="text"
          className={cn(
            "z-10 !justify-start !p-0 !pb-3 !font-normal !text-blue-500 dark:!text-blue-500"
          )}
          onClick={onCollapse}
        >
          <FontAwesomeIcon
            icon={faChevronUp}
            className="m-0"
            width={10}
            height={10}
          />

          {collapseLabel}
        </Button>
      </div>
    </div>
  );
};

export default CurveQuestionDetails;
