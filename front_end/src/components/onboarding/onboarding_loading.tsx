import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

const OnboardingLoading: React.FC = () => {
  return (
    <div className="flex w-full items-center justify-center py-8">
      <div className="flex items-center justify-center">
        <FontAwesomeIcon
          icon={faSpinner}
          spinPulse
          className="mr-2 text-4xl text-blue-500/50"
        />
      </div>
    </div>
  );
};

export default OnboardingLoading;
