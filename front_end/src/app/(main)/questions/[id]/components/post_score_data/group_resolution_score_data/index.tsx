import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import SectionToggle from "@/components/ui/section_toggle";
import Tooltip from "@/components/ui/tooltip";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts, ScoreData } from "@/types/question";

import { AdditionalScoresTable } from "../additional_scores_table";
import GroupScoreCell from "./group_score_cell";

type Props = {
  post: PostWithForecasts;
  isConsumerView?: boolean;
};

const getScore = (data: ScoreData | undefined, key: string) => {
  const field = `${key}_score` as keyof ScoreData;
  return data?.[field];
};

type RowData = {
  question: QuestionWithNumericForecasts;
  cpBaselineScore: number | null | undefined;
  userBaselineScore: number | null | undefined;
  cpPeerScore: number | null | undefined;
  userPeerScore: number | null | undefined;
};

const GroupResolutionScoreRow: FC<RowData> = ({
  question,
  cpBaselineScore,
  userBaselineScore,
  cpPeerScore,
  userPeerScore,
}) => {
  return (
    <div className="flex items-center border-b border-gray-300 bg-white p-4 dark:border-gray-300-dark dark:bg-gray-0-dark">
      <div className="flex flex-1 items-center gap-2">
        <span className="text-gray-800 dark:text-gray-800-dark">
          {question.label}
        </span>
        <Tooltip
          tooltipContent={
            <AdditionalScoresTable question={question} variant="compact" />
          }
          className="cursor-help text-blue-500 hover:text-blue-800 dark:text-blue-500-dark dark:hover:text-blue-800-dark"
          tooltipClassName="p-0 border-none bg-transparent w-[320px]"
        >
          <FontAwesomeIcon icon={faCircleInfo} />
        </Tooltip>
      </div>
      <div className="w-28 sm:w-36">
        <GroupScoreCell
          userScore={userBaselineScore}
          communityScore={cpBaselineScore}
        />
      </div>
      <div className="w-28 sm:w-36">
        <GroupScoreCell
          userScore={userPeerScore}
          communityScore={cpPeerScore}
        />
      </div>
    </div>
  );
};

const GroupResolutionScores: FC<Props> = ({ post }) => {
  const t = useTranslations();

  if (!post.group_of_questions) return null;

  const rows = post.group_of_questions.questions.reduce<RowData[]>((acc, q) => {
    const spot = q.default_score_type.startsWith("spot");
    const peerKey = spot ? "spot_peer" : "peer";
    const baselineKey = spot ? "spot_baseline" : "baseline";

    const cpScores = q.aggregations?.[q.default_aggregation_method]?.score_data;
    const userScores = q.my_forecasts?.score_data;
    const cpBaselineScore = getScore(cpScores, baselineKey);

    if (!isNil(cpBaselineScore)) {
      acc.push({
        question: q,
        cpBaselineScore,
        userBaselineScore: getScore(userScores, baselineKey),
        cpPeerScore: getScore(cpScores, peerKey),
        userPeerScore: getScore(userScores, peerKey),
      });
    }
    return acc;
  }, []);

  if (rows.length === 0) {
    return null;
  }

  const hasUserForecasts = rows.some((r) => r.question.my_forecasts?.latest);

  const renderHeader = (label: string, scoreLabel?: string) => (
    <div className="flex items-center border-b border-blue-400 bg-blue-100 px-4 py-2.5 text-sm font-bold capitalize text-gray-500 dark:border-blue-400-dark dark:bg-blue-100-dark dark:text-gray-500-dark">
      <div className="flex-1">{label}</div>
      {scoreLabel && <div className="w-1/2 text-center">{scoreLabel}</div>}
      {!scoreLabel && (
        <>
          <div className="w-28 text-center sm:w-36">
            <span className="hidden sm:inline"> {t("baselineScore")}</span>
            <span className="sm:hidden"> {t("baseline")}</span>
          </div>
          <div className="w-28 text-center sm:w-36">
            <span className="hidden sm:inline"> {t("peerScore")}</span>
            <span className="sm:hidden"> {t("score")}</span>
          </div>
        </>
      )}
    </div>
  );

  return (
    <SectionToggle
      title={hasUserForecasts ? t("myScores") : t("scores")}
      defaultOpen
    >
      {/* Mobile View: Baseline Table */}
      <div className="md:hidden">
        {renderHeader(t("subquestion"), t("baselineScore"))}
        {rows.map((row) => (
          <div
            key={row.question.id}
            className="flex items-center border-b border-gray-300 bg-white p-4 dark:border-gray-300-dark dark:bg-gray-0-dark"
          >
            <div className="flex w-1/2 items-center gap-2 text-gray-800 dark:text-gray-800-dark">
              {row.question.label}
            </div>
            <div className="w-1/2 text-center">
              <GroupScoreCell
                userScore={row.userBaselineScore}
                communityScore={row.cpBaselineScore}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Mobile View: Peer Table */}
      <div className="mt-2.5 md:hidden">
        {renderHeader(t("subquestion"), t("peerScore"))}
        {rows.map((row) => (
          <div
            key={row.question.id}
            className="flex items-center border-b border-gray-300 bg-white p-4 dark:border-gray-300-dark dark:bg-gray-0-dark"
          >
            <div className="flex w-1/2 items-center gap-2 text-gray-800 dark:text-gray-800-dark">
              {row.question.label}
            </div>
            <div className="w-1/2 text-center">
              <GroupScoreCell
                userScore={row.userPeerScore}
                communityScore={row.cpPeerScore}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        {renderHeader(t("subquestion"))}
        {rows.map((row) => (
          <GroupResolutionScoreRow key={row.question.id} {...row} />
        ))}
      </div>
    </SectionToggle>
  );
};

export default GroupResolutionScores;
