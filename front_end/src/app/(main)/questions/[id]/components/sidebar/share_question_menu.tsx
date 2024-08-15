"use client";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import DropdownMenu from "@/components/ui/dropdown_menu";
import useEmbedModalContext from "@/contexts/embed_modal_context";
import {
  useMetaImageUrl,
  useCopyUrl,
  useShareOnFacebookLink,
  useShareOnTwitterLink,
} from "@/hooks/share";
import { useBreakpoint } from "@/hooks/tailwind";

type Props = {
  questionTitle: string;
};

const ShareQuestionMenu: FC<Props> = ({ questionTitle }) => {
  const isLargeScreen = useBreakpoint("md");
  const t = useTranslations();
  const { updateIsOpen } = useEmbedModalContext();
  const copyUrl = useCopyUrl();
  const copyImageUrl = useMetaImageUrl("twitter:image");
  const shareOnTwitterLink = useShareOnTwitterLink(
    `${questionTitle} #metaculus`
  );
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
        ...(copyImageUrl
          ? [
              {
                id: "image",
                name: t("image"),
                link: copyImageUrl,
              },
            ]
          : []),
        {
          id: "copy_link",
          name: t("copyLink"),
          onClick: copyUrl,
        },
      ]}
    >
      <Button
        variant="secondary"
        className="!rounded border-0"
        presentationType="icon"
      >
        <FontAwesomeIcon icon={faShareNodes} className="text-lg" />
      </Button>
    </DropdownMenu>
  );
};

export default ShareQuestionMenu;
