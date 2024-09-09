"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { FC, ReactNode, useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";

import {
  updateProfileFormAction,
  UpdateProfileState,
} from "@/app/(main)/accounts/profile/actions";
import {
  UpdateProfileSchema,
  updateProfileSchema,
} from "@/app/(main)/accounts/schemas";
import CalibrationChart from "@/app/(main)/questions/track-record/components/charts/calibration_chart";
import Button from "@/components/ui/button";
import { FormError, Input, Textarea } from "@/components/ui/form_field";
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
  const { register } = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
  });
  const [state, formAction] = useFormState<UpdateProfileState, FormData>(
    updateProfileFormAction,
    null
  );
  useEffect(() => {
    if (!state?.user) {
      return;
    }

    setUser(state.user);
    setEditMode(false);
  }, [setUser, state?.user]);

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
            </div>
          )}
          {(profile.bio || editMode) && (
            <div className="flex flex-col gap-1">
              <div className="text-sm uppercase text-blue-900/45 dark:text-blue-100/45">
                {t("bio")}
              </div>
              <div className="flex content-center justify-between">
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
                  <div className="flex items-center whitespace-pre-line text-base font-light">
                    {profile.bio}
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
                  {format(new Date(profile.date_joined), "MM-yyyy")}
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
            <div className="flex flex-col items-center gap-1">
              {profile.calibration_curve && (
                <CalibrationChart
                  calibrationData={profile.calibration_curve}
                  showIntervals={false}
                />
              )}
              <div className="flex flex-col items-center space-y-3 divide-y divide-gray-300 dark:divide-gray-700">
                <div className="flex flex-row gap-4 md:p-6">
                  <div className="flex flex-row items-center gap-3 text-sm text-gray-800 dark:text-gray-200">
                    <span className="block h-1 w-7 bg-gray-500"></span>perfect
                    calibration
                  </div>
                  <div className="flex flex-row items-center gap-3 text-sm text-gray-800 dark:text-gray-200">
                    <span className="block size-2 rotate-45 bg-[#ffa500]"></span>
                    user&apos;s calibration
                  </div>
                </div>
                <span className="pt-3 text-center text-sm text-gray-600 dark:text-gray-400">
                  If the diamonds are close to the grey lines, the predictions
                  are well-calibrated at that confidence level. If the diamonds
                  are closer to the 50% than the diamonds, the predictions were
                  underconfident, and vice-versa.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default UserInfo;
