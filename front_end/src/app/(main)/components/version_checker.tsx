"use client";
import { isNil } from "lodash";
import { useRouter } from "next/navigation";
import { FC, useCallback, useEffect, useRef, useState } from "react";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { logError } from "@/utils/core/errors";

const POLLING_INTERVAL = 1000 * 30; //  30 seconds

const VersionChecker: FC = () => {
  const router = useRouter();

  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
  const didRefreshPrompting = useRef(false);
  const closeRefreshPrompt = () => {
    setShowRefreshPrompt(false);
  };

  const checkVersion = useCallback(async () => {
    if (didRefreshPrompting.current) {
      // if we already prompted the user, don't check again
      return;
    }

    const clientVersion = process.env.BUILD_ID;
    if (isNil(clientVersion)) {
      console.warn("Can't check app version. Client version is missing.");
      return;
    }

    const serverVersion = await fetchServerVersion();
    if (isNil(serverVersion)) {
      console.warn("Can't check app version. Server version is missing.");
      return;
    }

    if (clientVersion !== serverVersion) {
      setShowRefreshPrompt(true);
      didRefreshPrompting.current = true;
    }
  }, []);

  useEffect(() => {
    void checkVersion();

    const interval = setInterval(() => {
      void checkVersion();
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [checkVersion]);

  return (
    <BaseModal
      isOpen={showRefreshPrompt}
      onClose={closeRefreshPrompt}
      className="mx-3 flex max-w-sm flex-col gap-2"
    >
      A new version of Metaculus is available. To avoid errors, please refresh
      this page. Draft comments and posts are saved and will persist after the
      refresh.
      <div className="flex justify-end">
        <Button onClick={router.refresh}>Refresh</Button>
      </div>
    </BaseModal>
  );
};

// Track consecutive 502 errors to avoid spamming to Sentry
// We expect 502 during deployments
let consecutive502Errors = 0;

const fetchServerVersion = async () => {
  try {
    const response = await fetch("/app-version");

    if (response.status === 502) {
      consecutive502Errors++;
      if (consecutive502Errors >= 5) {
        logError(new Error("Received 502 from /app-version 5 times in a row"), {
          message: "Error fetching app version",
        });
      }
      return null;
    }

    consecutive502Errors = 0;
    const data = await response.json();
    return data?.buildId ?? null;
  } catch (error) {
    logError(error, { message: "Error fetching app version" });
    return null;
  }
};

export default VersionChecker;
