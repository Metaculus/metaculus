import { logError } from "@/utils/core/errors";

import Bulletins from "./bulletins";
import ContentTranslatedBanner from "./content_translated_banner";
import { ImpersonationBanner } from "./impersonation_banner_server";
import { TopChromeClient } from "./top_chrome_client";
import {
  TopChromeFallbackHeader,
  TopChromePartErrorBoundary,
} from "./top_chrome_error_boundary";
import { TopChromeHeaderSlot } from "./top_chrome_header_slot";

type Props = {
  hideBulletins?: boolean;
  hideHeader?: boolean;
  hideImpersonationBanner?: boolean;
  hideTranslationBanner?: boolean;
  defaultHeader?: React.ReactNode;
};

const SafeBulletins = async () => {
  try {
    return await Bulletins();
  } catch (error) {
    logError(error, {
      message: "Failed to render top chrome bulletins",
    });
    return null;
  }
};

const SafeImpersonationBanner = async () => {
  try {
    return await ImpersonationBanner();
  } catch (error) {
    logError(error, {
      message: "Failed to render top chrome impersonation banner",
    });
    return null;
  }
};

export const TopChrome = ({
  hideBulletins = false,
  hideHeader = false,
  hideImpersonationBanner = false,
  hideTranslationBanner = false,
  defaultHeader,
}: Props) => {
  return (
    <TopChromeClient>
      {!hideBulletins && (
        <TopChromePartErrorBoundary name="bulletins">
          <SafeBulletins />
        </TopChromePartErrorBoundary>
      )}
      {!hideHeader && (
        <TopChromePartErrorBoundary
          name="header"
          fallback={<TopChromeFallbackHeader />}
        >
          <TopChromeHeaderSlot defaultHeader={defaultHeader} />
        </TopChromePartErrorBoundary>
      )}
      {!hideImpersonationBanner && (
        <TopChromePartErrorBoundary name="impersonation banner">
          <SafeImpersonationBanner />
        </TopChromePartErrorBoundary>
      )}
      {!hideTranslationBanner && (
        <TopChromePartErrorBoundary name="translation banner">
          <ContentTranslatedBanner />
        </TopChromePartErrorBoundary>
      )}
    </TopChromeClient>
  );
};
