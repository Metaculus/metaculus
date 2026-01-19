import { FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

type Props = PropsWithChildren & {
  className?: string;
};

const MobileMenuTitle: FC<Props> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "flex h-fit items-start justify-start truncate px-4 pb-0 pt-2 text-xs font-normal uppercase text-gray-200 opacity-50",
        className
      )}
    >
      {children}
    </div>
  );
};

export default MobileMenuTitle;
