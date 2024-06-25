"use client";
import React, { FC, useCallback, useEffect, useState } from "react";

import { getProjectMembers } from "@/app/(main)/tournaments/[slug]/actions";
import InviteUsers from "@/app/(main)/tournaments/components/members_invite";
import UsersManage from "@/app/(main)/tournaments/components/members_manage";
import { Tournament, TournamentMember } from "@/types/projects";

type Props = {
  project: Tournament;
};

const ProjectMembers: FC<Props> = ({ project }) => {
  const [projectMembers, setProjectMembers] = useState<TournamentMember[]>([]);

  const refreshMembers = useCallback(async () => {
    const members = await getProjectMembers(project.id);
    setProjectMembers(members);
  }, [project.id]);

  useEffect(() => {
    refreshMembers().then();
  }, [refreshMembers]);

  return (
    <>
      <InviteUsers projectId={project.id} refreshMembers={refreshMembers} />
      <UsersManage
        user_permission={project.user_permission}
        projectId={project.id}
        members={projectMembers}
        refreshMembers={refreshMembers}
      />
    </>
  );
};

export default ProjectMembers;
