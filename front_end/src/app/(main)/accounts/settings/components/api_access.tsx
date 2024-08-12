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
    <section>
      <h2 className="mx-[-4px] mb-5 mt-3 border-t border-gray-500 px-1 pt-4 text-2xl font-bold">
        {t("apiAccess")}
      </h2>

      <div className="text-sm">
        <p>
          {t("apiAcessText")}
          <Link href="/api"> {t("documentation")}</Link>
        </p>
        <span>{t("yourAPITokenIs")}</span>
        <pre>{token}</pre>
      </div>
    </section>
  );
};

export default ApiAccess;
