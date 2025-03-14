import { unstable_noStore as noStore } from "next/cache";
import { FC } from "react";

import { PublicSettings } from "@/utils/public_settings";

export const PUBLIC_SETTINGS_KEY = "PUBLIC_SETTINGS";

type Props = {
  publicSettings: PublicSettings;
};

const PublicSettingsScript: FC<Props> = ({ publicSettings }) => {
  noStore(); // opt into dynamic rendering

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
        window['${PUBLIC_SETTINGS_KEY}'] = ${JSON.stringify(publicSettings)};
        `,
      }}
    />
  );
};

export function getPublicSetting<T extends keyof PublicSettings>(
  key: T
): PublicSettings[T] | undefined {
  noStore();

  if (!isBrowser()) {
    return;
  }

  return window[PUBLIC_SETTINGS_KEY][key];
}

const isBrowser = () =>
  Boolean(typeof window !== "undefined" && window[PUBLIC_SETTINGS_KEY]);

export default PublicSettingsScript;
