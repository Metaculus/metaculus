import React, { PropsWithChildren } from "react";

import { HideCPContext } from "@/contexts/cp_context";

const MockHideCPProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <HideCPContext.Provider
      value={{ hideCP: true, setCurrentHideCP: () => {} }}
    >
      {children}
    </HideCPContext.Provider>
  );
};

export default MockHideCPProvider;
