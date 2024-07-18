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
import { FormError, Input, Textarea } from "@/components/ui/form_field";
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
      <div className="block flex justify-between">
        <div></div>
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
      <div className="">
        <div className="text-xl font-extralight uppercase text-gray-300">
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
      <div className="m-2 flex flex-row justify-between p-4">
        <div className="ml-2 mr-2">
          <div className="font-gray-500 font-light uppercase">
            {t("location")}
          </div>
          <div>{profile.occupation}</div>
          {editMode && (
            <Input
              type="text"
              {...register("occupation")}
              defaultValue={profile.occupation}
            ></Input>
          )}
        </div>
        <div className="ml-2 mr-2">
          <div className="font-gray-500 font-light uppercase">
            {t("occupation")}
          </div>
          <div>{profile.location}</div>
          {editMode && (
            <Input
              type="text"
              {...register("location")}
              defaultValue={profile.location}
            ></Input>
          )}
        </div>
        <div className="ml-2 mr-2">
          <div className="font-gray-500 font-light uppercase">{t("links")}</div>
          <SocialMediaSection
            user={profile}
            editMode={editMode}
            register={register}
            state={state}
          />
        </div>
      </div>
      <FormError errors={state?.errors} name={"non_field_errors"} />
      <div className="flex flex-row">
        <div className="ml-2 mr-2 w-1/3">{MedalsComponent}</div>
        <div className="ml-2 mr-2 flex w-2/3 flex-col">
          <div className="flex flex-row gap-x-2">
            <div className="flex w-1/3 flex-col p-3 text-center dark:bg-blue-800">
              <p>{profile.nr_forecasts}</p>
              <p>{t("predictions")}</p>
            </div>
            <div className="flex w-1/3 flex-col p-3 text-center dark:bg-blue-800">
              <p>{profile.nr_comments}</p>
              <p>{t("comments")}</p>
            </div>
            <div className="flex w-1/3 flex-col p-3 text-center dark:bg-blue-800">
              <p>{format(new Date(profile.date_joined), "MM-yyyy")}</p>
              <p>{t("Member Since")}</p>
            </div>
          </div>
          <div>
            {profile.calibration_curve && (
              <CalibrationChart data={profile.calibration_curve} />
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

export default UserInfo;
