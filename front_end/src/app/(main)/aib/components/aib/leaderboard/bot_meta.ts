import type { StaticImageData } from "next/image";

import anthropicIcon from "@/app/(main)/aib/assets/ai-models/claude.png";
import googleIcon from "@/app/(main)/aib/assets/ai-models/google.png";
import openaiIcon from "@/app/(main)/aib/assets/ai-models/gpt.png";

export type BotMeta = {
  label: string;
  icon?: StaticImageData;
  releasedAt?: string;
};

const MAP: Record<string, BotMeta> = {
  "metac-deepseek-r1+deepseek-r1-exa-online": {
    label: "DeepSeek R1 + Exa (Online)",
    icon: googleIcon,
  },
  "metac-gpt-5-mini+asknews": {
    label: "GPT-5 mini + AskNews",
    icon: openaiIcon,
  },
  "metac-deepseek-v3-1+asknews": {
    label: "DeepSeek V3.1 + AskNews",
    icon: anthropicIcon,
  },
  "metac-gpt-5-high+asknews": {
    label: "GPT-5 high + AskNews",
    icon: openaiIcon,
  },
};

export function getBotMeta(username?: string): BotMeta {
  if (!username) return { label: "Unknown Bot" };
  return MAP[username] ?? { label: username };
}
