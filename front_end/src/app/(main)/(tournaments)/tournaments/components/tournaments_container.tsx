import React, { PropsWithChildren } from "react";

const TournamentsContainer: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <main
      className="mx-auto mb-6 mt-[52px] max-w-[1150px] px-3 sm:px-8"
      id="tournamentsContainer"
    >
      {children}
    </main>
  );
};

export default TournamentsContainer;
