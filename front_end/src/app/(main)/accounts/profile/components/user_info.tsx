"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { useTranslations } from "next-intl";
import { FC, ReactNode, useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";

import MedalIcon from "@/app/(main)/(leaderboards)/components/medal_icon";
import {
  updateProfileAction,
  UpdateProfileState,
} from "@/app/(main)/accounts/profile/actions";
import ChangeUsername from "@/app/(main)/accounts/profile/components/change_username";
import {
  UpdateProfileSchema,
  updateProfileSchema,
} from "@/app/(main)/accounts/schemas";
import CalibrationChart from "@/app/(main)/charts/calibration_chart";
import Button from "@/components/ui/button";
import { FormError, Textarea } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { MedalType } from "@/types/scoring";
import { UserProfile } from "@/types/users";

import SocialMediaSection from "./social_media_section";

export type UserInfoProps = {
  profile: UserProfile;
  isCurrentUser: boolean;
  MedalsComponent: ReactNode;
};

const UserInfo: FC<UserInfoProps> = ({
  profile,
  isCurrentUser,
  MedalsComponent,
}) => {
  const t = useTranslations();
  const { setUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const { register } = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
  });
  const [state, formAction] = useFormState<UpdateProfileState, FormData>(
    updateProfileAction,
    null
  );
  useEffect(() => {
    if (!state?.user) {
      return;
    }

    setUser(state.user);
    setEditMode(false);
  }, [state?.user]);

  return (
    <form action={formAction}>
      <hr className="m-0" />
      <div className="flex items-center justify-between">
        <h2 className="my-4 text-2xl font-bold">{t("profile")}</h2>
        {isCurrentUser && (
          <>
            {editMode && (
              <Button variant="primary" type="submit">
                {t("submit")}
              </Button>
            )}
            {!editMode && (
              <Button variant="link" onClick={() => setEditMode(true)}>
                {t("edit")}
              </Button>
            )}
          </>
        )}
      </div>
      <div>
        <div className="bg-gray-100 p-1 text-sm font-medium leading-4 text-gray-900 dark:bg-gray-100-dark dark:text-gray-900-dark">
          {t("username")}
        </div>
        <div className="flex content-center justify-between px-1 py-4">
          <div className="flex items-center text-sm">{profile.username}</div>
          {isCurrentUser && <ChangeUsername />}
        </div>
      </div>
      {profile.username && (
        <div>
          <div className="bg-gray-100 p-1 text-sm font-medium leading-4 text-gray-900 dark:bg-gray-100-dark dark:text-gray-900-dark">
            {t("formerlyKnownAs")}
          </div>
          <div className="flex content-center justify-between px-1 py-4">
            <div className="flex items-center text-sm">{profile.username}</div>
          </div>
        </div>
      )}
      <div>
        <div className="bg-gray-100 p-1 text-sm font-medium leading-4 text-gray-900 dark:bg-gray-100-dark dark:text-gray-900-dark">
          {t("Member Since")}
        </div>
        <div className="flex content-center justify-between px-1 py-4">
          <div className="flex items-center text-sm">
            <time dateTime={profile.date_joined}>
              {format(parseISO(profile.date_joined), "LLLL d, yyyy")}
            </time>
          </div>
        </div>
      </div>
      <div>
        <div className="bg-gray-100 p-1 text-sm font-medium leading-4 text-gray-900 dark:bg-gray-100-dark dark:text-gray-900-dark">
          {t("bio")}
        </div>
        <div className="flex content-center justify-between px-1 py-4">
          {editMode ? (
            <>
              <Textarea
                style={{ height: "150px" }}
                className="w-full rounded border border-gray-700 px-3 py-2 text-sm placeholder:italic dark:border-gray-700-dark"
                placeholder={t("profileBioPlaceholder")}
                defaultValue={profile.bio}
                {...register("bio")}
              />
              <FormError errors={state?.errors} name={"bio"} />
            </>
          ) : (
            <div className="flex items-center whitespace-pre-line text-sm">
              {profile.bio}
            </div>
          )}
        </div>
      </div>
      <div className="m-2 bg-blue-500 p-4">
        <SocialMediaSection
          user={profile}
          editMode={editMode}
          register={register}
          state={state}
        />
      </div>
      <FormError errors={state?.errors} name={"non_field_errors"} />
      {MedalsComponent}
      {profile.calibration_curve && (
        <CalibrationChart data={profile.calibration_curve} />
      )}
    </form>
  );
};

export default UserInfo;
