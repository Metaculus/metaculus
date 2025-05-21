import { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  className?: string;
};

const CircleDivider: FC<Props> = ({ className }) => {
  return (
    <span className={cn("text-gray-400 dark:text-gray-400-dark", className)}>
      •
    </span>
  );
};

export default CircleDivider;
