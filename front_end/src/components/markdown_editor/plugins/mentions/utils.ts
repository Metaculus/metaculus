import ClientProfileApi from "@/services/api/profile/profile.client";
import { ProjectPermissions } from "@/types/post";

import { MentionItem } from "./types";

export async function queryMentions(
  _trigger: string,
  query: string | null | undefined,
  defaultUserMentions?: MentionItem[],
  userPermission?: ProjectPermissions
): Promise<MentionItem[]> {
  const usersGroupMentions = [
    { value: "moderators" },
    { value: "admins" },
    { value: "members" },
  ];
  if (
    userPermission &&
    [ProjectPermissions.CURATOR, ProjectPermissions.ADMIN].includes(
      userPermission
    )
  ) {
    usersGroupMentions.push({ value: "predictors" });
  }
  const fallbackUserMentions = defaultUserMentions ? defaultUserMentions : [];
  const fallbackMentions = [...fallbackUserMentions, ...usersGroupMentions];

  if (!query) {
    return fallbackMentions;
  }

  if (query.length < 3) {
    return clientSearch(query, fallbackMentions);
  }

  try {
    const users = await ClientProfileApi.searchUsers(query);
    return sortUsernames(query, [
      ...users.results.map((user) => ({
        value: user.username,
        userId: user.id,
      })),
      ...usersGroupMentions,
    ]);
  } catch {
    return clientSearch(query, fallbackMentions);
  }
}

const clientSearch = (query: string, mentions: MentionItem[]) =>
  sortUsernames(
    query,
    mentions.filter((mention) =>
      mention.value.toLowerCase().includes(query?.toLowerCase() ?? "")
    )
  );

const sortUsernames = (query: string, mentions: MentionItem[]) => {
  return [...mentions].sort((a, b) => {
    const usernameA = a.value.toLowerCase();
    const usernameB = b.value.toLowerCase();
    const search = query.toLowerCase();

    const startsWithA = usernameA.startsWith(search) ? 0 : 1;
    const startsWithB = usernameB.startsWith(search) ? 0 : 1;
    return startsWithA - startsWithB;
  });
};
