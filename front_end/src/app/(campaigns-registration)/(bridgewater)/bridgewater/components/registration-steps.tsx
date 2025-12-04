"use client";

import { FC } from "react";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";

import { CAMPAIGN_KEY } from "../constants";

interface RegistrationStepsProps {
  onRegisterClick?: () => void;
}

/**
 * Registration steps component showing the two-step process
 * Step 1: Create/Login to account
 * Step 2: Register for tournament (enabled after step 1)
 */
const RegistrationSteps: FC<RegistrationStepsProps> = ({ onRegisterClick }) => {
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const isStep1Complete = !!user;
  const isStep2Complete =
    user?.registered_campaigns.some((c) => c.key === CAMPAIGN_KEY) ?? false;

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {/* Step 1: Account Creation/Login */}
      <StepCard
        stepNumber={1}
        title="Log In or Create a Metaculus Account"
        isComplete={isStep1Complete}
        isActive={!isStep1Complete}
      >
        {!isStep1Complete && (
          <Button
            variant="secondary"
            size="md"
            onClick={() => setCurrentModal({ type: "signup" })}
          >
            Start
          </Button>
        )}
      </StepCard>

      {/* Step 2: Tournament Registration */}
      <StepCard
        stepNumber={2}
        title="Register for the tournament"
        isComplete={isStep2Complete}
        isActive={isStep1Complete && !isStep2Complete}
        isDisabled={!isStep1Complete}
      >
        {isStep1Complete && !isStep2Complete && onRegisterClick && (
          <Button variant="secondary" size="md" onClick={onRegisterClick}>
            Register
          </Button>
        )}
      </StepCard>
    </div>
  );
};

/**
 * Individual step card component
 */
const StepCard: FC<{
  stepNumber: number;
  title: string;
  isComplete: boolean;
  isActive: boolean;
  isDisabled?: boolean;
  children?: React.ReactNode;
}> = ({
  stepNumber,
  title,
  isComplete,
  isActive,
  isDisabled = false,
  children,
}) => {
  return (
    <div
      className={`flex w-full items-center  rounded-md border-2 p-4 transition-all ${
        isDisabled
          ? "border-gray-300 bg-white/50 dark:border-gray-700 dark:bg-gray-900/50"
          : isActive
            ? "bg-blue-800 text-white dark:bg-blue-800-dark"
            : isComplete
              ? "border-olive-400 bg-olive-300 dark:border-olive-400-dark/50 dark:bg-olive-300-dark/20"
              : "bg-white"
      }`}
    >
      <div className="flex items-start items-center gap-4">
        {/* Circle with step number or checkmark */}
        <div
          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            isDisabled
              ? "border-2 border-gray-300 text-gray-500 dark:border-gray-300-dark dark:text-gray-400"
              : isComplete
                ? "bg-olive-600 text-white dark:bg-olive-600"
                : "border-2 border-blue-600 bg-transparent text-white dark:border-blue-600-dark dark:text-blue-800"
          }`}
        >
          {isComplete ? "✓" : stepNumber}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-row items-center justify-between">
          <div
            className={`text-lg font-medium ${
              isDisabled
                ? "text-gray-500 dark:text-gray-400"
                : isComplete
                  ? "text-olive-900 line-through dark:text-olive-900-dark"
                  : "text-white dark:text-blue-900"
            }`}
          >
            {title}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default RegistrationSteps;
