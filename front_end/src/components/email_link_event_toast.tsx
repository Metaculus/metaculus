"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import toast from "react-hot-toast";

import { GatedActionTrigger } from "@/types/gated_actions";
import cn from "@/utils/core/cn";

const APPLIED_MESSAGE_KEYS = {
  post_subscribe: "emailLinkSignedInSubscribe",
  post_vote: "emailLinkSignedInVote",
  forecast: "emailLinkSignedInForecast",
} as const satisfies Record<GatedActionTrigger, string>;

type SignedInMessageKey =
  | (typeof APPLIED_MESSAGE_KEYS)[GatedActionTrigger]
  | "emailLinkSignedIn";

function messageKey(applied: string | null): SignedInMessageKey {
  // No `applied` param means we could not tell what the link carried (it was
  // opened on another device, or no action was attached): stay generic.
  return (
    APPLIED_MESSAGE_KEYS[applied as GatedActionTrigger] ?? "emailLinkSignedIn"
  );
}

export default function EmailLinkEventToast() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("event") !== "emailLinkConfirmed") return;

    const applied = searchParams.get("applied");
    const message = t(messageKey(applied));
    // Only the action-specific wording has to be read to be understood, so
    // that sticks until dismissed. A bare "you're signed in" is self-evident
    // from the page around it and can see itself out.
    const isGenericConfirmation = messageKey(applied) === "emailLinkSignedIn";

    // Persists until dismissed: this is the only confirmation that the
    // deferred action was applied, so it must not scroll past unread.
    toast.custom(
      (item) => (
        <div
          className={cn(
            "flex max-w-md items-start gap-3 rounded-md bg-gray-0 px-4 py-3 text-sm leading-snug text-gray-900 shadow-lg transition-opacity duration-200 dark:bg-blue-700-dark dark:text-gray-0-dark",
            item.visible ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="flex-1">{message}</span>
          <button
            onClick={() => toast.dismiss(item.id)}
            aria-label={t("close")}
            className="-mr-1 flex size-5 flex-none items-center justify-center rounded border-none bg-transparent text-gray-600 dark:text-gray-0-dark"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      ),
      { duration: isGenericConfirmation ? 3500 : Infinity }
    );

    const params = new URLSearchParams(searchParams.toString());
    params.delete("event");
    params.delete("applied");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
