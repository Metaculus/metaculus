import React from "react";

interface PageWrapper {
  children: React.ReactNode;
}

const PageWrapper: React.FC<PageWrapper> = ({ children }) => {
  return (
    <div className="prose container mx-auto my-0 max-w-4xl rounded bg-transparent p-3.5 pt-2 dark:bg-blue-900 dark:bg-transparent md:my-10 md:bg-white md:px-6 md:py-4 dark:md:bg-blue-900 [&_a:hover]:text-blue-800 [&_a:hover]:underline [&_a:hover]:dark:text-blue-200 [&_a]:text-blue-700 [&_a]:dark:text-blue-400 [&_h1]:mb-4 [&_hr]:border-gray-300 [&_hr]:dark:border-blue-700 [&_li]:text-sm [&_li]:md:text-base [&_p]:text-sm [&_p]:text-gray-700 [&_p]:dark:text-gray-400 [&_p]:md:text-base">
      {children}
    </div>
  );
};

export default PageWrapper;
