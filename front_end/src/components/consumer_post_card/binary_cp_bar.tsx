import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useId } from "react";

import { useHideCP } from "@/contexts/cp_context";
import { QuestionStatus } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { getBinaryGaugeColors } from "@/utils/colors/binary_gauge_colors";
import cn from "@/utils/core/cn";

type Props = {
  question: QuestionWithNumericForecasts;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const BinaryCPBar: FC<Props> = ({ question, size = "md", className }) => {
  const t = useTranslations();
  const { hideCP } = useHideCP();
  const gradientId = useId();

  const questionCP =
    question.aggregations[question.default_aggregation_method]?.latest
      ?.centers?.[0];

  if (question.type !== QuestionType.Binary || !questionCP) {
    return null;
  }

  const isClosed = question.status === QuestionStatus.CLOSED;

  const cpPercentage =
    !hideCP && !isNil(questionCP)
      ? Math.round((questionCP as number) * 1000) / 10
      : null;

  const width = 112;
  const height = 66;
  const strokeWidth = 12;
  const strokeCursorWidth = 17;
  const radius = (width - strokeWidth) / 2;
  const arcAngle = Math.PI * 1.1;
  const center = { x: width / 2, y: height - strokeWidth };

  const backgroundArc = describeArc({
    percentage: 100,
    isLargerFlag: 1,
    arcAngle,
    center,
    radius,
  });

  const progressArc =
    cpPercentage && cpPercentage > 0
      ? describeArc({
          percentage: cpPercentage,
          isLargerFlag: cpPercentage > 90 ? 1 : 0,
          arcAngle,
          center,
          radius,
        })
      : null;

  const { textClass, strokeClass, hex } = getBinaryGaugeColors(
    cpPercentage ?? 0,
    isClosed || isNil(questionCP) || hideCP
  );

  const startAngle = Math.PI - (arcAngle - Math.PI) / 2;
  const endAngle = startAngle + ((cpPercentage ?? 0) / 100) * arcAngle;
  const gradientStartX = center.x + radius * Math.cos(startAngle);
  const gradientStartY = center.y + radius * Math.sin(startAngle);
  const gradientEndX = center.x + radius * Math.cos(endAngle);
  const gradientEndY = center.y + radius * Math.sin(endAngle);

  return (
    <div
      className={cn(
        "relative flex origin-top items-center justify-center",
        {
          "scale-[0.5]": size === "xs",
          "scale-[0.85]": size === "sm",
          "scale-100": size === "md",
          "mb-4 scale-[1.25]": size === "lg",
        },
        className
      )}
    >
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient
            id={gradientId}
            x1={gradientStartX}
            y1={gradientStartY}
            x2={gradientEndX}
            y2={gradientEndY}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={hex} stopOpacity="0" />
            <stop
              offset={`${Math.min(100, ((cpPercentage ?? 0) / 15) * 100)}%`}
              stopColor={hex}
              stopOpacity="1"
            />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path
          d={backgroundArc.path}
          fill="none"
          stroke={hex}
          strokeOpacity={0.15}
          strokeWidth={strokeWidth}
          className={strokeClass}
        />

        {/* Progress arc */}
        {progressArc && (
          <path
            d={progressArc.path}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
          />
        )}

        {/* Tick marker */}
        {progressArc && (
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
            stroke={hex}
            className={strokeClass}
            strokeWidth={strokeCursorWidth}
          />
        )}
      </svg>
      <div
        className={cn(
          "absolute bottom-0 flex w-[60px] flex-col items-center justify-center text-center",
          textClass,
          size === "xs" && "bottom-[10px] scale-[200%]"
        )}
      >
        <span
          className={cn(
            "font-bold",
            size === "xs" ? "text-[12px] leading-4" : "text-xl leading-8"
          )}
        >
          {cpPercentage != null ? `${cpPercentage}%` : "%"}
        </span>
        <span
          className={cn(
            "font-normal uppercase",
            size === "xs" ? "text-[6px] leading-[6px]" : "text-xs leading-none"
          )}
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
    path: `M ${startX} ${startY} A ${radius} ${radius} 0 ${isLargerFlag} 1 ${endX} ${endY}`,
    endPoint: { x: endX, y: endY },
    angle: endAngle,
  };
}

export default BinaryCPBar;
