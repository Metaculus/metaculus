"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { FC, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import useSearchParams from "@/hooks/use_search_params";

import Button from "@/components/ui/button";
import GoogleTranslateAttribution from "./google_translate_attribution";
import { useContentTranslatedBannerProvider } from "@/app/providers";
import { SetOriginalLanguage as setOriginalLanguage } from "@/components/language_menu";

const ContentTranslatedBanner: FC<{ forceVisible?: boolean }> = ({
  forceVisible = false,
}) => {
  const t = useTranslations();
  const { setBannerisVisible, bannerIsVissible } =
    useContentTranslatedBannerProvider();
  const pathname = usePathname();
  const router = useRouter();
  const { params } = useSearchParams();

  useEffect(() => {
    setBannerisVisible(false);
  }, [pathname, params]);

  if (!bannerIsVissible && !forceVisible) {
    return null;
  }

  return (
    <>
      <div className="mt-10 sm:mt-8" />
      <div className="fixed top-12 z-40 flex w-screen justify-center gap-8 border-t border-t-blue-500/50 bg-gradient-to-b from-white/65 to-white shadow-md backdrop-blur-sm dark:border-t-blue-700/50 dark:from-blue-900/65 dark:to-blue-900">
        <div className="flex w-full justify-between p-1 sm:items-center sm:justify-center">
          <p className="m-1 text-xs text-gray-700 dark:text-gray-700-dark">
            {t("contentTranslatedHeaderText")}{" "}
            <Button
              className="inline whitespace-nowrap"
              variant="link"
              size="xs"
              onClick={() => setOriginalLanguage(params, router, pathname)}
            >
              {t("showOriginalContent")}
            </Button>
          </p>

          <div className="static right-2 sm:absolute">
            <div className="item-center flex flex-col justify-center gap-1 sm:flex-row">
              <span className="whitespace-nowrap text-[10px]   text-gray-700 dark:text-gray-700-dark">
                translated by
              </span>
              <GoogleTranslateAttribution />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContentTranslatedBanner;
