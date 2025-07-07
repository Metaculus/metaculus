import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { QuestionStatus } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import cn from "@/utils/core/cn";

type Props = {
  question: QuestionWithNumericForecasts;
  variant?: "sm" | "md";
};

const BinaryCPBar: FC<Props> = ({ question, variant = "md" }) => {
  const t = useTranslations();
  const questionCP =
    question.aggregations.recency_weighted.latest?.centers?.[0];
  // TODO: should we show it everywhere?
  if (question.type !== QuestionType.Binary) {
    return null;
  }
  const isClosed = question.status === QuestionStatus.CLOSED;
  const cpPercentage = Math.round((questionCP ?? 0) * 1000) / 10;

  // SVG configurations
  const strokeWidth = {
    sm: 8,
    md: 12,
  }[variant];
  const strokeCursorWidth = {
    sm: 11,
    md: 17,
  }[variant];
  const width = {
    sm: 85,
    md: 112,
  }[variant];
  const height = {
    sm: 50,
    md: 66,
  }[variant];
  const radius = (width - strokeWidth / 2) / 2;
  const arcAngle = Math.PI * 1.1;
  const center = {
    x: width / 2,
    y: height - strokeWidth,
  };

  const backgroundArc = describeArc({
    percentage: 100,
    isLargerFlag: 1,
    arcAngle,
    center,
    radius,
  });
  const progressArc = describeArc({
    percentage: cpPercentage,
    isLargerFlag: cpPercentage > 90 ? 1 : 0,
    arcAngle,
    center,
    radius,
  });
  const { textColor, strokeColor, progressColor } = getColorStyles(
    cpPercentage,
    isClosed || isNil(questionCP)
  );

  const startAngle = Math.PI - (arcAngle - Math.PI) / 2;
  const endAngle = startAngle + (cpPercentage / 100) * arcAngle;
  const gradientStartX = center.x + radius * Math.cos(startAngle);
  const gradientStartY = center.y + radius * Math.sin(startAngle);
  const gradientEndX = center.x + radius * Math.cos(endAngle);
  const gradientEndY = center.y + radius * Math.sin(endAngle);

  return (
    <div className="relative flex min-w-[200px] max-w-[200px] items-center justify-center">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient
            id={`progressGradient-${question.id}`}
            x1={gradientStartX}
            y1={gradientStartY}
            x2={gradientEndX}
            y2={gradientEndY}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={progressColor} stopOpacity="0" />
            <stop
              offset={`${Math.min(100, (cpPercentage / 15) * 100)}%`}
              stopColor={progressColor}
              stopOpacity="1"
            />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path
          d={backgroundArc.path}
          fill="none"
          stroke={undefined}
          strokeWidth={strokeWidth}
          className={cn("opacity-15", strokeColor)}
        />

        {/* Progress arc */}
        <path
          d={progressArc.path}
          fill="none"
          stroke={`url(#progressGradient-${question.id})`}
          strokeWidth={strokeWidth}
        />

        {/* Tick marker */}
        {cpPercentage > 0 && (
          <line
            x1={
              progressArc.endPoint.x -
              2 * Math.cos(progressArc.angle + Math.PI / 2)
            }
            y1={
              progressArc.endPoint.y -
              2 * Math.sin(progressArc.angle + Math.PI / 2)
            }
            x2={
              progressArc.endPoint.x +
              2 * Math.cos(progressArc.angle + Math.PI / 2)
            }
            y2={
              progressArc.endPoint.y +
              2 * Math.sin(progressArc.angle + Math.PI / 2)
            }
            className={strokeColor}
            strokeWidth={strokeCursorWidth}
          />
        )}
      </svg>
      <div
        className={cn(
          "absolute bottom-0 flex w-[60px] flex-col items-center justify-center text-center text-sm",
          textColor
        )}
      >
        <span
          className={cn("text-lg font-bold", {
            "leading-[24px]": variant === "sm",
            "leading-8": variant === "md",
          })}
        >
          {!isNil(questionCP) && cpPercentage}%
        </span>
        <span
          className={cn("font-normal uppercase", {
            "text-[9px] leading-[10px]": variant === "sm",
            "leading text-xs uppercase": variant === "md",
          })}
        >
          {t("chance")}
        </span>
      </div>
    </div>
  );
};

function describeArc({
  percentage,
  isLargerFlag,
  arcAngle,
  center,
  radius,
}: {
  percentage: number;
  isLargerFlag: 0 | 1;
  arcAngle: number;
  center: { x: number; y: number };
  radius: number;
}) {
  const startAngle = Math.PI - (arcAngle - Math.PI) / 2;
  const endAngle = startAngle + (percentage / 100) * arcAngle;
  const startX = center.x + radius * Math.cos(startAngle);
  const startY = center.y + radius * Math.sin(startAngle);
  const endX = center.x + radius * Math.cos(endAngle);
  const endY = center.y + radius * Math.sin(endAngle);

  return {
    path: `
        M ${startX} ${startY}
        A ${radius} ${radius} 0 ${isLargerFlag} 1 ${endX} ${endY}
      `,
    endPoint: { x: endX, y: endY },
    angle: endAngle,
  };
}

function getColorStyles(percentage: number, isInactive: boolean) {
  if (isInactive) {
    return {
      textColor: `text-gray-600 dark:text-gray-600-dark`,
      strokeColor: `stroke-gray-600 dark:stroke-gray-600-dark`,
      progressColor: "#777777",
    };
  }
  if (percentage > 85) {
    return {
      textColor: `text-[#66A566]`,
      strokeColor: `stroke-[#66A566]`,
      progressColor: "#66A566",
    };
  } else if (percentage > 75) {
    return {
      textColor: `text-[#7BA06B]`,
      strokeColor: `stroke-[#7BA06B]`,
      progressColor: "#7BA06B",
    };
  } else if (percentage > 50) {
    return {
      textColor: `text-[#899D6E]`,
      strokeColor: `stroke-[#899D6E]`,
      progressColor: "#899D6E",
    };
  } else if (percentage > 35) {
    return {
      textColor: `text-[#979A72]`,
      strokeColor: `stroke-[#979A72]`,
      progressColor: "#979A72",
    };
  } else if (percentage > 25) {
    return {
      textColor: `text-[#A59775]`,
      strokeColor: `stroke-[#A59775]`,
      progressColor: "#A59775",
    };
  } else if (percentage > 15) {
    return {
      textColor: `text-[#B29378]`,
      strokeColor: `stroke-[#B29378]`,
      progressColor: "#B29378",
    };
  } else if (percentage > 10) {
    return {
      textColor: `text-[#C0907B]`,
      strokeColor: `stroke-[#C0907B]`,
      progressColor: "#C0907B",
    };
  }
  return {
    textColor: `text-[#D58B80]`,
    strokeColor: `stroke-[#D58B80]`,
    progressColor: "#D58B80",
  };
}
export default BinaryCPBar;
