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
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ label, value, pos, variant }, ref) => (
    <div
      ref={ref}
      className={cn(
        "absolute bottom-0 z-20 mb-[-9px] flex -translate-x-1/2 flex-col items-center gap-0.5",
        {
          "text-orange-800 dark:text-orange-800-dark": variant === "user",
          "text-olive-800 dark:text-olive-800-dark": variant === "community",
        }
      )}
      style={{ left: `${pos}%` }}
    >
      <div className="text-sm capitalize">{label}</div>
      <div>
        <div
          className={cn(
            "whitespace-nowrap rounded-[4px] px-1 py-0.5 text-sm font-medium leading-tight text-gray-0",
            {
              "bg-orange-600 dark:bg-orange-600-dark": variant === "user",
              "bg-olive-700 dark:bg-olive-700-dark": variant === "community",
            }
          )}
        >
          {value >= 0 ? "+" : ""}
          {value.toFixed(1)}
        </div>
        <div
          className={cn("mx-auto h-[18px] w-[1px]", {
            "bg-orange-600 dark:bg-orange-600-dark": variant === "user",
            "bg-olive-700 dark:bg-olive-700-dark": variant === "community",
          })}
        />
        <div
          className={cn("mx-auto h-1.5 w-1.5 rounded-full", {
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

const ScoreVisualization = ({
  userScore,
  communityScore,
  baselineLabel,
  baselineIcon,
}: ScoreVisualizationProps) => {
  const t = useTranslations();

  const transform = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 0.75);
  const scores = [userScore, communityScore].filter(
    (s): s is number => s != null
  );
  const allPositive = scores.every((s) => s > 0);
  const allNegative = scores.every((s) => s < 0);
  const baseline = allPositive ? 25 : allNegative ? 75 : 50;

  const transformed = scores.map(transform);
  const maxMag = Math.max(...transformed.map((x) => Math.abs(x)));
  const [minT, maxT] = [Math.min(...transformed), Math.max(...transformed)];
  const dominantNegative = Math.abs(minT) > Math.abs(maxT);
  const scale =
    maxMag > 0
      ? ((dominantNegative ? baseline : 100 - baseline) * 0.9) / maxMag
      : 0;

  const calcPos = (score?: number | null) =>
    score == null ? 0 : baseline + transform(score) * scale;
  const initialUserPos = calcPos(userScore);
  const initialCommPos = calcPos(communityScore);

  const [userPos, setUserPos] = useState(initialUserPos);
  const [commPos, setCommPos] = useState(initialCommPos);
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
      return;
    }

    const userRect = userRef.current.getBoundingClientRect();
    const commRect = commRef.current.getBoundingClientRect();
    const containerWidth = containerRef.current.offsetWidth;
    const gap =
      initialUserPos < initialCommPos
        ? commRect.left - userRect.right
        : userRect.left - commRect.right;

    if (gap >= MIN_BADGE_GAP_PX) {
      setUserPos(initialUserPos);
      setCommPos(initialCommPos);
      return;
    }

    const shiftPct = ((MIN_BADGE_GAP_PX - gap) / containerWidth) * 100;
    const leftPos = Math.min(initialUserPos, initialCommPos);
    const isUserRight = initialUserPos > initialCommPos;

    // If left < 50: move right badge right; else: move left badge left
    const [newUser, newComm] =
      leftPos < 50
        ? isUserRight
          ? [initialUserPos + shiftPct, initialCommPos]
          : [initialUserPos, initialCommPos + shiftPct]
        : isUserRight
          ? [initialUserPos, initialCommPos - shiftPct]
          : [initialUserPos - shiftPct, initialCommPos];

    setUserPos(Math.max(5, Math.min(95, newUser)));
    setCommPos(Math.max(5, Math.min(95, newComm)));
  }, [userScore, communityScore, initialUserPos, initialCommPos]);

  if (userScore == null && communityScore == null) return null;

  return (
    <div className="relative flex flex-col">
      {/* Badges */}
      <div ref={containerRef} className="relative mx-4 min-h-[58px]">
        {userScore != null && (
          <Badge
            ref={userRef}
            label={t("me")}
            value={userScore}
            pos={userPos}
            variant="user"
          />
        )}

        {communityScore != null && (
          <Badge
            ref={commRef}
            label={t("community")}
            value={communityScore}
            pos={commPos}
            variant="community"
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
}: {
  userScore: number | null | undefined;
  communityScore: number | null | undefined;
  className?: string;
}) => {
  const t = useTranslations();
  return (
    <ScoreCardContainer
      title={t("peerScore")}
      infoTitle={t("whatIsPeerScore")}
      infoContent={
        <>
          <p className="my-0 mb-2.5">{t("peerScoreExplanation")}</p>
          <Link
            href="/help/scores-faq/#peer-score"
            className="text-blue-700 underline dark:text-blue-700-dark"
          >
            {t("learnMoreAboutPeerScore")}
          </Link>
        </>
      }
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
}: {
  userScore: number | null | undefined;
  communityScore: number | null | undefined;
  className?: string;
}) => {
  const t = useTranslations();
  return (
    <ScoreCardContainer
      title={t("baselineScore")}
      infoTitle={t("whatIsBaselineScore")}
      infoContent={
        <>
          <p className="my-0 mb-2.5">{t("baselineScoreExplanation")}</p>
          <Link
            href="/help/scores-faq/#baseline-score"
            className="text-blue-700 underline dark:text-blue-700-dark"
          >
            {t("learnMoreAboutBaselineScore")}
          </Link>
        </>
      }
      className={className}
    >
      <ScoreVisualization
        userScore={userScore}
        communityScore={communityScore}
        baselineLabel={t.rich("baselineChance", {
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
  type: "peer" | "baseline";
  userScore: number | null | undefined;
  communityScore: number | null | undefined;
  className?: string;
}) {
  return type === "peer" ? (
    <PeerScoreCard
      userScore={userScore}
      communityScore={communityScore}
      className={className}
    />
  ) : (
    <BaselineScoreCard
      userScore={userScore}
      communityScore={communityScore}
      className={className}
    />
  );
}
