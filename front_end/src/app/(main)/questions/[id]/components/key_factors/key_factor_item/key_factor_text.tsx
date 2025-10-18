import { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  text: string;
  className?: string;
};

const KeyFactorText: FC<Props> = ({ text, className }) => {
  return (
    <div
      className={cn(
        "relative inline min-w-0 max-w-full flex-1 break-words text-left font-medium",
        className
      )}
    >
      <div className="relative inline xs:ml-0">{text}</div>
    </div>
  );
};

export default KeyFactorText;
