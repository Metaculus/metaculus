"use client";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import Button from "@/components/ui/button";
import DropdownMenu from "@/components/ui/dropdown_menu";
import {
  useCopyUrl,
  useShareOnFacebookLink,
  useShareOnTwitterLink,
} from "@/hooks/share";
import { useBreakpoint } from "@/hooks/tailwind";

import useEmbedElectionsModalContext from "../contexts/embed_context";

type Props = {};

const ShareElectionsMenu: FC<Props> = () => {
  const isLargeScreen = useBreakpoint("md");

  const { updateIsOpen } = useEmbedElectionsModalContext();
  const copyUrl = useCopyUrl();
  const shareOnTwitterLink = useShareOnTwitterLink(
    "Metaculus 2024 US Presidential Election Forecast Map"
  );
  const shareOnFacebookLink = useShareOnFacebookLink();

  return (
    <DropdownMenu
      items={[
        {
          id: "copy_link",
          name: "Copy link",
          onClick: copyUrl,
        },
        {
          id: "share_fb",
          name: "Share on Facebook",
          link: shareOnFacebookLink,
          openNewTab: true,
        },
        {
          id: "share_twitter",
          name: "Share on Twitter ",
          link: shareOnTwitterLink,
          openNewTab: true,
        },
        ...(isLargeScreen
          ? []
          : [
              {
                id: "embed_menu",
                name: "Embed",
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
        Share
      </Button>
    </DropdownMenu>
  );
};

export default ShareElectionsMenu;
