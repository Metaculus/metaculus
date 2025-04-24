import { FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

type MarkdownProps = {
  className?: string;
};

export const MarkdownText: FC<PropsWithChildren<MarkdownProps>> = ({
  className,
  children,
}) => {
  return (
    <span
      className={cn(
        "rounded-sm bg-blue-400 px-1 pb-0.5 pt-0 font-mono text-xs text-gray-1000 dark:bg-blue-400-dark dark:text-gray-1000-dark",
        className
      )}
    >
      {children}
    </span>
  );
};
