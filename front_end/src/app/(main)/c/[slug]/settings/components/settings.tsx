"use client";

import { Field, Label } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useState } from "react";
import { useForm } from "react-hook-form";

import Button from "@/components/ui/button";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import {
  FormErrorMessage,
  Input,
  MarkdownEditorField,
} from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import { CommunityUpdateParams } from "@/services/api/projects/projects.shared";
import { ProjectPermissions } from "@/types/post";
import {
  Community,
  CommunitySettingsMode,
  ProjectVisibility,
} from "@/types/projects";
import { logError } from "@/utils/core/errors";

import { updateCommunity } from "../actions";
import { CommunitySettingsSchema, communitySettingsSchema } from "../schemas";

export type Props = {
  community: Community;
};
type VisibilityType = "public" | "unlisted" | "draft";

const propsToVisibilityType = (
  community: CommunityUpdateParams
): VisibilityType => {
  if (community.default_permission) {
    if (community.visibility == ProjectVisibility.Unlisted) return "unlisted";

    return "public";
  }

  return "draft";
};

const visibilityTypeToProps = (
  community: Community,
  type: VisibilityType
): Partial<CommunityUpdateParams> => {
  if (type === "public")
    return {
      default_permission: ProjectPermissions.FORECASTER,
      visibility:
        community.visibility === ProjectVisibility.Normal
          ? // Keep original visibility if was configured as "normal"
            ProjectVisibility.Normal
          : // Otherwise, set "not in main feed"
            ProjectVisibility.NotInMainFeed,
    };
  if (type === "unlisted")
    return {
      default_permission: ProjectPermissions.FORECASTER,
      visibility: ProjectVisibility.Unlisted,
    };

  return {
    default_permission: null,
    visibility: ProjectVisibility.Unlisted,
  };
};

const CommunitySettings: FC<Props> = ({ community }) => {
  const t = useTranslations();
  const router = useRouter();
  const { handleSubmit, formState, register, watch, setValue, reset, control } =
    useForm<CommunitySettingsSchema>({
      defaultValues: {
        name: community.name,
        description: community.description,
        slug: community.slug,
        default_permission: community.default_permission,
        visibility: community.visibility,
      },
      resolver: zodResolver(communitySettingsSchema),
    });
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();
  const [isLoading, setIsLoading] = useState(false);

  const visibilityOptions: GroupButton<VisibilityType>[] = [
    { label: t("public"), value: "public" },
    { label: t("unlisted"), value: "unlisted" },
    { label: t("draft"), value: "draft" },
  ];

  const onSubmit = useCallback(
    async (data: CommunitySettingsSchema) => {
      setIsLoading(true);
      setError(undefined);
      try {
        // use form data to send request to the email api
        const responseData = await updateCommunity(community.id, data);

        // If slug has been changed
        if (community.slug !== data.slug) {
          router.replace(
            `/c/${data.slug}/settings/?mode=${CommunitySettingsMode.Settings}`
          );
        }
        reset(responseData);
      } catch (e) {
        logError(e);
        const error = e as Error & { digest?: string };
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [community.id, community.slug, router, reset]
  );

  const visibilityType = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 font-medium">Settings</h2>
        <div>
          <Button type="submit" disabled={isLoading || !formState.isDirty}>
            {t("saveChanges")}
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <Field>
          <Label className="mb-1.5 block text-sm font-bold text-gray-600 dark:text-gray-600-dark">
            Visibility
          </Label>
          <ButtonGroup
            buttons={visibilityOptions}
            value={propsToVisibilityType(visibilityType)}
            onChange={(val) => {
              Object.entries(visibilityTypeToProps(community, val)).forEach(
                ([key, value]) => {
                  setValue(key as keyof CommunityUpdateParams, value, {
                    shouldDirty: true,
                  });
                }
              );
            }}
            variant="tertiary"
          />
          <ul className="mt-3 list-inside list-disc text-xs">
            <li>
              <b>Public communities</b> are discoverable by all Metaculus users.
            </li>
            <li>
              <b>Unlisted communities</b> are not discoverable, but can be
              accessed via direct URL.
            </li>
            <li>
              <b>Draft communities</b> are only visible to you and Metaculus
              staff.
            </li>
          </ul>
        </Field>
        <InputContainer
          labelText={t("communityName")}
          explanation={t("communityNameDescription")}
        >
          <Input
            {...register("name")}
            errors={formState.errors.name}
            className="rounded border border-gray-500 px-3 py-2 text-base font-medium text-gray-800 dark:border-gray-500-dark dark:bg-blue-50-dark dark:text-gray-800-dark"
          />
        </InputContainer>
        <InputContainer labelText={t("communitySlug")}>
          <Input
            {...register("slug", {
              onChange: (e) => {
                const slug = e.target.value
                  .toLowerCase()
                  .replace(/\s+/g, "-") // Replace whitespace with hyphens
                  .replace(/[^A-Za-z0-9-]/g, "") // Remove unwanted characters
                  .replace(/-{2,}/g, "-"); // Replace multiple hyphens with a single one

                setValue("slug", slug);
              },
            })}
            errors={formState.errors.slug}
            className="rounded border border-gray-500 px-3 py-2 text-base font-medium text-gray-800 dark:border-gray-500-dark dark:bg-blue-50-dark dark:text-gray-800-dark"
          />
          <div className="rounded-md border border-blue-400 bg-blue-200 p-4 font-normal normal-case text-gray-800 dark:border-blue-400-dark dark:bg-blue-200-dark dark:text-gray-800-dark">
            <div className="mb-1.5 text-sm">
              {t("communitySlugDescription")}
            </div>
            <div className="text-base">
              <span className="opacity-50">https://www.metaculus.com/c/</span>
              <b>{watch("slug")}</b>
            </div>
          </div>
        </InputContainer>
        <div>
          <InputContainer
            labelText={t("communityDescription")}
            isNativeFormControl={false}
          >
            <MarkdownEditorField
              control={control}
              name={"description"}
              errors={formState.errors.description}
              defaultValue={community.description}
            />
          </InputContainer>
        </div>
      </div>
      {!isLoading && <FormErrorMessage errors={error} />}
    </form>
  );
};

export default CommunitySettings;
