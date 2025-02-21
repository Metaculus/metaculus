"use client";

import { faEye, faEyeSlash, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { FC, useState } from "react";
import toast from "react-hot-toast";

import Button from "@/components/ui/button";

export type Props = {
  token: string;
};

const ApiAccess: FC<Props> = ({ token }) => {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);

  return (
    <section className="text-sm">
      <hr />
      <h2 className="mb-5 mt-3 px-1"> {t("apiAccess")}</h2>
      <div className="text-sm">
        <p>
          {t("apiAcessText")} <Link href="/api">{t("documentation")}</Link>
        </p>
        <span>{t("yourAPITokenIs")}</span>
        <div className="mt-2 flex items-center gap-8">
          <div>
            <pre>{visible ? token : "*".repeat(40)}</pre>
          </div>
          <div className="flex gap-1">
            <Button
              aria-label={t("showApiToken")}
              variant="tertiary"
              size="sm"
              presentationType="icon"
              onClick={() => setVisible(!visible)}
            >
              <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} />
            </Button>
            <Button
              aria-label={t("copyApiToken")}
              variant="tertiary"
              size="sm"
              presentationType="icon"
              onClick={() =>
                navigator.clipboard
                  .writeText(token)
                  .then(() => toast(t("copiedApiTokenMessage")))
              }
            >
              <FontAwesomeIcon icon={faCopy} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ApiAccess;
