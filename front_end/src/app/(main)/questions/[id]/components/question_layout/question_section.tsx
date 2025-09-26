import { PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

const QuestionSection: React.FC<PropsWithChildren<{ compact?: boolean }>> = ({
  children,
  compact,
}) => {
  return (
    <section
      className={cn(
        "flex w-[48rem] max-w-full flex-col gap-5 overflow-x-hidden rounded border-transparent bg-gray-0 p-4 text-gray-900 after:block after:w-full after:content-[''] dark:border-blue-200-dark dark:bg-gray-0-dark dark:text-gray-900-dark lg:gap-6 lg:border lg:p-8",
        !compact && "after:mt-6"
      )}
    >
      {children}
    </section>
  );
};

export default QuestionSection;
