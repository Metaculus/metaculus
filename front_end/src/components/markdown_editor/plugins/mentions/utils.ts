import { searchUsers } from "@/app/(main)/questions/actions";

import { MentionData, MentionItem } from "./types";

export function generateMentionLink(value: string, data?: MentionData) {
  if (!data || !Object.keys(data).length) {
    if (["moderators", "predictors", "admins", "members"].includes(value)) {
      return `/faq/#${value}-tag`;
    }

    return null;
  }

  return `/accounts/profile/${data.userId}`;
}

export async function queryMentions(
  _trigger: string,
  query: string | null | undefined
): Promise<MentionItem[]> {
  const defaultMentions = [
    { value: "moderators" },
    { value: "predictors" },
    { value: "admins" },
    { value: "members" },
  ];

  if (!query || query.length < 3) {
    return defaultMentions;
  }

  const users = await searchUsers(query);
  if ("errors" in users) {
    return defaultMentions;
  }

  return [
    ...users.results.map((user) => ({ value: user.username, userId: user.id })),
    ...defaultMentions,
  ];
}
