"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { Tournament, TournamentType } from "@/types/projects";

import PredictionFlowButton from "./prediction_flow_button";

type Props = {
  tournament: Tournament;
};

const NavigationBlock: FC<Props> = ({ tournament }) => {
  const t = useTranslations();

  return (
    <div className="mx-4 mt-4 flex flex-row justify-between gap-2 lg:mx-0">
      {tournament.type !== TournamentType.Index && (
        <PredictionFlowButton tournament={tournament} />
      )}

      <Button
        href={"#questions"}
        className="w-full flex-1 gap-1 border-blue-400 text-sm text-blue-700 dark:border-blue-400-dark dark:text-blue-700-dark md:text-lg"
      >
        {t.rich("viewQuestions", {
          count: tournament.questions_count,
          bold: (chunks) => <span className="font-bold">{chunks}</span>,
        })}
      </Button>
    </div>
  );
};

export default NavigationBlock;
