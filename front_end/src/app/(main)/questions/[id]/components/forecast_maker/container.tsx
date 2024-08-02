import classNames from "classnames";
import { FC, PropsWithChildren } from "react";

import ResolutionCriteria, {
  type ResolutionCriteriaData,
} from "./resolution_criteria";

type Props = {
  title: string;
  resolutionCriteria: ResolutionCriteriaData[];
  className?: string;
};

const ForecastMakerContainer: FC<PropsWithChildren<Props>> = ({
  title,
  resolutionCriteria,
  className,
  children,
}) => {
  return (
    <section
      id="prediction-section"
      className={classNames(
        "my-4 bg-blue-200 p-3 dark:bg-blue-200-dark",
        className
      )}
    >
      <h3 className="m-0 text-base font-normal leading-5">{title}</h3>
      <div className="mt-3">{children}</div>
      {resolutionCriteria.map((criteria, index) => (
        <ResolutionCriteria key={index} {...criteria} />
      ))}
    </section>
  );
};

export default ForecastMakerContainer;
