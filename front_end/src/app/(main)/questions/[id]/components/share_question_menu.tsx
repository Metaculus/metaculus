"use client";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

type Props = {};

const ShareQuestionMenu: FC<Props> = () => {
  const isLargeScreen = useBreakpoint("md");

  const { updateIsOpen } = useEmbedModalContext();
  const copyUrl = useCopyUrl();
  const shareOnTwitterLink = useShareOnTwitterLink();
  const shareOnFacebookLink = useShareOnFacebookLink();

  return (
    <DropdownMenu
      items={[
        ...(isLargeScreen
          ? []
          : [
              {
                id: "embed_menu",
                name: "Embed",
                onClick: () => updateIsOpen(true),
              },
            ]),
        {
          id: "share_fb",
          name: "Facebook",
          link: shareOnFacebookLink,
          openNewTab: true,
        },
        {
          id: "share_twitter",
          name: "X / Twitter",
          link: shareOnTwitterLink,
          openNewTab: true,
        },
        {
          id: "copy_link",
          name: "Copy link",
          onClick: copyUrl,
        },
      ]}
    >
      <Button
        variant="secondary"
        className="!rounded border-0"
        presentationType="icon"
      >
        <FontAwesomeIcon icon={faShareNodes} />
      </Button>
    </DropdownMenu>
  );
};

export default ShareQuestionMenu;
