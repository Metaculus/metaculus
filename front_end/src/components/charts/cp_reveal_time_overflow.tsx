import classNames from "classnames";
import { intlFormatDistance } from "date-fns";
import { useTranslations } from "next-intl";
import React, { CSSProperties, FC, PropsWithChildren } from "react";

import CPRevealTime from "@/components/cp_reveal_time";
import LocalDaytime from "@/components/ui/local_daytime";

type Props = {
  className?: string;
  textClassName?: string;
};

const ChartOverflowContainer: FC<PropsWithChildren<Props>> = ({
  className,
  textClassName,
  children,
}) => {
  return (
    <div
      className={classNames(
        "absolute inset-0 flex items-center justify-center text-center",
        className
      )}
    >
      <p
        className={classNames(
          "max-w-[300px] pl-5 max-[425px]:max-w-[200px] md:max-w-max md:pl-0",
          textClassName
        )}
      >
        {children}
      </p>
    </div>
  );
};

export default ChartOverflowContainer;
