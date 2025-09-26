"use client";

import { useState } from "react";

import Button from "@/components/ui/button";
import { CurrentUser } from "@/types/users";
import cn from "@/utils/core/cn";

import { initiateStripeVerification, VerificationSession } from "../actions";

const VerifyView = ({
  currentUser,
  verificationSession,
}: {
  currentUser: CurrentUser;
  verificationSession?: VerificationSession;
}) => {
  const [registrationStatus, setRegistrationStatus] = useState<
    "in_progress" | "initial" | "error"
  >("initial");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const handleVerification = async (user: CurrentUser) => {
    setIsLoading(true);
    setRegistrationStatus("initial");
    const response = await initiateStripeVerification(user);
    if (response.url) {
      window.open(response.url, "_blank");
      setVerificationUrl(response.url);
      setRegistrationStatus("in_progress");
    } else if (response.error) {
      setRegistrationStatus("error");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {registrationStatus === "initial" && (
        <Button
          variant="link"
          onClick={() => handleVerification(currentUser)}
          disabled={isLoading}
          className={cn(verificationSession?.status === "verified" && "hidden")}
        >
          {["processing", "requires_input"].includes(
            verificationSession?.status || ""
          )
            ? "Start new verification"
            : "Start verification"}
        </Button>
      )}
      {registrationStatus === "in_progress" && (
        <div className="">
          Please follow the instructions in the new page. If the page did not
          open,{" "}
          <a href={verificationUrl || ""} target="_blank">
            click here.
          </a>
        </div>
      )}
      {registrationStatus === "error" && (
        <div className="text-red-500">
          Something went wrong, please try again later or contact us.
        </div>
      )}
    </div>
  );
};

export default VerifyView;
