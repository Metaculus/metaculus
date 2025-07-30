"use client";

import { faEye, faEyeSlash, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { FC, useState } from "react";
import toast from "react-hot-toast";

import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";

export type Props = {
  token: string;
};

const ApiAccess: FC<Props> = ({ token }) => {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);

  // TODO: ensure all articles/pages which might have references to the API key page have updated urls

  return (
    <section>
      <hr className="my-6 border-gray-400 dark:border-gray-400-dark" />
      <div className="mb-4 text-gray-500 dark:text-gray-500-dark">
        {t("apiAccess")}
      </div>
      <div className="text-sm">
        <p className="my-4">
          {t("apiAcessText")} <Link href="/api">{t("documentation")}</Link>
        </p>
        <div className="mb-3">{t("yourAPITokenIs")}</div>
        <div className="flex items-center gap-2.5">
          <Input
            className="dark:disabled-text-gray-600-dark block w-full max-w-72 rounded border border-gray-700 bg-inherit p-2.5 disabled:border-gray-400 disabled:bg-gray-200 disabled:text-gray-600 dark:border-gray-700-dark disabled:dark:border-gray-400-dark disabled:dark:bg-gray-200-dark"
            value={token}
            disabled={!visible}
            type={visible ? "text" : "password"}
          />
          <div className="flex gap-2.5">
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
