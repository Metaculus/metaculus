"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { FC, useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { inviteProjectUsers } from "@/app/(main)/(tournaments)/tournament/[slug]/actions";
import Button from "@/components/ui/button";
import { FormError, Textarea } from "@/components/ui/form_field";
import { ErrorResponse } from "@/types/fetch";
import { TournamentMember } from "@/types/projects";

type Props = {
  projectId: number;
  members: TournamentMember[];
};

const projectUserInviteSchema = z.object({
  usernames: z.string().transform((val) => val.split("\n")),
});
type FormData = z.infer<typeof projectUserInviteSchema>;

const MembersInvite: FC<Props> = ({ projectId, members }) => {
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleSubmit, register, reset } = useForm<FormData>({
    resolver: zodResolver(projectUserInviteSchema),
  });

  // A hacky way to wait until revalidatePath does a thing
  useEffect(() => {
    setIsSubmitting(false);
    reset();
  }, [members, reset]);

  const onSubmit = useCallback(
    async ({ usernames }: FormData) => {
      setSubmitErrors([]);

      setIsSubmitting(true);
      const responses = await inviteProjectUsers(projectId, usernames);

      if (responses && "errors" in responses && !!responses.errors) {
        setSubmitErrors(responses.errors);
      } else {
        reset();
      }
    },
    [reset, projectId]
  );

  return (
    <div className="mt-4 rounded-md bg-gray-0 p-4 dark:bg-gray-0-dark xs:mx-4 sm:p-8 lg:mx-0">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h2 className="mt-0">Invite Users to Project</h2>
        <p>
          You can invite new members by their usernames if they are already
          registered.
        </p>
        <div className="grid grid-cols-5">
          <div className="col-span-3">
            <Textarea
              style={{ height: "75px" }}
              className="w-full rounded border border-gray-700 px-3 py-2 text-sm placeholder:italic dark:border-gray-700-dark"
              {...register("usernames")}
            />
            <span className="text-[9px]">
              Multiple usernames can be added, separated by new lines.
            </span>
            <FormError errors={submitErrors} />
          </div>
        </div>
        <div className="mt-8">
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            Add Users to Project
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MembersInvite;
