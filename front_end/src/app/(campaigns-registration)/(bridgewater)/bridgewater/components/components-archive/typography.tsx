import { FC, PropsWithChildren } from "react";

export const Heading1: FC<PropsWithChildren> = ({ children }) => {
  return (
    <h1 className="text-4xl font-normal text-gray-1000 dark:text-gray-1000-dark">
      {children}
    </h1>
  );
};

export const Heading2: FC<PropsWithChildren> = ({ children }) => {
  return (
    <h2 className="text-xl font-normal text-gray-1000 dark:text-gray-1000-dark">
      {children}
    </h2>
  );
};
