import React, { FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

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
      className={cn(
        "absolute inset-0 flex items-center justify-center text-center",
        className
      )}
    >
      <p
        className={cn(
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
