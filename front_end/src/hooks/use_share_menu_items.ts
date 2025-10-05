import { useTranslations } from "next-intl";

import { MenuItemProps } from "@/components/ui/dropdown_menu";
import useEmbedModalContext from "@/contexts/embed_modal_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import {
  useCopyUrl,
  useShareOnFacebookLink,
  useShareOnTwitterLink,
} from "@/hooks/share";
import { useBreakpoint } from "@/hooks/tailwind";
import useAppTheme from "@/hooks/use_app_theme";

type UseShareMenuItemsProps = {
  questionTitle: string;
  questionId?: number;
  includeEmbedOnSmallScreens?: boolean;
};

export const useShareMenuItems = ({
  questionTitle,
  questionId,
  includeEmbedOnSmallScreens = true,
}: UseShareMenuItemsProps): MenuItemProps[] => {
  const isLargeScreen = useBreakpoint("md");
  const t = useTranslations();
  const { PUBLIC_SCREENSHOT_SERVICE_ENABLED } = usePublicSettings();
  const { updateIsOpen } = useEmbedModalContext();
  const copyUrl = useCopyUrl();
  const shareOnTwitterLink = useShareOnTwitterLink(
    `${questionTitle} #metaculus`
  );
  const shareOnFacebookLink = useShareOnFacebookLink();
  const { theme } = useAppTheme();

  return [
    ...(includeEmbedOnSmallScreens && !isLargeScreen
      ? [
          {
            id: "embed_menu",
            name: "Embed",
            onClick: () => updateIsOpen(true),
          },
        ]
      : []),
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
    ...(questionId && PUBLIC_SCREENSHOT_SERVICE_ENABLED
      ? [
          {
            id: "image",
            name: t("image"),
            link: `/questions/${questionId}/image-preview/?theme=${theme}`,
            openNewTab: true,
          },
        ]
      : []),
    {
      id: "copy_link",
      name: t("copyLink"),
      onClick: copyUrl,
    },
  ];
};
