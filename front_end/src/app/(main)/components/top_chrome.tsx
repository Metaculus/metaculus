import Bulletins from "./bulletins";
import ContentTranslatedBanner from "./content_translated_banner";
import { ImpersonationBanner } from "./impersonation_banner_server";
import { TopChromeClient } from "./top_chrome_client";
import { TopChromeHeaderSlot } from "./top_chrome_header_slot";

type Props = {
  hideBulletins?: boolean;
  hideHeader?: boolean;
  hideImpersonationBanner?: boolean;
  hideTranslationBanner?: boolean;
  defaultHeader?: React.ReactNode;
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
      {!hideBulletins && <Bulletins />}
      {!hideHeader && <TopChromeHeaderSlot defaultHeader={defaultHeader} />}
      {!hideImpersonationBanner && <ImpersonationBanner />}
      {!hideTranslationBanner && <ContentTranslatedBanner />}
    </TopChromeClient>
  );
};
