"use client";

import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, {
  forwardRef,
  PropsWithChildren,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { InfoToggleContainer } from "@/components/ui/info_toggle_container";
import cn from "@/utils/core/cn";

const MIN_BADGE_GAP_PX = 12;

interface BadgeProps {
  label: string;
  value: number;
  pos: number;
  variant: "user" | "community";
  align?: "left" | "center" | "right";
  xOffset?: number;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ label, value, pos, variant, align = "center", xOffset = 0 }, ref) => (
    <div
      ref={ref}
      className={cn(
        "absolute bottom-0 z-20 mb-[-9px] flex -translate-x-1/2 flex-col items-center",
        {
          "text-orange-800 dark:text-orange-800-dark": variant === "user",
          "text-olive-800 dark:text-olive-800-dark": variant === "community",
        }
      )}
      style={{ left: `${pos}%` }}
    >
      <div
        className="flex flex-col items-center gap-0.5"
        style={{ transform: `translateX(${xOffset}px)` }}
      >
        <div className="relative flex w-full justify-center">
          <div
            className={cn(
              "absolute bottom-0 mb-0.5 whitespace-nowrap text-sm capitalize",
              {
                "left-1/2 -translate-x-1/2":
                  align === "center" || variant === "user",
                "-left-2.5": align === "left" && variant === "community",
                "-right-2.5": align === "right" && variant === "community",
              }
            )}
          >
            {label}
          </div>
        </div>
        <div>
          <div
            className={cn(
              "whitespace-nowrap rounded-[4px] px-1 py-0.5 text-sm font-medium leading-tight text-gray-0 dark:text-gray-0-dark",
              {
                "bg-orange-600 dark:bg-orange-600-dark": variant === "user",
                "bg-olive-700 dark:bg-olive-700-dark": variant === "community",
              }
            )}
          >
            {value >= 0 ? "+" : ""}
            {value.toFixed(1)}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div
          className={cn("-mt-1 h-[22px] w-[1px]", {
            "bg-orange-600 dark:bg-orange-600-dark": variant === "user",
            "bg-olive-700 dark:bg-olive-700-dark": variant === "community",
          })}
        />
        <div
          className={cn("h-1.5 w-1.5 rounded-full", {
            "bg-orange-600 dark:bg-orange-600-dark": variant === "user",
            "bg-olive-700 dark:bg-olive-700-dark": variant === "community",
          })}
        />
      </div>
    </div>
  )
);
Badge.displayName = "Badge";

const BaselineBadge = ({
  label,
  pos,
  icon,
}: {
  label: ReactNode;
  pos: number;
  icon: ReactNode;
}) => (
  <div
    className="absolute z-10 mt-[-12px] flex -translate-x-1/2 flex-col items-center"
    style={{ marginLeft: `${pos}%` }}
  >
    <div className="mx-auto h-7 w-[1px] bg-gray-500 dark:bg-gray-500-dark" />

    <div className="rounded border border-gray-500 bg-gray-0 p-1 leading-none text-gray-500 dark:border-gray-500-dark dark:bg-gray-0-dark dark:text-gray-500-dark">
      {icon}
    </div>

    <div className="mt-0.5 text-center text-sm font-medium leading-[16px] text-gray-600 dark:text-gray-600-dark">
      {label}
    </div>
  </div>
);

interface ScoreVisualizationProps {
  userScore: number | null | undefined;
  communityScore: number | null | undefined;
  baselineLabel: ReactNode;
  baselineIcon: ReactNode;
}

const scaleScores = (user: number, community: number) => {
  const max = Math.max(Math.abs(user), Math.abs(community));
  if (max === 0) return { user: 0.5, community: 0.5 };

  // Safety margin for borders
  // If the same sign and community label is on the left and the highest val -> do 17.5% instead
  const GAP =
    user * community > 0 &&
    Math.abs(community) > Math.abs(user) &&
    Math.abs(user) / Math.abs(community) > 0.7
      ? 0.175
      : 0.1;

  // Visual divider
  const PAD = 0.25;

  // Linear Interpolation
  const lerp = (norm: number, min: number, max: number) =>
    min + norm * (max - min);

  let getScore: (val: number) => number;

  if (user > 0 && community > 0) {
    // Both Positive: Map 0..1 to [0.25, 0.95]
    // 0% becomes 25% (PAD), 100% becomes 90% (1 - GAP)
    getScore = (val) => lerp(val / max, PAD, 1 - GAP);
  } else if (user < 0 && community < 0) {
    // Both Negative: Map 0..1 to [0.1, 0.75]
    // 0% (Most Negative) becomes 10% (GAP)
    // 100% (Zero) becomes 75% (1 - PAD)
    getScore = (val) => lerp(1 - Math.abs(val) / max, GAP, 1 - PAD);
  } else {
    // Mixed: Map 0..1 to [0.1, 0.9]
    // Max becomes 10%, +Max becomes 90%
    getScore = (val) => lerp((val + max) / (2 * max), GAP, 1 - GAP);
  }

  return {
    user: getScore(user),
    community: getScore(community),
  };
};

const ScoreVisualization = ({
  userScore,
  communityScore,
  baselineLabel,
  baselineIcon,
}: ScoreVisualizationProps) => {
  const t = useTranslations();

  const scores = [userScore, communityScore].filter(
    (s): s is number => s != null
  );
  const allPositive = scores.every((s) => s > 0);
  const allNegative = scores.every((s) => s < 0);

  let baseline = 50;

  if (allPositive) {
    baseline = 25;
  } else if (allNegative) {
    baseline = 75;
  }

  const { user: initialUserPos, community: initialCommPos } = scaleScores(
    userScore ?? 0,
    communityScore ?? 0
  );

  const [userPos, setUserPos] = useState(initialUserPos);
  const [commPos, setCommPos] = useState(initialCommPos);
  const [offsets, setOffsets] = useState<{ user: number; comm: number }>({
    user: 0,
    comm: 0,
  });
  const [align, setAlign] = useState<{
    user: "left" | "center" | "right";
    comm: "left" | "center" | "right";
  }>({ user: "center", comm: "center" });
  const userRef = useRef<HTMLDivElement>(null);
  const commRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !userScore ||
      !communityScore ||
      !userRef.current ||
      !commRef.current ||
      !containerRef.current
    ) {
      setUserPos(initialUserPos);
      setCommPos(initialCommPos);
      setOffsets({ user: 0, comm: 0 });
      setAlign({ user: "center", comm: "center" });
      return;
    }

    const containerWidth = containerRef.current.offsetWidth;
    const userPx = initialUserPos * containerWidth;
    const commPx = initialCommPos * containerWidth;

    // Line gap calculation (center-to-center)
    const LINE_GAP_PX = 4;
    const lineGap = Math.abs(userPx - commPx);

    let adjustedUserPos = initialUserPos;
    let adjustedCommPos = initialCommPos;

    if (lineGap < LINE_GAP_PX) {
      const neededLineShift = LINE_GAP_PX - lineGap;
      const shiftPct = neededLineShift / 2 / containerWidth;

      if (initialUserPos < initialCommPos) {
        adjustedUserPos -= shiftPct;
        adjustedCommPos += shiftPct;
      } else {
        adjustedUserPos += shiftPct;
        adjustedCommPos -= shiftPct;
      }
    }

    setUserPos(adjustedUserPos);
    setCommPos(adjustedCommPos);

    // Content gap calculation using ADJUSTED positions
    const adjUserPx = adjustedUserPos * containerWidth;
    const adjCommPx = adjustedCommPos * containerWidth;

    const userWidth = userRef.current.offsetWidth;
    const commWidth = commRef.current.offsetWidth;

    const isUserLeft = adjustedUserPos < adjustedCommPos;
    const leftPx = isUserLeft ? adjUserPx : adjCommPx;
    const rightPx = isUserLeft ? adjCommPx : adjUserPx;
    const leftWidth = isUserLeft ? userWidth : commWidth;
    const rightWidth = isUserLeft ? commWidth : userWidth;

    const gap = rightPx - rightWidth / 2 - (leftPx + leftWidth / 2);

    if (gap >= MIN_BADGE_GAP_PX) {
      setOffsets({ user: 0, comm: 0 });
      setAlign({ user: "center", comm: "center" });
      return;
    }

    const SIDE_BY_SIDE_GAP_PX = 4;
    const neededShift = Math.max(0, SIDE_BY_SIDE_GAP_PX - gap);

    // Distribute shift proportionally to widths to ensure flush alignment at max compression
    const totalWidth = leftWidth + rightWidth;
    const leftShiftMagnitude = neededShift * (leftWidth / totalWidth) - 0.5;
    const rightShiftMagnitude = neededShift * (rightWidth / totalWidth) - 0.5;

    setOffsets(
      isUserLeft
        ? { user: -leftShiftMagnitude, comm: rightShiftMagnitude }
        : { user: rightShiftMagnitude, comm: -leftShiftMagnitude }
    );
    setAlign({
      user: isUserLeft ? "right" : "left",
      comm: isUserLeft ? "left" : "right",
    });
  }, [userScore, communityScore, initialUserPos, initialCommPos]);

  if (userScore == null && communityScore == null) return null;

  return (
    <div className="relative flex flex-col">
      {/* Badges */}
      <div ref={containerRef} className="relative min-h-[58px]">
        {userScore != null && (
          <Badge
            ref={userRef}
            label={t("me")}
            value={userScore}
            pos={userPos * 100}
            variant="user"
            align={align.user}
            xOffset={offsets.user}
          />
        )}

        {communityScore != null && (
          <Badge
            ref={commRef}
            label={t("community")}
            value={communityScore}
            pos={commPos * 100}
            variant="community"
            align={align.comm}
            xOffset={offsets.comm}
          />
        )}
      </div>

      {/* Gradient background */}
      <div className="relative h-3">
        <div className="absolute inset-0 overflow-hidden rounded-full opacity-35">
          <div
            className="absolute left-0 top-0 h-full"
            style={{ width: `${baseline}%`, backgroundColor: "#D58B80" }}
          />
          <div
            className="absolute right-0 top-0 h-full"
            style={{
              width: `${100 - baseline}%`,
              backgroundColor: "#66A566",
            }}
          />
        </div>
      </div>

      {/* Baseline indicator */}
      <div className="relative min-h-[88px]">
        <BaselineBadge
          label={baselineLabel}
          pos={baseline}
          icon={baselineIcon}
        />
      </div>
    </div>
  );
};

const ScoreCardContainer = ({
  title,
  children,
  infoTitle,
  infoContent,
  className,
}: PropsWithChildren<{
  title: string;
  infoTitle: ReactNode;
  infoContent: ReactNode;
  className?: string;
}>) => (
  <InfoToggleContainer
    title={title}
    infoTitle={infoTitle}
    infoContent={infoContent}
    className={className}
  >
    {children}
  </InfoToggleContainer>
);

export const PeerScoreCard = ({
  userScore,
  communityScore,
  className,
  title,
  infoTitle,
  infoContent,
}: {
  userScore: number | null | undefined;
  communityScore: number | null | undefined;
  className?: string;
  title: string;
  infoTitle?: ReactNode;
  infoContent?: ReactNode;
}) => {
  const t = useTranslations();
  return (
    <ScoreCardContainer
      title={title}
      infoTitle={infoTitle}
      infoContent={infoContent}
      className={className}
    >
      <ScoreVisualization
        userScore={userScore}
        communityScore={communityScore}
        baselineLabel={t.rich("averageOfPeers", {
          secondary: (chunk) => (
            <div className="font-normal opacity-50">{chunk}</div>
          ),
        })}
        baselineIcon={
          <FontAwesomeIcon
            icon={faUsers}
            className="text-xs text-gray-500 dark:text-gray-500-dark"
          />
        }
      />
    </ScoreCardContainer>
  );
};

export const BaselineScoreCard = ({
  userScore,
  communityScore,
  className,
  title,
  infoTitle,
  infoContent,
}: {
  userScore: number | null | undefined;
  communityScore: number | null | undefined;
  className?: string;
  title: string;
  infoTitle?: ReactNode;
  infoContent?: ReactNode;
}) => {
  const t = useTranslations();
  return (
    <ScoreCardContainer
      title={title}
      infoTitle={infoTitle}
      infoContent={infoContent}
      className={className}
    >
      <ScoreVisualization
        userScore={userScore}
        communityScore={communityScore}
        baselineLabel={t.rich("chanceBaseline", {
          secondary: (chunk) => (
            <div className="font-normal opacity-50">{chunk}</div>
          ),
        })}
        baselineIcon={<div className="text-sm font-medium leading-none">0</div>}
      />
    </ScoreCardContainer>
  );
};

export default function ScoreCard({
  type,
  userScore,
  communityScore,
  className,
}: {
  type: "peer" | "baseline" | "spot_peer" | "spot_baseline";
  userScore: number | null | undefined;
  communityScore: number | null | undefined;
  className?: string;
}) {
  const t = useTranslations();
  const isSpot = type.includes("spot");

  console.log("isSpot", isSpot, type);

  if (type.includes("peer")) {
    return (
      <PeerScoreCard
        userScore={userScore}
        communityScore={communityScore}
        className={cn(className, {
          "min-h-[240px]": !isSpot,
          "min-h-[290px]": isSpot,
        })}
        title={isSpot ? t("spotPeerScore") : t("peerScore")}
        infoTitle={isSpot ? t("whatIsSpotPeerScore") : t("whatIsPeerScore")}
        infoContent={
          <div className="flex h-full flex-col">
            <p className="my-0 mb-2.5">
              {isSpot
                ? t("spotPeerScoreExplanation")
                : t("peerScoreExplanation")}
            </p>
            <Link
              href={
                isSpot
                  ? "/help/scores-faq/#spot-score"
                  : "/help/scores-faq/#peer-score"
              }
              className="mt-auto text-blue-700 underline dark:text-blue-700-dark"
            >
              {isSpot
                ? t("learnMoreAboutSpotScores")
                : t("learnMoreAboutPeerScore")}
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <BaselineScoreCard
      userScore={userScore}
      communityScore={communityScore}
      className={cn(className, {
        "min-h-[240px]": !isSpot,
        "min-h-[290px]": isSpot,
      })}
      title={isSpot ? t("spotBaselineScore") : t("baselineScore")}
      infoTitle={
        isSpot ? t("whatIsSpotBaselineScore") : t("whatIsBaselineScore")
      }
      infoContent={
        <div className="flex h-full flex-col">
          <p className="my-0 mb-2.5">
            {isSpot
              ? t("spotBaselineScoreExplanation")
              : t("baselineScoreExplanation")}
          </p>
          <Link
            href={
              isSpot
                ? "/help/scores-faq/#spot-score"
                : "/help/scores-faq/#baseline-score"
            }
            className="mt-auto text-blue-700 underline dark:text-blue-700-dark"
          >
            {isSpot
              ? t("learnMoreAboutSpotScores")
              : t("learnMoreAboutBaselineScore")}
          </Link>
        </div>
      }
    />
  );
}
