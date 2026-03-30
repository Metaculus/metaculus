import { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  text: string;
  className?: string;
  truncate?: boolean;
};

const KeyFactorText: FC<Props> = ({ text, className, truncate }) => {
  return (
    <div
      className={cn(
        "relative min-w-0 max-w-full flex-1 break-words text-left font-medium",
        truncate ? "line-clamp-5" : "inline",
        className
      )}
    >
      <div className={cn("relative xs:ml-0", !truncate && "inline")}>
        {text}
      </div>
    </div>
  );
};

export default KeyFactorText;
