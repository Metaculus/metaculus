import { faCircleInfo, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren, ReactNode } from "react";

import cn from "@/utils/core/cn";

const Badge: FC<{
  label: string;
  value: number;
  pos: number;
  variant: "user" | "community";
}> = ({ label, value, pos, variant }) => (
  <div
    className={cn(
      "absolute bottom-0 left-[var(--pos)] z-20 mb-[-9px] flex -translate-x-[var(--pos)] flex-col items-center gap-0.5",
      {
        "text-orange-800 dark:text-orange-800-dark": variant === "user",
        "text-olive-800 dark:text-olive-800-dark": variant === "community",
      }
    )}
    style={{ "--pos": `${pos}%` } as React.CSSProperties}
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
);

const BaselineBadge: FC<{
  label: ReactNode;
  pos: number;
  icon: ReactNode;
}> = ({ label, pos, icon }) => (
  <div
    className="absolute z-20 mt-[-12px] flex -translate-x-1/2 flex-col items-center"
    style={{ marginLeft: `${pos}%` }}
  >
    <div className="mx-auto h-7 w-[1px] bg-gray-500 dark:bg-gray-500-dark" />
    <div className="rounded border border-gray-500 bg-gray-0 p-1 leading-none text-gray-500 dark:border-gray-500-dark dark:bg-gray-0-dark dark:text-gray-500-dark">
      {icon}
    </div>
    <div className="mt-0.5 text-center text-sm font-medium text-gray-600 dark:text-gray-600-dark">
      {label}
    </div>
  </div>
);

// Generic score visualization (no borders or title)
const ScoreVisualization: FC<{
  userScore: number | null | undefined;
  communityScore: number | null | undefined;
  baselineLabel: ReactNode;
  baselineIcon: ReactNode;
}> = ({ userScore, communityScore, baselineLabel, baselineIcon }) => {
  const t = useTranslations();

  if (userScore == null && communityScore == null) return null;

  const transform = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 0.75);
  const scores = [userScore, communityScore].filter(
    (s): s is number => s != null
  );
  const allPositive = scores.every((s) => s > 0);
  const allNegative = scores.every((s) => s < 0);
  const baseline = allPositive ? 25 : allNegative ? 75 : 50;

  const transformed = scores.map(transform);
  const maxMag = Math.max(...transformed.map(Math.abs));
  const minTransformed = Math.min(...transformed);
  const maxTransformed = Math.max(...transformed);
  const isDominantNegative =
    Math.abs(minTransformed) > Math.abs(maxTransformed);
  const scale =
    maxMag > 0
      ? ((isDominantNegative ? baseline : 100 - baseline) * 0.9) / maxMag
      : 0;

  const getPos = (score: number | null | undefined) => {
    if (score == null) return 0;
    return baseline + transform(score) * scale;
  };

  const userPos = getPos(userScore);
  const commPos = getPos(communityScore);

  return (
    <div className="relative flex flex-col">
      <div className="relative min-h-[60px]">
        {userScore != null && (
          <Badge
            label={t("me")}
            value={userScore}
            pos={userPos}
            variant="user"
          />
        )}
        {communityScore != null && (
          <Badge
            label={t("community")}
            value={communityScore}
            pos={commPos}
            variant="community"
          />
        )}
      </div>

      <div className="relative z-10 h-3">
        <div className="absolute inset-0 overflow-hidden rounded-full opacity-35">
          <div
            className="absolute left-0 top-0 h-full"
            style={{ width: `${baseline}%`, backgroundColor: "#D58B80" }}
          />
          <div
            className="absolute right-0 top-0 h-full"
            style={{ width: `${100 - baseline}%`, backgroundColor: "#66A566" }}
          />
        </div>
      </div>

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

// Container component
const ScoreCardContainer: FC<
  PropsWithChildren<{
    title: string;
    className?: string;
  }>
> = ({ title, children, className }) => (
  <div
    className={cn(
      "flex flex-col gap-4 rounded-lg border border-gray-300 bg-gray-0 p-4 dark:border-gray-300-dark dark:bg-gray-0-dark",
      className
    )}
  >
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-900-dark">
        {title}
      </h3>
      <FontAwesomeIcon
        icon={faCircleInfo}
        className="text-base text-gray-400 dark:text-gray-400-dark"
      />
    </div>
    {children}
  </div>
);

export const PeerScoreCard: FC<{
  userScore: number | null | undefined;
  communityScore: number | null | undefined;
  className?: string;
}> = ({ userScore, communityScore, className }) => {
  const t = useTranslations();

  return (
    <ScoreCardContainer title={t("peerScore")} className={className}>
      <ScoreVisualization
        userScore={userScore}
        communityScore={communityScore}
        baselineLabel={t.rich("averageOfPeers", {
          secondary: (chunk) => (
            <div className="font-normal opacity-50">{chunk}</div>
          ),
        })}
        baselineIcon={
          <div className="leading-[0]">
            <FontAwesomeIcon
              icon={faUsers}
              className="text-xs text-gray-500 dark:text-gray-500-dark"
            />
          </div>
        }
      />
    </ScoreCardContainer>
  );
};

export const BaselineScoreCard: FC<{
  userScore: number | null | undefined;
  communityScore: number | null | undefined;
  className?: string;
}> = ({ userScore, communityScore, className }) => {
  const t = useTranslations();

  return (
    <ScoreCardContainer title={t("baselineScore")} className={className}>
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

// Default export for backwards compatibility
const ScoreCard: FC<{
  type: "peer" | "baseline";
  userScore: number | null | undefined;
  communityScore: number | null | undefined;
  className?: string;
}> = ({ type, userScore, communityScore, className }) => {
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
};

export default ScoreCard;
