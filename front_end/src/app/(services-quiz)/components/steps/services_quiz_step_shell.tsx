import { PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

type Props = PropsWithChildren<{
  title: string;
  className?: string;
}>;

const ServicesQuizStepShell: React.FC<Props> = ({
  children,
  title,
  className,
}) => {
  return (
    <div className="flex flex-1 flex-col sm:justify-center">
      <div className="mx-4 mt-4 md:mx-0 [@media(min-width:640px)_and_(min-height:900px)]:-mt-[170px]">
        <h2
          className={cn(
            "m-0 mb-4 text-[20px] font-bold leading-[25px] text-blue-700 dark:text-blue-700-dark sm:mb-9 sm:text-center sm:text-[28px] sm:leading-[34px]",
            className
          )}
        >
          {title}
        </h2>

        {children}
      </div>
    </div>
  );
};

export default ServicesQuizStepShell;
