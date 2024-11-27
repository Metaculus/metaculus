import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import ResolutionCriteria, {
  type ResolutionCriteriaData,
} from "./resolution_criteria";

type Props = {
  resolutionCriteria: ResolutionCriteriaData[];
  className?: string;
};

const ForecastMakerContainer: FC<PropsWithChildren<Props>> = ({
  resolutionCriteria,
  className,
  children,
}) => {
  const t = useTranslations();
  return (
    <section
      id="prediction-section"
      className={classNames(
        "my-4 rounded bg-blue-200 p-3 dark:bg-blue-200-dark",
        className
      )}
    >
      <h3 className="m-0 text-base font-normal">{t("makePrediction")}</h3>
      <div className="mt-3">{children}</div>
      {resolutionCriteria.map((criteria, index) => (
        <ResolutionCriteria key={index} {...criteria} />
      ))}
    </section>
  );
};

export default ForecastMakerContainer;
