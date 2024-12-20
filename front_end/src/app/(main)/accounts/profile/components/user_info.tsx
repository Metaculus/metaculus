"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { FC, ReactNode, useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Controller, useForm } from "react-hook-form";

import { LogOut } from "@/app/(main)/accounts/actions";
import {
  updateProfileFormAction,
  UpdateProfileState,
} from "@/app/(main)/accounts/profile/actions";
import {
  UpdateProfileSchema,
  updateProfileSchema,
} from "@/app/(main)/accounts/schemas";
import CalibrationChart from "@/app/(main)/questions/track-record/components/charts/calibration_chart";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import {
  FormError,
  Input,
  MarkdownEditorField,
  Textarea,
} from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
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
  const { register, setValue, control } = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
  });
  const [state, formAction] = useFormState<UpdateProfileState, FormData>(
    updateProfileFormAction,
    null
  );
  useEffect(() => {
    if (!state?.user) {
      if (state?.errors?.error_code === "SPAM_DETECTED") {
        setEditMode(false);
        alert(
          "Your account has been deactivated for detected spam. Please note that we set our links so that Google doesn't pick them up for SEO. Adding spam to the site does nothing to help your rankings. Please contact support@metaculus.com if you believe the spam detection was a mistake."
        );
        LogOut();
      }
      return;
    }

    setUser(state.user);
    setEditMode(false);
  }, [setUser, state?.user, state?.errors]);

  const keyStatStyles =
    "flex w-1/3 flex-col min-h-[90px] justify-center gap-1.5 rounded bg-blue-200 p-3 text-center dark:bg-blue-950";

  return (
    <form action={formAction}>
      {
        <div
          className={`mb-4 flex flex-col gap-4 rounded bg-white p-4 dark:bg-blue-900 md:p-6`}
        >
          {isCurrentUser && (
            <div className="flex flex-col">
              {editMode && <SubmitButton />}
              {!editMode && (
                <Button variant="link" onClick={() => setEditMode(true)}>
                  {t("edit")}
                </Button>
              )}
            </div>
          )}
          {(profile.bio || editMode) && (
            <div className="flex flex-col gap-1">
              <div className="text-sm uppercase text-blue-900/45 dark:text-blue-100/45">
                {t("bio")}
              </div>
              <div className="flex w-full content-center justify-between">
                {editMode ? (
                  <MarkdownEditorField
                    control={control}
                    name="bio"
                    defaultValue={profile.bio}
                    errors={state?.errors}
                  />
                ) : (
                  <div className="flex items-center whitespace-pre-line text-base font-light">
                    <MarkdownEditor
                      mode="read"
                      markdown={profile.bio}
                      withUgcLinks
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          {
            <div className="flex flex-row justify-between">
              {(profile.location || editMode) && (
                <div className="flex w-full flex-col gap-1">
                  <div className="text-sm uppercase text-blue-900/45 dark:text-blue-100/45">
                    {t("location")}
                  </div>
                  {editMode ? (
                    <Input
                      type="text"
                      {...register("location")}
                      defaultValue={profile.location}
                    />
                  ) : (
                    <div className="text-base font-light">
                      {profile.location}
                    </div>
                  )}
                </div>
              )}

              {(profile.occupation || editMode) && (
                <div className="flex w-full flex-col gap-1">
                  <div className="text-sm uppercase text-blue-900/45 dark:text-blue-100/45">
                    {t("occupation")}
                  </div>
                  {editMode ? (
                    <Input
                      type="text"
                      {...register("occupation")}
                      defaultValue={profile.occupation}
                    />
                  ) : (
                    <div className="text-base font-light">
                      {profile.occupation}
                    </div>
                  )}
                </div>
              )}

              {(profile.website ||
                profile.twitter ||
                profile.linkedin ||
                profile.facebook ||
                profile.github ||
                profile.good_judgement_open ||
                profile.kalshi ||
                profile.manifold ||
                profile.infer ||
                profile.hypermind ||
                editMode) && (
                <div className="flex w-full flex-col gap-1">
                  <div className="text-sm uppercase text-blue-900/45 dark:text-blue-100/45">
                    {t("links")}
                  </div>
                  <SocialMediaSection
                    user={profile}
                    editMode={editMode}
                    register={register}
                    state={state}
                  />
                </div>
              )}
            </div>
          }
        </div>
      }
      <FormError errors={state?.errors} name={"non_field_errors"} />
      <div className={`flex flex-col flex-col-reverse gap-4 md:flex-row`}>
        <div className="w-full md:w-1/3">{MedalsComponent}</div>
        <div className="mt-0 flex w-full flex-col gap-4 md:w-2/3">
          <div className="flex flex-col rounded bg-white p-4 dark:bg-blue-900 md:p-6 ">
            <div className="flex w-full flex-row items-center justify-between">
              <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
                Key Stats
              </h3>
              <a
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                href={`?mode=track_record`}
              >
                View All
              </a>
            </div>
            <h3 className="mb-5 mt-0 pt-0 text-gray-700 dark:text-gray-300"></h3>
            <div className="flex flex-row gap-2 md:gap-4">
              <div className={keyStatStyles}>
                <span className="text-xl font-normal text-gray-800 dark:text-gray-200 md:text-2xl">
                  {profile.forecasts_count}
                </span>
                <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
                  {t("predictions")}
                </span>
              </div>
              <div className={keyStatStyles}>
                <span className="text-xl font-normal text-gray-800 dark:text-gray-200 md:text-2xl">
                  {profile.comments_count}
                </span>
                <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
                  {t("comments")}
                </span>
              </div>
              <div className={keyStatStyles}>
                <span className="text-xl font-normal text-gray-800 dark:text-gray-200 md:text-2xl">
                  {format(new Date(profile.date_joined), "yyyy-MM-dd")}
                </span>
                <span className="text-xs font-bold uppercase text-blue-900/45 dark:text-blue-100/45">
                  {t("memberSince")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col rounded bg-white p-4 dark:bg-blue-900 md:p-6">
            <div className="flex w-full flex-row items-center justify-between">
              <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
                Calibration Curve
              </h3>
              <a
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                href={`?mode=track_record`}
              >
                View All
              </a>
            </div>
            {profile.calibration_curve && (
              <CalibrationChart
                calibrationData={profile.calibration_curve}
                username={profile.username}
              />
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

const SubmitButton = () => {
  const { pending } = useFormStatus();
  const t = useTranslations();

  return (
    <Button variant="primary" type="submit" disabled={pending}>
      {pending ? t("pending") : t("submit")}
    </Button>
  );
};

export default UserInfo;
