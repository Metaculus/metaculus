import { FC } from "react";

import { ByStateExperimentBar } from "@/types/experiments";

type Props = {
  bar: ByStateExperimentBar;
};

const StateBarHoverPopup: FC<Props> = ({ bar }) => {
  const repProbability = Math.round(100 - bar.democratProbability * 100);
  const favouriteParty = repProbability > 50 ? "Republican" : "Democrat";
  const favouriteProbability =
    repProbability < 50 ? 100 - repProbability : repProbability;
  const displayProbText = bar.hasQuestion
    ? `${favouriteParty}: ${favouriteProbability}%`
    : `Safe ${favouriteParty}`;

  return (
    <>
      <span className="rounded-sm bg-[#2d2e2e] px-1 text-[#eff4f4]">
        {displayProbText}
      </span>

      <span className="rounded-sm bg-blue-100 px-0.5 font-bold dark:bg-blue-100-dark">
        {bar.id}
      </span>

      <span className="rounded-md bg-blue-100 px-0.5 dark:bg-blue-100-dark">
        {bar.value} Votes
      </span>
    </>
  );
};

export default StateBarHoverPopup;
