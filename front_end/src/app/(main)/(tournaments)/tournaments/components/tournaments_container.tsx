import React, { PropsWithChildren } from "react";

const TournamentsContainer: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <main className="mb-6 lg:mt-[52px]" id="tournamentsContainer">
      {children}
    </main>
  );
};

export default TournamentsContainer;
