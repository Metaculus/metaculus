"use client";

import debounce from "lodash/debounce";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { FC, useState } from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import PreferencesSection from "@/app/(main)/accounts/settings/components/preferences_section";
import RichText from "@/components/rich_text";
import Checkbox from "@/components/ui/checkbox";
import { Input } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { useServerAction } from "@/hooks/use_server_action";
import { CurrentUser } from "@/types/users";
import cn from "@/utils/core/cn";

export type Props = {
  user: CurrentUser;
};

const PredictionPreferences: FC<Props> = ({ user }) => {
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
    <PreferencesSection title={t("predictions")} className="gap-2">
      <div className="mt-1 flex items-center">
        <Checkbox
          checked={!user.hide_community_prediction}
          onChange={(checked) => {
            void updateHideCP(!checked);
          }}
          className="p-1"
          inputClassName="text-gray-900 dark:text-gray-900-dark"
          readOnly={isPendingUpdateCP}
          label={t("showCommunityPredictionByDefault")}
        />
        {isPendingUpdateCP && <LoadingSpinner size="1x" />}
      </div>

      {isForecastExpirationEnabled && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center p-1">
            <Checkbox
              className="text-gray-900 dark:text-gray-900-dark"
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
              label={t("defaultWithdrawalSettingText")}
            />
            {isPendingUpdateExpirationPercent && <LoadingSpinner size="1x" />}
          </div>

          {isExpirationEnabled && (
            <div className="ml-[34px] flex flex-col gap-2 rounded border border-blue-400 bg-blue-200 px-4 py-3 text-xs text-blue-700 dark:border-blue-400-dark dark:bg-blue-200-dark dark:text-blue-700-dark">
              <div className="text-sm text-black dark:text-white">
                {t.rich("withdrawAfterPercentSetting", {
                  input: () => (
                    <div className="mx-1 inline-flex min-w-10 items-center justify-center rounded bg-gray-100 outline outline-1 outline-offset-[-1px] outline-blue-500 dark:bg-gray-0-dark dark:outline-blue-500-dark">
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
                          if (
                            !isNaN(numValue) &&
                            numValue >= 1 &&
                            numValue <= 99
                          ) {
                            setLocalExpirationPercent(value);
                            debouncedUpdateExpirationPercent(numValue);
                          }
                          // If invalid, don't update the state (input won't change)
                        }}
                        min="1"
                        max="99"
                        className="border-none bg-transparent px-1.5 py-1 pr-0 text-center text-base font-normal leading-tight text-gray-700 outline-none [-moz-appearance:textfield] dark:text-gray-700-dark [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                        style={{
                          width: `${Math.max(2, localExpirationPercent.length + 1)}ch`,
                        }}
                      />
                      <div className="pr-1 text-center text-base font-normal leading-tight text-gray-500 dark:text-gray-500-dark">
                        %
                      </div>
                    </div>
                  ),
                })}
              </div>
              <div>
                <RichText>
                  {(tags) =>
                    t.rich("withdrawAfterPercentSettingDescription", {
                      ...tags,
                      value: Math.round((10 * +localExpirationPercent) / 100),
                    })
                  }
                </RichText>
              </div>
              <div className="mb-1">
                {/* TODO: add proper link */}
                <Link href="/faq/">
                  {t("withdrawAfterPercentSettingDescriptionLink")}
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </PreferencesSection>
  );
};

export default PredictionPreferences;
