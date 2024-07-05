"use client";
import { useRouter } from "next/navigation";
import React, { FC, useCallback, useRef, useState } from "react";

import {
  deleteProjectMember,
  updateMember,
} from "@/app/(main)/tournaments/[slug]/actions";
import Button from "@/components/ui/button";
import Listbox from "@/components/ui/listbox";
import { ErrorResponse } from "@/types/fetch";
import { ProjectPermissions } from "@/types/post";
import { TournamentMember } from "@/types/projects";

type Props = {
  user_permission: ProjectPermissions;
  projectId: number;
  members: TournamentMember[];
  refreshMembers: () => Promise<void>;
};

const UsersManage: FC<Props> = ({
  members,
  projectId,
  refreshMembers,
  user_permission,
}) => {
  const memberEditRef = useRef<null | HTMLDivElement>(null);
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMember, setEditingMember] = useState<TournamentMember>();

  const availablePermissions = [
    ProjectPermissions.ADMIN,
    ProjectPermissions.CURATOR,
    ProjectPermissions.FORECASTER,
    ProjectPermissions.VIEWER,
  ].map((obj) => ({ label: obj, value: obj }));
  const router = useRouter();

  const onDelete = useCallback(
    async (userId: number) => {
      setSubmitErrors([]);

      setIsSubmitting(true);
      const responses = await deleteProjectMember(projectId, userId);

      if (responses && "errors" in responses && !!responses.errors) {
        setSubmitErrors(responses.errors);
      } else {
        await refreshMembers();
      }

      setIsSubmitting(false);
    },
    [refreshMembers, projectId]
  );

  const onUpdate = useCallback(
    async (userId: number, permission: ProjectPermissions) => {
      setSubmitErrors([]);

      setIsSubmitting(true);
      const responses = await updateMember(projectId, userId, permission);

      if (responses && "errors" in responses && !!responses.errors) {
        setSubmitErrors(responses.errors);
      } else {
        setEditingMember(undefined);
        await refreshMembers();
      }

      setIsSubmitting(false);
    },
    [refreshMembers, projectId]
  );

  return (
    <div className="mt-12 rounded-t bg-gray-0 px-3 py-6 dark:bg-gray-0-dark">
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
              <td className="py-2">{member.user.username}</td>
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
              <span className="font-bold">{editingMember.user.username}</span>
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
      </div>
    </div>
  );
};

export default UsersManage;
