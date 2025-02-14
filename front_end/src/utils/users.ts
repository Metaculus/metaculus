import { UserBase } from "@/types/users";

export function formatUsername(profile: UserBase) {
  return profile.is_bot ? `🤖 ${profile.username}` : profile.username;
}
