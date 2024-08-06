"use client";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import DropdownMenu from "@/components/ui/dropdown_menu";
import useEmbedModalContext from "@/contexts/embed_modal_context";
import {
  useCopyUrl,
  useShareOnFacebookLink,
  useShareOnTwitterLink,
} from "@/hooks/share";
import { useBreakpoint } from "@/hooks/tailwind";

const ShareElectionsMenu: FC = () => {
  const t = useTranslations();
  const isLargeScreen = useBreakpoint("md");

  const { updateIsOpen } = useEmbedModalContext();

  return (
    <DropdownMenu
      items={[
        {
          id: "copy_link",
          name: t("copyLink"),
          onClick: useCopyUrl(),
        },
        {
          id: "share_fb",
          name: t("shareOnFacebook"),
          link: useShareOnFacebookLink(),
          openNewTab: true,
        },
        {
          id: "share_twitter",
          name: t("shareOnTwitter"),
          link: useShareOnTwitterLink(
            "Metaculus 2024 US Presidential Election Forecast Map"
          ),
          openNewTab: true,
        },
        ...(isLargeScreen
          ? []
          : [
              {
                id: "embed_menu",
                name: t("embed"),
                onClick: () => updateIsOpen(true),
              },
            ]),
      ]}
    >
      <Button
        className="border-metac-blue-500 dark:border-metac-blue-500-dark"
        variant="tertiary"
      >
        <FontAwesomeIcon icon={faShareNodes} />
        {t("share")}
      </Button>
    </DropdownMenu>
  );
};

export default ShareElectionsMenu;
