"use client";

import { faChevronRight, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useEffect, useRef } from "react";

import { clearPending } from "@/components/email_capture/pending_store";
import useEmailCapturePending from "@/components/email_capture/use_email_capture_pending";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { sendAnalyticsEvent } from "@/utils/analytics";

/**
 * Device-local reminder that a confirmation email is out. Appears after the
 * capture sheet is dismissed post-send, survives navigation and reloads, and
 * disappears the moment this device sees a signed-in user.
 */
const EmailConfirmBanner: FC = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const { currentModal, setCurrentModal } = useModal();
  const pending = useEmailCapturePending();
  const shownTrackedRef = useRef(false);

  const drawerOpen = currentModal?.type === "emailCapture";
  const visible = !!pending && !user && !drawerOpen;

  useEffect(() => {
    if (user && pending) {
      clearPending();
    }
  }, [user, pending]);

  useEffect(() => {
    if (visible && !shownTrackedRef.current) {
      shownTrackedRef.current = true;
      sendAnalyticsEvent("confirmBannerShown", {
        trigger: pending?.trigger,
        surface: pending?.surface,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible || !pending) return null;

  const openRecap = () => {
    sendAnalyticsEvent("confirmBannerClicked", {
      trigger: pending.trigger,
      surface: pending.surface,
    });
    setCurrentModal({
      type: "emailCapture",
      data: {
        trigger: pending.trigger,
        surface: "confirmBanner",
        gatedAction: pending.gatedAction,
        initialView: "sent",
      },
    });
  };

  return (
    <button
      onClick={openRecap}
      className="flex w-full cursor-pointer items-center gap-2.5 border-x-0 border-b border-t-0 border-solid border-tan-500 bg-gold-200 px-3.5 py-2 text-left dark:border-tan-500-dark dark:bg-gold-200-dark"
    >
      <FontAwesomeIcon
        icon={faEnvelope}
        className="flex-none text-orange-800 dark:text-orange-800-dark"
        size="sm"
      />
      <span className="flex-1 text-xs leading-snug text-gray-800 dark:text-gray-800-dark">
        {t.rich("emailConfirmBannerText", {
          email: () => <strong>{pending.email}</strong>,
        })}
      </span>
      <FontAwesomeIcon
        icon={faChevronRight}
        className="flex-none text-gray-500 dark:text-gray-500-dark"
        size="xs"
      />
    </button>
  );
};

export default EmailConfirmBanner;
