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
import cn from "@/utils/core/cn";

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

  const [isExpirationEnabled, setIsExpirationEnabled] = useState<boolean>(
    user.prediction_expiration_percent != null
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
          <div className="flex items-center p-1.5">
            <Checkbox
              checked={isExpirationEnabled}
              onChange={(checked) => {
                setIsExpirationEnabled(checked);
                if (checked) {
                  setLocalExpirationPercent(DEFAULT_EXPIRATION_PERCENT + "");
                  debouncedUpdateExpirationPercent(DEFAULT_EXPIRATION_PERCENT);
                } else {
                  setLocalExpirationPercent("");
                  debouncedUpdateExpirationPercent(null);
                }
              }}
              readOnly={isPendingUpdateExpirationPercent}
              label=""
            />
            <div className=" ">
              <span className="leading-none">
                {t("defaultExpirationSettingText")}
                <span className="ml-1 inline-block translate-y-0.5">
                  <LoadingSpinner
                    size="1x"
                    className={cn(
                      "invisible",
                      isPendingUpdateExpirationPercent && "visible"
                    )}
                  />
                </span>
              </span>
            </div>
          </div>

          {isExpirationEnabled && (
            <div className="ml-7 flex flex-col gap-2 bg-blue-200 px-4 py-3 dark:bg-blue-200-dark">
              <div>
                Expire after{" "}
                <div className="inline-flex min-w-10 items-center justify-center gap-0.5 rounded bg-gray-100 px-1.5 py-1 outline outline-1 outline-offset-[-1px] outline-blue-500 dark:bg-gray-0-dark dark:outline-blue-500-dark">
                  <Input
                    type="number"
                    value={localExpirationPercent}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Allow empty string for temporary state while typing
                      if (value === "") {
                        setLocalExpirationPercent("");
                        return;
                      }

                      const numValue = parseInt(value);

                      // Only allow values between 1 and 99
                      if (!isNaN(numValue) && numValue >= 1 && numValue <= 99) {
                        setLocalExpirationPercent(value);
                        debouncedUpdateExpirationPercent(numValue);
                      }
                      // If invalid, don't update the state (input won't change)
                    }}
                    min="1"
                    max="99"
                    className="border-none bg-transparent text-center text-base font-normal leading-tight text-gray-700 outline-none [-moz-appearance:textfield] dark:text-gray-700-dark [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                    style={{
                      width: `${Math.max(2, localExpirationPercent.length + 1)}ch`,
                    }}
                  />
                  <div className="text-center text-base font-normal leading-tight text-gray-500 dark:text-gray-500-dark">
                    %
                  </div>
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
