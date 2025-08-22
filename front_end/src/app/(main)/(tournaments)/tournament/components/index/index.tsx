import "./styles.css";
import React, { FC } from "react";

import { ProjectIndexWeights, Tournament } from "@/types/projects";

import { computeIndexDeltaFromSeries } from "./helpers";
import IndexQuestionsTable from "./index_questions_table";
import IndexTimeline from "./index_timeline";

type Props = {
  indexWeights: ProjectIndexWeights[];
  tournament: Tournament;
};

const IndexSection: FC<Props> = ({ indexWeights, tournament }) => {
  const beLine = tournament.index_data?.series?.line ?? [];
  const { delta } = computeIndexDeltaFromSeries(beLine);

  return (
    <IndexQuestionsTable
      indexWeights={indexWeights}
      showWeeklyMovement={delta !== 0}
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
