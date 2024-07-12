import { FC } from "react";

import { ScoreMedal } from "@/types/scoring";

import BronzeMedal from "./icons/bronze_medal";
import GoldMedal from "./icons/gold_medal";
import SilverMedal from "./icons/silver_medal";

type Props = {
  type: ScoreMedal;
  className?: string;
};

const MedalIcon: FC<Props> = ({ type, className }) => {
  switch (type) {
    case "gold":
      return <GoldMedal className={className} />;
    case "silver":
      return <SilverMedal className={className} />;
    case "bronze":
      return <BronzeMedal className={className} />;
    default:
      return null;
  }
};

export default MedalIcon;
