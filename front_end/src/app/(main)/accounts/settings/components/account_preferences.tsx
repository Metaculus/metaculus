"use client";

import debounce from "lodash/debounce";
import { useTranslations } from "next-intl";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { FC, useState } from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import Checkbox from "@/components/ui/checkbox";
import { Input } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { useServerAction } from "@/hooks/use_server_action";
import { CurrentUser } from "@/types/users";

export type Props = {
  user: CurrentUser;
};

const AccountPreferences: FC<Props> = ({ user }) => {
  const t = useTranslations();
  const DEFAULT_EXPIRATION_PERCENT = 10;

  const isForecastExpirationEnabled = useFeatureFlagEnabled(
    "forecast_expiration"
  );

  const [localExpirationPercent, setLocalExpirationPercent] = useState<string>(
    (user.prediction_expiration_percent ?? "") + ""
  );

  const [updateHideCP, isPendingUpdateCP] = useServerAction(
    async (hide_community_prediction: boolean) => {
      await updateProfileAction({
        hide_community_prediction,
      });
    }
  );

  const [updateExpirationPercent, isPendingUpdateExpirationPercent] =
    useServerAction(async (prediction_expiration_percent: number | null) => {
      await updateProfileAction({
        prediction_expiration_percent,
      });
    });

  const debouncedUpdateExpirationPercent = debounce((value: number | null) => {
    void updateExpirationPercent(value);
  }, 1000);

  return (
    <section className="text-sm">
      <h2 className="mb-5 mt-3 px-1">{t("settingsPreferences")}</h2>
      <h3 className="bg-blue-200 p-1 text-sm font-medium dark:bg-blue-200-dark">
        {t("predictionsSettingsLabel")}
      </h3>
      <div className="flex items-center">
        <Checkbox
          checked={!user.hide_community_prediction}
          onChange={(checked) => {
            void updateHideCP(!checked);
          }}
          className="p-1.5"
          readOnly={isPendingUpdateCP}
          label={t("showCommunityPredictionByDefault")}
        />
        {isPendingUpdateCP && <LoadingSpinner size="1x" />}
      </div>

      {isForecastExpirationEnabled && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            <Checkbox
              checked={localExpirationPercent !== ""}
              onChange={(checked) => {
                if (checked) {
                  setLocalExpirationPercent(DEFAULT_EXPIRATION_PERCENT + "");
                  debouncedUpdateExpirationPercent(DEFAULT_EXPIRATION_PERCENT);
                } else {
                  setLocalExpirationPercent("");
                  debouncedUpdateExpirationPercent(null);
                }
              }}
              className="p-1.5"
              readOnly={isPendingUpdateExpirationPercent}
              label={t("defaultExpirationSettingText")}
            />
            {isPendingUpdateExpirationPercent && <LoadingSpinner size="1x" />}
          </div>

          {localExpirationPercent !== "" && (
            <div className="ml-7 flex flex-col gap-2 bg-blue-200 px-4 py-3 dark:bg-blue-200-dark">
              <div>
                Expire after{" "}
                <div className="min-w-10 px-1.5 py-1 bg-gray-100 rounded outline outline-1 outline-offset-[-1px] outline-blue-500 inline-flex justify-center items-center gap-0.5 dark:bg-gray-0-dark dark:outline-blue-500-dark">
                  <Input
                    type="number"
                    value={localExpirationPercent}
                    onChange={(e) => {
                      if (e.target.value !== "") {
                        const newValue = parseInt(e.target.value);
                        debouncedUpdateExpirationPercent(newValue);
                      }

                      setLocalExpirationPercent(e.target.value);
                    }}
                    className="border-none outline-none bg-transparent text-center text-gray-700 text-base font-normal leading-tight dark:text-gray-700-dark [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [-moz-appearance:textfield]"
                    style={{ width: `${Math.max(2, localExpirationPercent.length + 1)}ch` }}
                  />
                  <div className="text-center text-gray-500 text-base font-normal leading-tight dark:text-gray-500-dark">%</div>
                </div>
                of total question lifetime
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default AccountPreferences;
