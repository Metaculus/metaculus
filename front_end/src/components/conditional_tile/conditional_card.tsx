import classNames from "classnames";
import { FC, PropsWithChildren } from "react";

type Props = {
  title: string;
  label?: string;
  resolved?: boolean;
};

const ConditionalCard: FC<PropsWithChildren<Props>> = ({
  title,
  label,
  resolved,
  children,
}) => {
  return (
    <div
      className={classNames(
        "ConditionalSummary-card flex min-h-20 flex-col gap-2 border p-3",
        resolved
          ? "border-purple-800 dark:border-purple-800"
          : "border-blue-500 dark:border-blue-500-dark"
      )}
    >
      {!!label && (
        <span className="ConditionalSummary-card-label text-xs font-semibold uppercase text-blue-700 dark:text-blue-700">
          {label}
        </span>
      )}
      <h4 className="ConditionalSummary-card-heading m-0">{title}</h4>
      {children}
    </div>
  );
};

export default ConditionalCard;
