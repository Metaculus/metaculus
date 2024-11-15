"use client";

import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import { PostWithForecasts } from "@/types/post";

import "./styles.css";

type Props = {
  question: PostWithForecasts;
  expandLabel?: string;
  collapseLabel?: string;
  className?: string;
};

const CurveQuestionDetails: FC<Props> = ({
  expandLabel: _expandLabel,
  collapseLabel: _collapseLabel,
  className,
  question,
}) => {
  const t = useTranslations();
  const expandLabel = _expandLabel ?? t("details");
  const collapseLabel = _collapseLabel ?? t("collapse");

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col">
      {isExpanded && (
        <div>
          {!!question.group_of_questions?.resolution_criteria && (
            <MarkdownEditor
              markdown={question.group_of_questions?.resolution_criteria}
              contentEditableClassName="thecurve"
            />
          )}
          {!!question.group_of_questions?.fine_print && (
            <MarkdownEditor
              markdown={question.group_of_questions?.fine_print}
              contentEditableClassName="thecurve"
            />
          )}
        </div>
      )}
      <Button
        variant="text"
        className={classNames(
          "mt-2 !justify-start !p-0 !font-normal !text-blue-500 dark:!text-blue-500",
          { "mb-2": isExpanded }
        )}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <FontAwesomeIcon
          icon={isExpanded ? faChevronUp : faChevronDown}
          className="m-0"
          width={10}
          height={10}
        />

        {isExpanded ? collapseLabel : expandLabel}
      </Button>
    </div>
  );
};

export default CurveQuestionDetails;
