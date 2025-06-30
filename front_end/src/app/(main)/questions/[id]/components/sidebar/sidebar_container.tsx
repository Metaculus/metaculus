import React, { FC, PropsWithChildren } from "react";

const SidebarContainer: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="self-stretch rounded bg-gray-0 px-3 py-4 @container dark:bg-gray-0-dark xs:px-5">
      {children}
    </div>
  );
};

export default SidebarContainer;
