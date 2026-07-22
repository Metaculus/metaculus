"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function EmailLinkEventToast() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("event") !== "emailLinkConfirmed") return;

    toast.success(t("emailLinkSignedIn"));

    const params = new URLSearchParams(searchParams.toString());
    params.delete("event");
    router.replace(params.size ? `${pathname}?${params}` : pathname, {
      scroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
