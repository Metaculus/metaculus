import { searchUsers } from "@/app/(main)/questions/actions";

import { MentionItem } from "./types";

export async function queryMentions(
  _trigger: string,
  query: string | null | undefined,
  defaultUserMentions?: MentionItem[],
  isStuff?: boolean
): Promise<MentionItem[]> {
  const usersGroupMentions = [
    { value: "moderators" },
    { value: "admins" },
    { value: "members" },
  ];
  if (isStuff) {
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

  const users = await searchUsers(query);
  if ("errors" in users) {
    return clientSearch(query, fallbackMentions);
  }

  return [
    ...users.results.map((user) => ({ value: user.username, userId: user.id })),
    ...usersGroupMentions,
  ];
}

const clientSearch = (query: string, mentions: MentionItem[]) =>
  mentions.filter((mention) =>
    mention.value.toLowerCase().includes(query?.toLowerCase() ?? "")
  );
