"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { FC, useCallback, useEffect, useMemo, useState } from "react";

import ClientMiscApi from "@/services/api/misc/misc.client";
import { logError } from "@/utils/core/errors";
import { getBulletinParamsFromPathname } from "@/utils/navigation";

import Bulletin from "./bulletin";

const HIDE_PREFIXES = [
  "/about",
  "/services",
  "/help",
  "/faq",
  "/press",
  "/privacy-policy",
  "/terms-of-use",
  "/futureeval",
] as const;

const Bulletins: FC = () => {
  const [bulletins, setBulletins] = useState<
    {
      text: string;
      id: number;
    }[]
  >([]);

  const pathname = usePathname();

  const shouldHide = useMemo(() => {
    return (
      HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p)) ||
      pathname === "/"
    );
  }, [pathname]);

  const bulletinParams = useMemo(
    () => getBulletinParamsFromPathname(pathname),
    [pathname]
  );

  const fetchBulletins = useCallback(async () => {
    try {
      const bulletins = await ClientMiscApi.getBulletins(bulletinParams);
      setBulletins(bulletins ?? []);
    } catch (error) {
      logError(error);
    }
  }, [bulletinParams]);

  useEffect(() => {
    if (!shouldHide) {
      void fetchBulletins();
    } else {
      setBulletins([]);
    }
  }, [shouldHide, fetchBulletins]);

  return (
    <div className="mt-12 flex w-full flex-col items-center justify-center bg-transparent">
      {!shouldHide &&
        bulletins.map((bulletin) => (
          <Bulletin key={bulletin.id} text={bulletin.text} id={bulletin.id} />
        ))}
    </div>
  );
};

export default dynamic(() => Promise.resolve(Bulletins), {
  ssr: false,
});
