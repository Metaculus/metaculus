"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { getPost, makeRepost } from "@/app/(main)/questions/actions";
import PostCard from "@/components/post_card";
import Button from "@/components/ui/button";
import { FormErrorMessage, Input } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { useDebouncedCallback } from "@/hooks/use_debounce";
import { PostWithForecasts } from "@/types/post";
import { Community } from "@/types/projects";
import { logError } from "@/utils/core/errors";
import { getPostLink } from "@/utils/navigation";
import { parseQuestionId } from "@/utils/questions/helpers";

import BacktoCreate from "./back_to_create";

type Props = {
  community: Community;
};

const createRepostSchema = (t: ReturnType<typeof useTranslations>) => {
  return z.object({
    post_reference: z.string().min(1, { message: t("errorRequired") }),
  });
};

const RepostForm: FC<Props> = ({ community }) => {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<
    (Error & { digest?: string }) | undefined
  >();
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [isPostLoading, setIsPostLoading] = useState(false);
  const [post, setPost] = useState<PostWithForecasts>();

  const reportSchema = createRepostSchema(t);
  const { setError, formState, register, clearErrors, setValue, handleSubmit } =
    useForm({
      mode: "all",
      resolver: zodResolver(reportSchema),
    });

  const retrievePost = useCallback(
    async (postRef: string) => {
      setPost(undefined);
      clearErrors("post_reference");
      setValue("post_reference", postRef);

      const { postId } = parseQuestionId(postRef, true);

      if (!postId) {
        return;
      }

      setIsPostLoading(true);

      try {
        const post = await getPost(postId);
        setPost(post);
      } catch {
        setError("post_reference", {
          type: "manual",
          message: "Can't load the question",
        });
      } finally {
        setIsPostLoading(false);
      }
    },
    [clearErrors, setError, setValue]
  );

  const debouncedRetrievePost = useDebouncedCallback(retrievePost, 250);

  const onSubmit = useCallback(async () => {
    if (post) {
      setIsLoading(true);

      try {
        await makeRepost(post.id, community.id);
        router.push(getPostLink(post));
      } catch (e) {
        logError(e);
        const error = e as Error & { digest?: string };
        setSubmitError(error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [community.id, community.slug, post, router]);

  return (
    <main className="mb-4 mt-2 flex max-w-4xl flex-col justify-center self-center rounded-none bg-gray-0 px-4 pb-5 pt-4 dark:bg-gray-0-dark md:m-8 md:mx-auto md:rounded-md md:px-8 md:pb-8 lg:m-12 lg:mx-auto">
      <BacktoCreate
        backText={t("create")}
        backHref="/questions/create"
        currentPage={t("addExistingQuestion")}
      />
      <div className="text-sm text-gray-700 dark:text-gray-700-dark md:mt-1 md:text-base">
        {t("existingQuestionExample")}
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 flex w-full flex-col gap-6"
      >
        <InputContainer
          labelText={t("questionId")}
          explanation={t("enterQuestionIdUrl")}
        >
          <div className="relative m-auto w-full flex-col">
            <Input
              className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
              {...register("post_reference")}
              onChange={(e) => debouncedRetrievePost(e.target.value)}
              errors={formState.errors.post_reference}
            />
            {isPostLoading && (
              <div className="absolute inset-y-0 right-0 inline-flex h-[42px] justify-center pr-2">
                <LoadingSpinner size="1x" />
              </div>
            )}
          </div>
        </InputContainer>
        {post && <PostCard post={post} />}
        <div className="flex-col">
          <div className="m-2">
            {!isLoading && <FormErrorMessage errors={submitError} />}
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-max capitalize"
            disabled={isPostLoading || isLoading || !post}
          >
            {t("addQuestion")}
          </Button>
        </div>
      </form>
    </main>
  );
};

export default RepostForm;
