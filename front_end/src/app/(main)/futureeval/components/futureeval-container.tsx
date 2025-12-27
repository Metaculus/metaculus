import { HTMLAttributes } from "react";

import cn from "@/utils/core/cn";

type Props = HTMLAttributes<HTMLDivElement>;

const FutureEvalContainer: React.FC<Props> = ({ className, children }) => {
  return (
    <div className="bg-gray-0 dark:bg-gray-950">
      <div
        className={cn(
          "mx-auto box-content max-w-[1044px] px-4 pb-[58px] pt-8 min-[376px]:pt-[52px] sm:px-10 md:px-16 md:pt-[72px] lg:pb-[143px] lg:pt-[103px]",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default FutureEvalContainer;
