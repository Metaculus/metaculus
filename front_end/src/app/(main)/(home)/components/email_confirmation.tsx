"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { sendAnalyticsEvent } from "@/utils/analytics";

const EmailConfirmation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("event") === "emailConfirmed") {
      sendAnalyticsEvent("emailConfirmed");
    }
  }, [router, searchParams]);

  return null;
};

export default EmailConfirmation;
