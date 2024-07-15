import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { MedalEntry } from "@/types/scoring";

import MedalCard from "./medal_card";
import { RANKING_CATEGORIES } from "../../ranking_categories";
import { getMedalCategories } from "../helpers/medal_categories";

type Props = {
  medalEntries: MedalEntry[];
};

const MedalCategories: FC<Props> = ({ medalEntries }) => {
  const t = useTranslations();

  const categories = getMedalCategories(medalEntries);

  return (
    <section className="mb-3 flex flex-col gap-12 pt-4 sm:mb-6">
      {categories.map((category) => (
        <div
          className={classNames(
            "flex flex-col items-center justify-center gap-9 px-3",
            { hidden: category.medals.length === 0 }
          )}
          key={category.name}
        >
          <div className="m-0 flex items-center justify-center gap-4 text-2xl font-bold text-blue-900 dark:text-blue-900-dark sm:text-3xl">
            <span>{t(RANKING_CATEGORIES[category.name].translationKey)}</span>
          </div>

          <div className="flex flex-wrap justify-center gap-3 self-stretch">
            {category.medals.map((categoryMedal, index) => (
              <MedalCard
                key={`medal-${category.name}-${categoryMedal.type}-${index}`}
                medal={categoryMedal}
                href={
                  category.name === "tournament"
                    ? `/tournament/${categoryMedal.projectId}`
                    : "#" // TODO: handle contributions route
                }
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};

export default MedalCategories;
