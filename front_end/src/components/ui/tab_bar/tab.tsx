import { ButtonHTMLAttributes, FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean;
  className?: string;
};

const Tab: FC<PropsWithChildren<Props>> = ({
  active,
  className,
  children,
  ...props
}) => {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex w-20 flex-col items-center justify-center gap-1 border border-gray-300 py-2.5 text-center dark:border-gray-300-dark",
        active
          ? "bg-gray-0 text-blue-800 hover:bg-blue-100 active:bg-blue-200 dark:bg-gray-0-dark dark:text-blue-800-dark dark:hover:bg-blue-100-dark dark:active:bg-blue-200-dark"
          : "bg-blue-200 text-blue-600 hover:bg-blue-100 active:bg-blue-300 dark:bg-blue-200-dark dark:text-blue-600-dark dark:hover:bg-blue-100-dark dark:active:bg-blue-300-dark",
        className
      )}
    >
      {children}
    </button>
  );
};

export default Tab;
