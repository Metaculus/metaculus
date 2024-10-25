import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

const LoadingStep: React.FC = () => {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center md:min-h-fit">
      <div className="flex w-dvw items-center justify-center md:w-fit md:min-w-[400px]">
        <FontAwesomeIcon
          icon={faSpinner}
          spinPulse
          className="mr-2 text-4xl text-blue-500/50"
        />
      </div>
    </div>
  );
};

export default LoadingStep;
