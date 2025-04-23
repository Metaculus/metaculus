import React, {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  FC,
  HTMLAttributes,
  ReactNode,
} from "react";

import cn from "@/utils/core/cn";

type StepProps = {
  children?: ReactNode;
};

const Step: React.FC<StepProps> & {
  Button: typeof Button;
  Paragraph: typeof Paragraph;
  QuestionParagraph: typeof QuestionParagraph;
  Title: typeof Title;
  QuestionContainer: typeof QuestionContainer;
  QuestionTitle: typeof QuestionTitle;
} = ({ children }) => {
  return (
    <div className="flex max-w-3xl flex-col gap-3 p-0 md:p-5">{children}</div>
  );
};

export const Paragraph: FC<
  DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>
> = ({ className, ...props }) => (
  <p
    className={cn(
      "my-2 text-sm leading-normal opacity-80 md:text-base",
      className
    )}
    {...props}
  />
);

export const Title: FC<
  DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>
> = ({ className, ...props }) => (
  <p
    className={cn(
      "my-2 mt-8 text-xl font-semibold text-blue-800 dark:text-blue-200 md:mt-0 md:text-2xl",
      className
    )}
    {...props}
  />
);

export const QuestionContainer: FC<
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
> = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col gap-4 rounded border border-blue-400 bg-blue-200 px-4 py-4 dark:border-blue-700/50 dark:bg-blue-800 md:px-6",
      className
    )}
    {...props}
  />
);

export const QuestionTitle: FC<
  DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
> = ({ className, ...props }) => (
  <h3
    className={cn(
      "m-0 text-lg font-medium text-blue-800 dark:text-blue-200 md:text-xl",
      className
    )}
    {...props}
  />
);

export const QuestionParagraph: FC<
  DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>
> = ({ className, ...props }) => (
  <p className={cn("m-0 text-base md:text-lg", className)} {...props} />
);

const Button: FC<
  DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > & { variant?: "primary" | "active" | "small" }
> = ({ className, variant = "primary", ...props }) => (
  <button
    className={cn(
      "rounded",
      {
        "rounded bg-blue-400 px-6 py-4 font-semibold text-blue-800 hover:bg-blue-500 dark:bg-blue-700 dark:text-blue-200 dark:hover:bg-blue-600":
          ["primary", "active"].includes(variant),
        "bg-blue-700 text-white hover:bg-blue-800 dark:bg-white dark:text-blue-800":
          variant === "active",
        "bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700 dark:bg-blue-400 dark:text-blue-900 dark:hover:bg-blue-300":
          variant === "small",
      },
      className
    )}
    {...props}
  />
);

Step.Button = Button;
Step.Paragraph = Paragraph;
Step.Title = Title;
Step.QuestionContainer = QuestionContainer;
Step.QuestionTitle = QuestionTitle;
Step.QuestionParagraph = QuestionParagraph;

export default Step;
