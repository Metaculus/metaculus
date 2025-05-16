import ServerProjectsApi from "@/services/api/projects/projects.server";
import { Tournament } from "@/types/projects";

import InviteUsers from "./members_invite";
import UsersManage from "./members_manage";

type Props = {
  project: Tournament;
};

export default async function Members({ project }: Props) {
  const members = await ServerProjectsApi.getMembers(project.id);

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
