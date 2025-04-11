"use client";

import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Button from "@/components/ui/button";

import { VerificationSession } from "../actions";

interface StatusViewProps {
  verificationSession: VerificationSession | undefined;
}

export default function StatusView({ verificationSession }: StatusViewProps) {
  const status = verificationSession?.status;

  if (!verificationSession || status === "canceled") {
    return (
      <div className="bg-gray-0 p-5 dark:bg-gray-0-dark">
        <p>
          Your account is not verified. Please click below and follow the
          instructions in the new page
        </p>
      </div>
    );
  }

  switch (status) {
    case "processing":
      return (
        <div className="bg-gray-0 p-5 dark:bg-gray-0-dark">
          <p>Your verification progress is being processed</p>
        </div>
      );
    case "requires_input":
      return (
        <div className="bg-gray-0 p-5 dark:bg-gray-0-dark">
          <p>
            A verification process is started and requires your attention.
            Follow the instructions on the verification page.
          </p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => window.open(verificationSession.url, "_blank")}
          >
            Open verification page
          </Button>

          <p>
            You can start a new verification process if the link is no longer
            valid.
          </p>
        </div>
      );
    case "verified":
      return (
        <div
          className={
            "flex items-center justify-center gap-3 text-nowrap rounded bg-olive-400 p-5  dark:bg-olive-400-dark"
          }
        >
          <FontAwesomeIcon icon={faCheckCircle} />
          <span className={"font-bold text-olive-800 dark:text-olive-800-dark"}>
            Successfully verified
          </span>
        </div>
      );
    default:
      return (
        <div className="bg-gray-0 dark:bg-gray-0-dark">
          <p>Not verified</p>
        </div>
      );
  }
}
