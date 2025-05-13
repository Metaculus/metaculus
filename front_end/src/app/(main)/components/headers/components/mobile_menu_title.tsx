import { FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

type Props = PropsWithChildren & {
  className?: string;
};

const MobileMenuTitle: FC<Props> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "flex h-full items-center justify-center px-4 pb-1 pt-2 text-sm font-medium uppercase text-gray-200 opacity-50",
        className
      )}
    >
      {children}
    </div>
  );
};

export default MobileMenuTitle;
