"use client";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";

import {
  deleteProjectMember,
  updateMember,
} from "@/app/(main)/(tournaments)/tournament/[slug]/actions";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import Listbox from "@/components/ui/listbox";
import { ErrorResponse } from "@/types/fetch";
import { ProjectPermissions } from "@/types/post";
import { Tournament, TournamentMember } from "@/types/projects";
import { formatUsername } from "@/utils/formatters/users";

type Props = {
  user_permission: ProjectPermissions;
  project: Tournament;
  members: TournamentMember[];
};

const UsersManage: FC<Props> = ({ members, project, user_permission }) => {
  const memberEditRef = useRef<null | HTMLDivElement>(null);
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMember, setEditingMember] = useState<TournamentMember>();

  // A hacky way to wait until revalidatePath does a thing
  useEffect(() => {
    setIsSubmitting(false);
    setEditingMember(undefined);
  }, [members]);

  const availablePermissions = [
    ProjectPermissions.ADMIN,
    ProjectPermissions.CURATOR,
    ProjectPermissions.FORECASTER,
    ProjectPermissions.VIEWER,
  ].map((obj) => ({ label: obj, value: obj }));
  const onDelete = useCallback(
    async (userId: number) => {
      setSubmitErrors([]);

      setIsSubmitting(true);
      const responses = await deleteProjectMember(project.id, userId);

      if (responses && "errors" in responses && !!responses.errors) {
        setSubmitErrors(responses.errors);
        setIsSubmitting(false);
      }
    },
    [project.id]
  );

  const onUpdate = useCallback(
    async (userId: number, permission: ProjectPermissions) => {
      setSubmitErrors([]);

      setIsSubmitting(true);
      const responses = await updateMember(project.id, userId, permission);

      if (responses && "errors" in responses && !!responses.errors) {
        setSubmitErrors(responses.errors);
        setIsSubmitting(false);
      }
    },
    [project.id]
  );

  return (
    <div className="mt-4 rounded-md bg-gray-0 px-2 py-4 dark:bg-gray-0-dark xs:mx-4 xs:p-4 sm:p-8 lg:mx-0">
      <h2 className="mt-0">Manage Members</h2>
      <p>List of people who are part of this project. Edit user roles.</p>
      <table className="w-full table-auto text-sm">
        <thead className="border-b border-solid border-b-[#e5e7eb] text-left">
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Remove</th>
            {user_permission === ProjectPermissions.ADMIN && <th>Edit</th>}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={`user-${member.user.id}`}>
              <td className="py-2">{formatUsername(member.user)}</td>
              <td className="py-2">{member.permission}</td>
              <td className="py-2">
                <Button
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={() => onDelete(member.user.id)}
                >
                  Remove
                </Button>
              </td>
              {user_permission === ProjectPermissions.ADMIN && (
                <td className="py-2">
                  <Button
                    variant="secondary"
                    disabled={isSubmitting}
                    onClick={() => {
                      setEditingMember(member);
                      memberEditRef.current?.scrollIntoView();
                    }}
                  >
                    Edit Permissions
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <hr />
      <div ref={memberEditRef}>
        {editingMember && (
          <>
            <div>
              member:{" "}
              <span className="font-bold">
                {formatUsername(editingMember.user)}
              </span>
            </div>
            <div className="my-2 w-fit">
              <Listbox
                className="rounded-full border border-solid !border-gray-700"
                options={availablePermissions}
                onChange={(value) =>
                  setEditingMember({ ...editingMember, permission: value })
                }
                value={editingMember.permission}
              />
            </div>
            <div className="mt-4 flex gap-1">
              <Button
                variant="secondary"
                onClick={() => setEditingMember(undefined)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={isSubmitting}
                onClick={() =>
                  onUpdate(editingMember.user.id, editingMember.permission)
                }
              >
                Save
              </Button>
            </div>
          </>
        )}
        <FormError errors={submitErrors} />
      </div>
    </div>
  );
};

export default UsersManage;
