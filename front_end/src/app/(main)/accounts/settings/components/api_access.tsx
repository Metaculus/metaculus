"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

export type Props = {
  token: string;
};

const ApiAccess: FC<Props> = ({ token }) => {
  const t = useTranslations();

  return (
    <section className="text-sm">
      <hr />
      <h2 className="mb-5 mt-3 px-1"> {t("apiAccess")}</h2>
      <div className="text-sm">
        <p>
          {t("apiAcessText")} <Link href="/api">{t("documentation")}</Link>
        </p>
        <span>{t("yourAPITokenIs")}</span>
        <pre>{token}</pre>
      </div>
    </section>
  );
};

export default ApiAccess;
