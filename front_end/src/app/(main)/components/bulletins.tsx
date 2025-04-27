"use client";
import { usePathname } from "next/navigation";
import { FC, useCallback, useEffect, useState } from "react";

import { logError } from "@/utils/core/errors";

import Bulletin from "./bulletin";
import { getBulletins } from "../actions";

const Bulletins: FC = () => {
  const [bulletins, setBulletins] = useState<
    {
      text: string;
      id: number;
    }[]
  >([]);

  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const fetchBulletins = useCallback(async () => {
    try {
      const res = await getBulletins();
      setBulletins(res);
    } catch (error) {
      logError(error);
    }
  }, []);

  useEffect(() => {
    void fetchBulletins();
  }, [fetchBulletins]);

  return (
    <div className="mt-12 flex w-full flex-col items-center justify-center bg-transparent">
      {!isHomePage &&
        bulletins.map((bulletin) => (
          <Bulletin
            key={bulletin.id}
            text={bulletin.text}
            id={bulletin.id}
          ></Bulletin>
        ))}
    </div>
  );
};

export default Bulletins;
