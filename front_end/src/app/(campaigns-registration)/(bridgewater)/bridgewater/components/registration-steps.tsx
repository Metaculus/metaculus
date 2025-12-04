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
            variant="primary"
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
          <Button
            variant="primary"
            size="md"
            onClick={onRegisterClick}
            className="mt-3"
          >
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
      className={`w-full rounded-lg border-2 p-6 transition-all ${
        isDisabled
          ? "border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
          : isActive
            ? "border-blue-500 bg-white dark:border-blue-400 dark:bg-gray-0-dark"
            : isComplete
              ? "bg-olive-50 border-olive-500 dark:border-olive-400 dark:bg-olive-900/20"
              : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-0-dark"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Circle with step number or checkmark */}
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
            isDisabled
              ? "bg-gray-300 text-gray-500 dark:bg-gray-600 dark:text-gray-400"
              : isComplete
                ? "bg-olive-500 text-white dark:bg-olive-600"
                : "border-2 border-blue-500 bg-white text-blue-800 dark:border-blue-400 dark:bg-gray-800 dark:text-blue-400"
          }`}
        >
          {isComplete ? "✓" : stepNumber}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
            STEP {stepNumber}:
          </div>
          <div
            className={`text-lg font-medium ${
              isDisabled
                ? "text-gray-500 dark:text-gray-400"
                : "text-blue-800 dark:text-blue-200"
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
