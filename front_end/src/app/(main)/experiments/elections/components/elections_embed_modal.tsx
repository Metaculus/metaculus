"use client";
import { Field, Label, Select } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { ENFORCED_THEME_PARAM } from "@/constants/global_search_params";
import useAppTheme from "@/hooks/use_app_theme";
import useEmbedUrl from "@/hooks/use_embed_url";
import { AppTheme } from "@/types/theme";

type Props = {
  embedWidth: number;
  embedHeight: number;
};

const ElectionsEmbedModal: FC<Props> = ({ embedWidth, embedHeight }) => {
  const t = useTranslations();
  const { theme: appTheme } = useAppTheme();

  const embedUrl = useEmbedUrl("/embed/elections");
  const [isOpen, setIsOpen] = useState(false);
  const [embedTheme, setEmbedTheme] = useState<AppTheme>(appTheme);

  if (!embedUrl) {
    return null;
  }

  return (
    <>
      <Button
        variant="tertiary"
        size="sm"
        className="col-start-3 row-start-1 hidden w-auto self-center justify-self-end xs:flex"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Embed
      </Button>

      <BaseModal isOpen={isOpen} onClose={setIsOpen} variant={appTheme}>
        <div className="max-w-2xl">
          <h2 className="mb-4 mr-3 mt-0 text-blue-900 dark:text-blue-900-dark">
            Embed this page
          </h2>
          <p className="text-base leading-tight">
            You can use the below code snippet to embed this page on your own
            webpage. Feel free to change the height and width to suit your
            needs.
          </p>
          <div>
            <Field className="mr-4 mt-4 inline-block text-base leading-tight">
              <Label>{t("themeSelectLabel")}</Label>
              <Select
                value={embedTheme}
                onChange={(event) =>
                  setEmbedTheme(event.target.value as AppTheme)
                }
                name="chart-theme"
                className="select-arrow ml-2 h-8 rounded border border-gray-700 bg-inherit bg-[length:22px_20%] bg-no-repeat px-3 text-gray-900 dark:border-gray-700-dark dark:text-gray-900-dark"
              >
                <option value="light">{t("themeLightLabel")}</option>
                <option value="dark">{t("themeDarkLabel")}</option>
              </Select>
            </Field>
            <textarea
              autoFocus
              className="mt-4 h-36 w-full rounded border border-gray-700 bg-inherit px-3 py-2 font-mono text-gray-900 dark:border-gray-700-dark dark:text-gray-900-dark"
              onFocus={(event) => event.target.select()}
              readOnly
              value={`<iframe src="${addUrlParam(
                embedUrl,
                ENFORCED_THEME_PARAM,
                embedTheme
              )}" style="height:${embedHeight}px; width:100%; max-width:${embedWidth}px"></iframe>`}
            />
            <p className="my-2 text-base leading-tight">{t("Preview")}</p>
            <div className="mt-2 max-w-full overflow-x-auto">
              <iframe
                className="mx-auto"
                src={addUrlParam(embedUrl, ENFORCED_THEME_PARAM, embedTheme)}
                style={{
                  height: embedHeight,
                  width: "100%",
                  maxWidth: embedWidth,
                }}
              />
            </div>
          </div>
        </div>
      </BaseModal>
    </>
  );
};

const addUrlParam = (url: string, paramName: string, paramValue: string) => {
  const urlObject = new URL(url);
  urlObject.searchParams.set(paramName, paramValue);
  return urlObject.toString();
};

export default ElectionsEmbedModal;
