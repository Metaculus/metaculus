import React, { FC, PropsWithChildren } from "react";

const SidebarContainer: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="self-stretch rounded border border-blue-400 bg-gray-0 px-3 py-4 @container dark:border-blue-400-dark dark:bg-gray-0-dark xs:px-5">
      {children}
    </div>
  );
};

export default SidebarContainer;
