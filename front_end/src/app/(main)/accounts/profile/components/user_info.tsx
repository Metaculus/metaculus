"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { FC, useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";

import { LogOut } from "@/app/(main)/accounts/actions";
import {
  updateProfileFormAction,
  UpdateProfileState,
} from "@/app/(main)/accounts/profile/actions";
import ProfileMenu from "@/app/(main)/accounts/profile/components/profile_menu";
import {
  UpdateProfileSchema,
  updateProfileSchema,
} from "@/app/(main)/accounts/schemas";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import {
  FormError,
  Input,
  MarkdownEditorField,
} from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import useContainerSize from "@/hooks/use_container_size";
import { UserProfile } from "@/types/users";
import cn from "@/utils/core/cn";
import { formatUsername } from "@/utils/formatters/users";

import ChangeUsername from "./change_username";
import SocialMediaFragment, {
  getSocialMediaArray,
  hasUserSocialMediaLink,
} from "./social_media_section";

export type UserInfoProps = {
  profile: UserProfile;
  isCurrentUser: boolean;
};

interface ReadMoreProps {
  text: string;
}

const ExpandableLongText: FC<ReadMoreProps> = ({ text }) => {
  const [textState, setTextState] = useState<"expanded" | "collapsed" | "none">(
    "collapsed"
  );
  const [initialMeasured, setInitialMeasured] = useState(false);
  const t = useTranslations();

  const { ref: textRef, height: textHeight } =
    useContainerSize<HTMLDivElement>();

  const measureHeightFn = () => {
    if (textHeight > 0 && textRef.current && !initialMeasured) {
      setInitialMeasured(true);
      if (textRef.current.scrollHeight == textRef.current.clientHeight) {
        setTextState("none");
      }
    }
  };

  useEffect(() => {
    measureHeightFn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textHeight]);

  return (
    <div>
      <div
        ref={textRef}
        className={cn(
          "mb-0 line-clamp-2 overflow-hidden lg:max-w-80 xl:max-w-[476px]",
          textState == "expanded" && "line-clamp-none"
        )}
      >
        <MarkdownEditor mode="read" markdown={text} withUgcLinks />
      </div>
      {textState != "none" && initialMeasured && (
        <Button
          variant="link"
          onClick={() =>
            setTextState(textState == "expanded" ? "collapsed" : "expanded")
          }
        >
          {textState == "expanded" ? t("showLess") : t("showMore")}
        </Button>
      )}
    </div>
  );
};

const UserInfo: FC<UserInfoProps> = ({ profile, isCurrentUser }) => {
  const t = useTranslations();
  const { setUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const { register, control } = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
  });
  const [state, formAction] = useActionState<UpdateProfileState, FormData>(
    updateProfileFormAction,
    null
  );
  const { pending } = useFormStatus();

  const locale = useLocale();

  const socialMedia = getSocialMediaArray(profile);
  const inputClassNames =
    "rounded border border-gray-700 px-3 py-2 text-sm placeholder:italic dark:border-gray-700-dark";
  const inputLabelClassNames =
    "text-sm text-blue-900/45  dark:text-blue-100/45";

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

  let stats: {
    heading: string;
    val: React.ReactNode;
  }[] = [
    { heading: t("predictions"), val: profile.forecasts_count },
    { heading: t("comments"), val: profile.comments_count },
    {
      heading: t("memberSince"),
      val: profile.date_joined
        ? new Date(profile.date_joined).toLocaleDateString(locale, {
            month: "long",
            year: "numeric",
          })
        : undefined,
    },
    { heading: t("location"), val: profile.location },
    { heading: t("occupation"), val: profile.occupation },
  ];

  if (hasUserSocialMediaLink(profile)) {
    stats = stats.concat([
      {
        heading: t("links"),
        val: (
          <div className="flex gap-1">
            <SocialMediaFragment user={profile} />
          </div>
        ),
      },
    ]);
  }

  if (!editMode) {
    return (
      <>
        <div className="flex flex-col gap-6 rounded bg-white p-4 dark:bg-blue-900 xs:p-5 sm:p-6 md:p-8 lg:gap-4">
          {/* Username and stats */}
          <div className="flex flex-col gap-4 rounded lg:flex-row lg:gap-8">
            {/* Username and edit profiel side */}
            <div className="flex flex-col items-start gap-10">
              <div className="flex flex-col">
                <h1 className="mt-0 inline text-3xl md:text-4xl">
                  {formatUsername(profile)}
                </h1>
                {isCurrentUser && (
                  <span className="inline">
                    <ChangeUsername />
                  </span>
                )}

                {profile.bio != "" && <ExpandableLongText text={profile.bio} />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-3 sm:grid-cols-3 lg:ml-auto lg:self-baseline">
              {stats.map((stat) => (
                <div
                  className="flex flex-col items-start gap-1 lg:items-center"
                  key={stat.heading}
                >
                  <span className="text-xs  font-normal uppercase text-blue-900 opacity-45 dark:text-blue-900-dark">
                    {stat.val || stat.val === 0 ? stat.heading : ""}
                  </span>
                  <span className="text-base text-gray-800 dark:text-gray-800-dark">
                    {stat.val}
                  </span>
                </div>
              ))}
            </div>

            {/* Edit on SM screens */}
            {isCurrentUser && (
              <Button
                variant="secondary"
                onClick={() => setEditMode(true)}
                className="self-baseline md:hidden"
              >
                {t("editProfile")}
              </Button>
            )}
          </div>

          <div className="relative hidden flex-row justify-center text-xs font-medium md:flex md:text-sm">
            {/* Edit on desktop MD */}
            {isCurrentUser && (
              <Button
                variant="secondary"
                onClick={() => setEditMode(true)}
                className="absolute left-0 top-1/2 hidden -translate-y-1/2 md:inline-flex"
              >
                {t("editProfile")}
              </Button>
            )}

            <ProfileMenu profile={profile} />
          </div>
        </div>

        <div className="mx-auto max-w-full overflow-x-auto py-2 text-xs font-medium md:hidden">
          <ProfileMenu profile={profile} />
        </div>
      </>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded bg-blue-300 p-4 dark:bg-blue-300-dark md:p-6"
    >
      <div className="mb-6 flex flex-col gap-2  md:mb-8">
        <h1 className="mt-0 inline text-3xl md:text-4xl">
          {formatUsername(profile)}
        </h1>
        {isCurrentUser && (
          <span className="inline">
            <ChangeUsername />
          </span>
        )}
      </div>

      <div className={`mb-8 flex flex-col gap-4 xl:flex-row`}>
        {/* Bio, location and opcupation */}
        <div className="flex min-w-0 shrink-[2] flex-col gap-3">
          <div className="flex w-full flex-col gap-1.5">
            <div className={inputLabelClassNames}>{t("bio")}</div>
            <div className="flex h-48 w-full items-stretch bg-gray-0 dark:bg-gray-0-dark">
              <MarkdownEditorField
                control={control}
                name="bio"
                defaultValue={profile.bio}
                errors={state?.errors}
                className="w-full xl:w-[470px]"
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-1.5">
            <div className={inputLabelClassNames}>{t("location")}</div>
            <Input
              type="text"
              {...register("location")}
              defaultValue={profile.location}
              className={inputClassNames}
            />
          </div>

          <div className="flex w-full flex-col gap-1.5">
            <div className={inputLabelClassNames}>{t("occupation")}</div>
            <Input
              type="text"
              {...register("occupation")}
              defaultValue={profile.occupation}
              className={inputClassNames}
            />
          </div>
        </div>

        {/* Social media links */}
        <div className="grid basis-[492px] grid-cols-2 gap-3 ">
          {socialMedia.map(({ link, name, label }) => {
            return (
              <div className="flex flex-col gap-1.5" key={name}>
                <span className={inputLabelClassNames}>{label}</span>
                <Input
                  className={inputClassNames}
                  placeholder="http://www.example.com"
                  defaultValue={link ? link : ""}
                  {...register(name)}
                />
                <FormError errors={state?.errors} name={name} />
              </div>
            );
          })}
        </div>
      </div>

      <FormError errors={state?.errors} name={"non_field_errors"} />

      <div className="flex gap-4">
        <Button variant="secondary" onClick={() => setEditMode(false)}>
          {t("cancel")}
        </Button>
        <Button variant="primary" type="submit" disabled={pending}>
          {t("saveChange")}
        </Button>
      </div>
    </form>
  );
};

export default UserInfo;
