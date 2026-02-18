import React, { forwardRef, HTMLAttributes } from "react";

import cn from "@/utils/core/cn";

const QuestionTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ children, className, ...props }, ref) => {
  return (
    <h1
      ref={ref}
      className={cn(
        "m-0 w-full pr-4 text-xl leading-tight text-blue-800 dark:text-blue-800-dark lg:pr-0 lg:text-3xl",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
});

QuestionTitle.displayName = "QuestionTitle";

export default QuestionTitle;
