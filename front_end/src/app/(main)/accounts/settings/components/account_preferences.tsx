"use client";

import { useTranslations } from "next-intl";
import React, { FC, useCallback, useState } from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import Checkbox from "@/components/ui/checkbox";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { useServerAction } from "@/hooks/use_server_action";
import { ProfilePreferencesType } from "@/types/preferences";
import { CurrentUser } from "@/types/users";

export type Props = {
  user: CurrentUser;
};

const AccountPreferences: FC<Props> = ({ user }) => {
  const t = useTranslations();
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const handlePreferencesChange = useCallback(
    async (preferenceType: ProfilePreferencesType, checked: boolean) => {
      // remove after BE updates
      if (user.unsubscribed_preferences_tags === undefined) {
        user.unsubscribed_preferences_tags = [];
      }

      const preferences = checked
        ? user.unsubscribed_preferences_tags?.filter(
            (remote_type) => remote_type != preferenceType
          )
        : Array.from(
            new Set([...user.unsubscribed_preferences_tags, preferenceType])
          );

      try {
        // Update helper (BE) to handle unsubscribed_preferences_tags field

        await updateProfileAction({
          unsubscribed_preferences_tags: preferences,
        });
      } finally {
        setLoadingIndex(null);
      }
    },
    [user]
  );
  const [updateProfile, isPending] = useServerAction(
    async (hide_community_prediction: boolean) => {
      await updateProfileAction({
        hide_community_prediction: hide_community_prediction,
      });
    }
  );

  return (
    <section className="text-sm">
      <h2 className="mb-5 mt-3 px-1">{t("settingsPreferences")}</h2>
      <h3 className="bg-blue-200 p-1 text-sm font-medium dark:bg-blue-200-dark">
        {t("communityPredictionLabel")}
      </h3>
      <div className="flex items-center">
        <Checkbox
          checked={!user.hide_community_prediction}
          onChange={(checked) => {
            void updateProfile(!checked);
          }}
          className="p-1.5"
          readOnly={isPending}
          label={t("showCommunityPredictionByDefault")}
        />
        {isPending && <LoadingSpinner size="1x" />}
      </div>
    </section>
  );
};

export default AccountPreferences;
