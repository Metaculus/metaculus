import "./styles.css";
import React, { FC } from "react";

import { ProjectIndexWeights, Tournament } from "@/types/projects";

import { calculateIndex } from "./helpers";
import IndexQuestionsTable from "./index_questions_table";
import IndexTimeline from "./index_timeline";

type Props = {
  indexWeights: ProjectIndexWeights[];
  tournament: Tournament;
};

const ONE_WEEK = 7 * 24 * 3600;

const IndexSection: FC<Props> = ({ indexWeights, tournament }) => {
  const beLine = tournament.index_data?.series?.line ?? [];
  let indexValue = 0;
  let indexWeekAgo = 0;

  if (beLine.length) {
    const latest = beLine[beLine.length - 1] ?? { x: 0, y: 0 };
    const weekAgoTs = latest.x - ONE_WEEK;
    const weekAgo =
      [...beLine].reverse().find((p) => p.x <= weekAgoTs) ?? beLine[0];
    indexValue = latest.y ?? 0;
    indexWeekAgo = weekAgo?.y ?? indexValue;
  } else {
    const r = calculateIndex(indexWeights);
    indexValue = r.index;
    indexWeekAgo = r.indexWeekAgo;
  }

  const indexWeeklyMovement = Number((indexValue - indexWeekAgo).toFixed(1));

  return (
    <IndexQuestionsTable
      indexWeights={indexWeights}
      showWeeklyMovement={indexWeeklyMovement !== 0}
      HeadingSection={
        <div
          key="index_timeline"
          className="flex flex-col items-center border-b border-gray-300 bg-gray-0 px-4 py-4 text-center leading-4 dark:border-gray-300-dark dark:bg-gray-0-dark"
        >
          <IndexTimeline tournament={tournament} />
        </div>
      }
    />
  );
};

export default IndexSection;
