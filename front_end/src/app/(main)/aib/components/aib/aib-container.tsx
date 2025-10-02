import { HTMLAttributes } from "react";

import cn from "@/utils/core/cn";

type Props = HTMLAttributes<HTMLDivElement>;

const AIBContainer: React.FC<Props> = ({ className, children }) => {
  return (
    <div
      className={cn(
        "mx-auto max-w-[1044px] px-4 pb-[143px] pt-[103px] sm:px-8",
        className
      )}
    >
      {children}
    </div>
  );
};

export default AIBContainer;
