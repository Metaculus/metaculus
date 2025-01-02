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
import cn from "@/utils/cn";

type Props = {
  questionTitle: string;
  questionId?: number;
  btnClassName?: string;
};

export const SharePostMenu: FC<Props> = ({
  questionTitle,
  questionId,
  btnClassName,
}) => {
  const isLargeScreen = useBreakpoint("md");
  const t = useTranslations();
  const { updateIsOpen } = useEmbedModalContext();
  const copyUrl = useCopyUrl();
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
          name: t("facebook"),
          link: shareOnFacebookLink,
          openNewTab: true,
        },
        {
          id: "share_twitter",
          name: t("xTwitter"),
          link: shareOnTwitterLink,
          openNewTab: true,
        },
        ...(questionId
          ? [
              {
                id: "image",
                name: t("image"),
                link: `/api/posts/preview-image/${questionId}`,
                openNewTab: true,
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
        className={cn("rounded border-0", btnClassName)}
        presentationType="icon"
      >
        <FontAwesomeIcon icon={faShareNodes} className="text-lg" />
      </Button>
    </DropdownMenu>
  );
};
