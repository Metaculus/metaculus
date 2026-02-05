"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function EmailChangeToast() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("emailChanged") === "true") {
      toast.success(t("emailChangeSuccessMessage"));
      router.replace("/accounts/settings/account", { scroll: false });
    }
  }, [searchParams, router, t]);

  return null;
}
