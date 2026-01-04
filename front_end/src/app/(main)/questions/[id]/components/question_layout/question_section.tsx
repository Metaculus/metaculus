import { PropsWithChildren } from "react";

const QuestionSection: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <section className="flex w-[48rem] max-w-full flex-col gap-5 overflow-x-hidden rounded border-transparent bg-gray-0 p-4 text-gray-900 dark:border-blue-200-dark dark:bg-gray-0-dark dark:text-gray-900-dark lg:gap-6 lg:border lg:p-8">
      {children}
    </section>
  );
};

export default QuestionSection;
