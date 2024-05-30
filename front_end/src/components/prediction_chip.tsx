import classNames from "classnames";
import { FC, PropsWithChildren } from "react";

type PredictionChipSize = "compact" | "large";

type ChipProps = {
  className?: string;
  size?: PredictionChipSize;
};

const Chip: FC<PropsWithChildren<ChipProps>> = ({
  className,
  size,
  ...props
}) => (
  <span
    className={classNames(
      "inline-flex w-max items-center gap-2 whitespace-nowrap rounded-full px-2 py-0.5 font-semibold text-metac-gray-0 dark:text-metac-gray-0-dark",
      {
        "h-5 text-xs": size === "compact",
        "h-9 text-xl": size === "large",
        "h-7 text-base": !size,
      },
      className
    )}
    {...props}
  ></span>
);

type Props = {
  size?: PredictionChipSize;
  className?: string;
  chipClassName?: string;
};

const PredictionChip: FC<Props> = ({ className, chipClassName, size }) => {
  return (
    <span className={className}>
      <Chip size={size} className={chipClassName}>
        TODO: resolution chip
      </Chip>
    </span>
  );
};

export default PredictionChip;
