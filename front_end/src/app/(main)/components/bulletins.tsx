"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { FC, useCallback, useEffect, useMemo, useState } from "react";

import ClientMiscApi from "@/services/api/misc/misc.client";
import { logError } from "@/utils/core/errors";
import { getBulletinParamsFromPathname } from "@/utils/navigation";

import Bulletin from "./bulletin";

const Bulletins: FC = () => {
  const [bulletins, setBulletins] = useState<
    {
      text: string;
      id: number;
    }[]
  >([]);

  const pathname = usePathname();

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
    void fetchBulletins();
  }, [fetchBulletins]);

  if (bulletins.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col">
      {bulletins.map((bulletin) => (
        <Bulletin
          key={bulletin.id}
          text={bulletin.text}
          id={bulletin.id}
          onHidden={() =>
            setBulletins((currentBulletins) =>
              currentBulletins.filter(({ id }) => id !== bulletin.id)
            )
          }
        />
      ))}
    </div>
  );
};

export default dynamic(() => Promise.resolve(Bulletins), {
  ssr: false,
});
