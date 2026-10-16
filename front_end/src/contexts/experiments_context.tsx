"use client";

import posthog from "posthog-js";
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import {
  ExperimentVariant,
  parseAssignment,
  SUBSCRIBE_CAPTURE_COOKIE_NAME,
  SUBSCRIBE_CAPTURE_FLAG_KEY,
} from "@/constants/experiments";
import { useAuth } from "@/contexts/auth_context";
import { safeDocumentCookie } from "@/utils/core/storage";

type ExperimentsContextValue = {
  subscribeCaptureVariant: ExperimentVariant | null;
};

// Server-resolved experiment assignment, provided from the (main) layout so
// SSR renders variant copy without a flicker. Null means not enrolled
// (logged in, bot, flag off, or evaluation failed): serve the status quo.
const ExperimentsContext = createContext<ExperimentsContextValue>({
  subscribeCaptureVariant: null,
});

export const ExperimentsProvider: FC<
  PropsWithChildren<ExperimentsContextValue>
> = ({ subscribeCaptureVariant, children }) => (
  <ExperimentsContext.Provider value={{ subscribeCaptureVariant }}>
    {children}
  </ExperimentsContext.Provider>
);

function readAssignmentCookieVariant(): ExperimentVariant | null {
  const raw = safeDocumentCookie.get(SUBSCRIBE_CAPTURE_COOKIE_NAME);
  if (!raw) return null;

  try {
    return parseAssignment(decodeURIComponent(raw))?.variant ?? null;
  } catch {
    return null;
  }
}

export const useSubscribeCaptureVariant = (): ExperimentVariant | null => {
  const { subscribeCaptureVariant } = useContext(ExperimentsContext);
  const { user } = useAuth();
  // Cookie fallback for consumers mounted outside the question-page provider
  // (the capture drawer lives in root-level GlobalModals and only mounts
  // client-side). Read synchronously so the first render is already correct;
  // an SSR'd consumer outside the provider would risk a hydration mismatch
  // here, so keep such components inside ExperimentsProvider.
  const [cookieVariant] = useState<ExperimentVariant | null>(
    readAssignmentCookieVariant
  );

  if (user) return null;
  return subscribeCaptureVariant ?? cookieVariant;
};

/**
 * Registers $feature_flag_called so PostHog counts this visitor as exposed.
 * Call when an experiment surface is actually shown (not on page load), so
 * the exposed population matches people who could be affected.
 */
export const registerSubscribeCaptureExposure = () => {
  posthog.getFeatureFlag(SUBSCRIBE_CAPTURE_FLAG_KEY);
};
