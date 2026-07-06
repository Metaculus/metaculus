"use client";

import {
  faArrowsRotate,
  faCopy,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";
import toast from "react-hot-toast";

import ConfirmModal from "@/components/confirm_modal";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";

import { rotateApiKeyAction } from "../../actions";

type Props = {
  apiKey: string | null;
};

const ApiAccess: FC<Props> = ({ apiKey: initialApiKey }) => {
  const t = useTranslations();
  const [apiKey, setApiKey] = useState<string | null>(initialApiKey);
  const [isVisible, setIsVisible] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [showRotateModal, setShowRotateModal] = useState(false);

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const handleCopy = async () => {
    if (apiKey) {
      await navigator.clipboard.writeText(apiKey);
      toast(t("copiedApiTokenMessage"));
    }
  };

  const handleRotate = async () => {
    setIsRotating(true);
    try {
      const response = await rotateApiKeyAction();
      if (response.key) {
        setApiKey(response.key);
        setIsVisible(true);
        toast(t("apiKeyRotated"));
      }
    } finally {
      setIsRotating(false);
    }
  };

  const handleCreateKey = async () => {
    setIsRotating(true);
    try {
      const response = await rotateApiKeyAction();
      if (response.key) {
        setApiKey(response.key);
        setIsVisible(true);
        toast(t("apiKeyCreated"));
      }
    } finally {
      setIsRotating(false);
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

        {apiKey ? (
          <>
            <div className="mb-3">{t("yourAPITokenIs")}</div>
            <div className="flex items-center gap-2.5">
              <Input
                className="dark:disabled-text-gray-600-dark block w-full max-w-72 rounded border border-gray-700 bg-inherit p-2.5 disabled:border-gray-400 disabled:bg-gray-200 disabled:text-gray-600 dark:border-gray-700-dark disabled:dark:border-gray-400-dark disabled:dark:bg-gray-200-dark"
                value={apiKey}
                disabled={!isVisible}
                type={isVisible ? "text" : "password"}
              />

              <div className="flex gap-2.5">
                <Button
                  aria-label={t(isVisible ? "hideApiKey" : "revealApiKey")}
                  variant="tertiary"
                  size="sm"
                  presentationType="icon"
                  onClick={handleToggleVisibility}
                >
                  <FontAwesomeIcon icon={isVisible ? faEyeSlash : faEye} />
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
                <Button
                  aria-label={t("rotateApiKey")}
                  variant="tertiary"
                  size="sm"
                  presentationType="icon"
                  onClick={() => setShowRotateModal(true)}
                  disabled={isRotating}
                >
                  <FontAwesomeIcon icon={faArrowsRotate} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="m-0 text-gray-600 dark:text-gray-600-dark">
              {t("noApiKeyYet")}
            </p>
            <Button
              variant="secondary"
              onClick={handleCreateKey}
              disabled={isRotating}
              className="w-fit"
            >
              {t("createApiKey")}
            </Button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showRotateModal}
        onCloseModal={() => setShowRotateModal(false)}
        title={t("rotateApiKeyTitle")}
        description={t("rotateApiKeyDescription")}
        onConfirm={handleRotate}
        actionText={t("rotate")}
      />
    </section>
  );
};

export default ApiAccess;
