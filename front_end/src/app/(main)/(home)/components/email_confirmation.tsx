"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const EmailConfirmation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("event") === "emailConfirmed") {
      sendGAEvent("event", "emailConfirmed");
    }
    router.replace("/");
  }, [router, searchParams]);

  return null;
};

export default EmailConfirmation;
