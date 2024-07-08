"use server";

import InviteUsers from "@/app/(main)/tournaments/components/members/members_invite";
import UsersManage from "@/app/(main)/tournaments/components/members/members_manage";
import ProjectsApi from "@/services/projects";
import { Tournament, TournamentMember } from "@/types/projects";

type Props = {
  project: Tournament;
};

export default async function Members({ project }: Props) {
  const members = await ProjectsApi.getMembers(project.id);

  return (
    <>
      <InviteUsers projectId={project.id} members={members} />
      <UsersManage
        user_permission={project.user_permission}
        project={project}
        members={members}
      />
    </>
  );
}
