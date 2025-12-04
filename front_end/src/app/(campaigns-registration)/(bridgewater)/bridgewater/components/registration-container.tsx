"use client";

import { useRouter } from "next/navigation";
import { FC, useState } from "react";

import { RegistrationForm } from "@/app/(campaigns-registration)/(bridgewater)/bridgewater-2024/components/registration-forms";
import { CurrentUser } from "@/types/users";

import { CAMPAIGN_KEY } from "../constants";
import EligibilityStatus from "./eligibility-status";
import RegistrationSteps from "./registration-steps";

interface RegistrationContainerProps {
  currentUser: CurrentUser | null;
}

/**
 * Container that handles the registration flow:
 * 1. Show registration steps if not registered
 * 2. Show registration form in modal when user clicks "Register"
 * 3. Show eligibility status after successful registration
 */
const RegistrationContainer: FC<RegistrationContainerProps> = ({
  currentUser,
}) => {
  const router = useRouter();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const campaigns = currentUser?.registered_campaigns.filter(
    ({ key }) => key === CAMPAIGN_KEY
  );
  const registered = (campaigns && campaigns.length > 0) || isRegistered;

  const handleRegisterClick = () => {
    setShowRegistrationModal(true);
  };

  const handleRegistrationSuccess = () => {
    setIsRegistered(true);
    setShowRegistrationModal(false);
    // Refresh the page to update the user's registered campaigns
    router.refresh();
  };

  // Show eligibility status if registered
  if (registered) {
    const campaignDetails = campaigns?.[0]?.details as
      | { undergrad: boolean }
      | undefined;
    return (
      <EligibilityStatus eligibleBoth={campaignDetails?.undergrad ?? false} />
    );
  }

  // Show registration steps
  return (
    <>
      <RegistrationSteps onRegisterClick={handleRegisterClick} />

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white dark:bg-gray-0-dark">
            <div className="relative p-6">
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="absolute right-4 top-4 text-2xl text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                aria-label="Close"
              >
                ×
              </button>
              <div className="mb-6">
                <h2 className="mb-2 text-2xl font-bold text-blue-800 dark:text-blue-800-dark">
                  Complete your registration
                </h2>
                <p className="text-base text-gray-700 dark:text-gray-700-dark">
                  Fill out the form below to register for the tournament and
                  compete for prizes!
                </p>
              </div>
              <RegistrationForm
                onSuccess={handleRegistrationSuccess}
                campaignKey={CAMPAIGN_KEY}
                addToProject={undefined}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RegistrationContainer;
