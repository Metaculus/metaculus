import { HTMLAttributes } from "react";

import cn from "@/utils/core/cn";

import { FE_COLORS } from "../theme";

type Props = HTMLAttributes<HTMLDivElement>;

const FutureEvalContainer: React.FC<Props> = ({ className, children }) => {
  return (
    <div className={cn(FE_COLORS.bgPrimary, "select-none pt-header")}>
      <div
        className={cn(
          "mx-auto box-content max-w-[1044px] px-4 pb-[58px] pt-8 sm:px-10 md:px-16 lg:pb-[143px]",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default FutureEvalContainer;
