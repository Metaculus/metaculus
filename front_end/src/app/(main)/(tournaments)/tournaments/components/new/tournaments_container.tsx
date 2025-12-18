import React, { PropsWithChildren } from "react";

const TournamentsContainer: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <main className="mx-auto mb-6 mt-[52px] max-w-[1100px] px-6 sm:px-8">
      {children}
    </main>
  );
};

export default TournamentsContainer;
