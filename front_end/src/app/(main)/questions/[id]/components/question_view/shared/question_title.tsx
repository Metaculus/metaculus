import { HTMLAttributes } from "react";

import cn from "@/utils/core/cn";

const QuestionTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h1
      className={cn(
        "m-0 w-full pr-4 text-xl leading-tight text-blue-800 dark:text-blue-800-dark lg:pr-0 lg:text-3xl",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
};
export default QuestionTitle;
