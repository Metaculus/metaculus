"use client";

import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Tooltip from "@/components/ui/tooltip";
import { ContinuousAreaGraphType } from "@/types/charts";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";

type Props = {
  value: ContinuousAreaGraphType;
  onChange: (graphType: ContinuousAreaGraphType) => void;
  questionType: QuestionType;
  className?: string;
};

// Mirrors the timeframe/zoom button styling in chart_container.tsx.
const buttonClassName = (isActive: boolean) =>
  cn(
    "rounded px-1 py-0.5 text-xs font-normal uppercase leading-4 text-gray-600 hover:text-blue-800 focus:outline-none dark:text-gray-600-dark hover:dark:text-blue-800-dark md:text-sm",
    isActive &&
      "bg-gray-300 text-gray-900 dark:bg-gray-300-dark dark:text-gray-900-dark"
  );

const PdfCdfTabs: FC<Props> = ({
  value,
  onChange,
  questionType,
  className,
}) => {
  const t = useTranslations();

  const buttons: { value: ContinuousAreaGraphType; label: string }[] = [
    {
      value: "pmf",
      label: questionType === QuestionType.Discrete ? t("pmf") : t("pdf"),
    },
    { value: "cdf", label: t("cdf") },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-0.5">
        {buttons.map(({ value: buttonValue, label }) => (
          <button
            key={buttonValue}
            type="button"
            onClick={() => onChange(buttonValue)}
            className={buttonClassName(value === buttonValue)}
          >
            {label}
          </button>
        ))}
      </div>
      <Tooltip
        showDelayMs={200}
        placement="bottom"
        renderInPortal={false}
        tooltipContent={
          (questionType === QuestionType.Discrete
            ? "PMF (Probability Mass Function) shows how likely different specific outcomes are,"
            : "PDF (Probability Density Function) shows how likely different outcomes are around specific values,") +
          " while CDF (Cumulative Distribution Function) shows the cumulative probability of outcomes up to a certain value."
        }
        variant="light"
        tooltipClassName="text-center !max-w-[331px] !text-base !p-4"
      >
        <FontAwesomeIcon
          icon={faCircleQuestion}
          height={16}
          className="text-gray-500 hover:text-blue-800 dark:text-gray-500-dark dark:hover:text-blue-800-dark"
        />
      </Tooltip>
    </div>
  );
};

export default PdfCdfTabs;
