"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

export type Props = {
  token: string;
};

const ApiAccess: FC<Props> = ({ token }) => {
  const t = useTranslations();

  return (
    <div>
      <hr className="m-0" />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("apiAccess")}</h2>
      </div>
      <div className="text-sm">
        <p>
          {t("apiAcessText")}
          <Link href="/api"> {t("documentation")}</Link>
        </p>
        <span>{t("yourAPITokenIs")}</span>
        <pre>{token}</pre>
      </div>
    </div>
  );
};

export default ApiAccess;
