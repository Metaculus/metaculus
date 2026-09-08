"use client";

import { faXTwitter, faFacebookF } from "@fortawesome/free-brands-svg-icons";
import { faCode, faLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";
import toast from "react-hot-toast";

import BottomDrawer from "@/components/ui/bottom_drawer";
import BottomDrawerActionButton from "@/components/ui/bottom_drawer_action_button";
import useEmbedModalContext from "@/contexts/embed_modal_context";
import {
  useCopyUrl,
  useShareOnFacebookLink,
  useShareOnTwitterLink,
} from "@/hooks/share";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionTitle: string;
};

/**
 * Mobile counterpart of SharePostMenu: same actions as the dropdown, as a
 * bottom sheet with big tap targets. Gate at the call site with
 * useBreakpoint("sm"); reference example for the mobile-drawer pattern.
 */
const SharePostDrawer: FC<Props> = ({ open, onOpenChange, questionTitle }) => {
  const t = useTranslations();
  const copyUrl = useCopyUrl({
    successMessage: t("copiedUrlMessage"),
    errorMessage: t("copyUrlErrorMessage"),
  });
  const shareOnTwitterLink = useShareOnTwitterLink(
    `${questionTitle} #metaculus`
  );
  const shareOnFacebookLink = useShareOnFacebookLink();
  const { updateIsOpen: openEmbedModal } = useEmbedModalContext();

  const shareToTarget = (link: string, targetName: string) => {
    window.open(link, "_blank", "noopener");
    toast(t("shareOpenedInNewTab", { target: targetName }));
  };

  return (
    <BottomDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t("share")}
      titleClassName="capitalize"
    >
      <div className="grid grid-cols-2 gap-2 pt-3.5">
        <BottomDrawerActionButton
          icon={<FontAwesomeIcon icon={faLink} />}
          label={t("copyLink")}
          onClick={copyUrl}
        />
        <BottomDrawerActionButton
          icon={<FontAwesomeIcon icon={faXTwitter} />}
          label={t("xTwitter")}
          onClick={() => shareToTarget(shareOnTwitterLink, t("xTwitter"))}
        />
        <BottomDrawerActionButton
          icon={<FontAwesomeIcon icon={faFacebookF} />}
          label={t("facebook")}
          onClick={() => shareToTarget(shareOnFacebookLink, t("facebook"))}
        />
        <BottomDrawerActionButton
          icon={<FontAwesomeIcon icon={faCode} />}
          label={t("embed")}
          className="capitalize"
          onClick={() => {
            // The embed modal stacks below the drawer, so hand off to it
            // (one active surface at a time)
            onOpenChange(false);
            openEmbedModal(true);
          }}
        />
      </div>
    </BottomDrawer>
  );
};

export default SharePostDrawer;
