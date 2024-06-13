import { FC, PropsWithChildren } from "react";

type Props = {
  title: string;
  label?: string;
};

const ConditionalCard: FC<PropsWithChildren<Props>> = ({
  title,
  label,
  children,
}) => {
  return (
    <div className="flex min-h-20 flex-col gap-2 border border-blue-500 p-3 dark:border-blue-500-dark">
      {!!label && (
        <span className="uppercase text-blue-700 dark:text-blue-700">
          {label}
        </span>
      )}
      <h4 className="m-0">{title}</h4>
      {children}
    </div>
  );
};

export default ConditionalCard;
