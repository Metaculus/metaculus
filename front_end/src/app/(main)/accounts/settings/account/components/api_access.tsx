"use client";

import { faCopy, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";
import toast from "react-hot-toast";

import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";

import { getApiTokenAction } from "../../actions";

const ApiAccess: FC = () => {
  const t = useTranslations();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleVisibility = async () => {
    if (token) {
      setToken(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getApiTokenAction();
      if (response.token) {
        setToken(response.token);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    let tokenToCopy = token;

    if (!tokenToCopy) {
      const response = await getApiTokenAction();
      tokenToCopy = response.token ?? null;
    }

    if (tokenToCopy) {
      await navigator.clipboard.writeText(tokenToCopy);
      toast(t("copiedApiTokenMessage"));
    }
  };

  return (
    <section id="api-access">
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
            value={token ?? "•".repeat(40)}
            disabled={!token}
          />

          <div className="flex gap-2.5">
            <Button
              aria-label={t("showApiToken")}
              variant="tertiary"
              size="sm"
              presentationType="icon"
              onClick={handleToggleVisibility}
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={token ? faEyeSlash : faEye} />
            </Button>
            <Button
              aria-label={t("copyApiToken")}
              variant="tertiary"
              size="sm"
              presentationType="icon"
              onClick={handleCopy}
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
