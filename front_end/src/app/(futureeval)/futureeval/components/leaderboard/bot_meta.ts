import type { StaticImageData } from "next/image";

import anthropicDark from "@/app/(main)/aib/assets/ai-models/anthropic-dark.svg?url";
import anthropicLight from "@/app/(main)/aib/assets/ai-models/anthropic-light.svg?url";
import deepseekLight from "@/app/(main)/aib/assets/ai-models/deepseek.svg?url";
import exaLight from "@/app/(main)/aib/assets/ai-models/exa.png";
import googleLight from "@/app/(main)/aib/assets/ai-models/google.svg?url";
import kimiLight from "@/app/(main)/aib/assets/ai-models/kimi-icon.svg?url";
import metaLight from "@/app/(main)/aib/assets/ai-models/meta.svg?url";
import minimaxLight from "@/app/(main)/aib/assets/ai-models/minimax.svg?url";
import nvidiaLight from "@/app/(main)/aib/assets/ai-models/nvidia.svg?url";
import openaiLight from "@/app/(main)/aib/assets/ai-models/openai.svg?url";
import openaiDark from "@/app/(main)/aib/assets/ai-models/openai_dark.svg?url";
import perplexityLight from "@/app/(main)/aib/assets/ai-models/perplexity.svg?url";
import qwenDark from "@/app/(main)/aib/assets/ai-models/qwen_dark.svg?url";
import qwenLight from "@/app/(main)/aib/assets/ai-models/qwen_light.svg?url";
import thinkingMachinesDark from "@/app/(main)/aib/assets/ai-models/thinking-machines-dark.svg?url";
import thinkingMachinesLight from "@/app/(main)/aib/assets/ai-models/thinking-machines-light.svg?url";
import xLight from "@/app/(main)/aib/assets/ai-models/x.svg?url";
import xDark from "@/app/(main)/aib/assets/ai-models/x_dark.svg?url";
import zaiLight from "@/app/(main)/aib/assets/ai-models/zai.png";
import type { LeaderboardEntry } from "@/types/scoring";

export type IconLike = StaticImageData | string;

function detectFamily(username: string, model?: string) {
  // Ignore the research provider after "+", which can name another lab
  // (e.g. "metac-deepseek-r1+gpt-4o-search-preview").
  const u = username.toLowerCase().split("+")[0] ?? "";
  const m = (model ?? "").toLowerCase();

  if (
    u.includes("claude") ||
    m.includes("claude") ||
    m.includes("opus") ||
    m.includes("sonnet")
  )
    return "anthropic";
  if (u.includes("gemini") || u.includes("gemma")) return "google";
  if (
    u.includes("gpt") ||
    /^metac-o\d/.test(u) ||
    m.startsWith("gpt") ||
    m.startsWith("openai o")
  )
    return "openai";
  if (u.includes("grok") || u.includes("xai") || m.startsWith("grok"))
    return "xai";

  if (u.includes("deepseek") || m.startsWith("deepseek")) return "deepseek";
  if (u.includes("qwen") || m.startsWith("qwen")) return "qwen";
  if (u.includes("kimi") || m.includes("moonshot")) return "kimi";
  if (
    u.includes("perplexity") ||
    u.includes("sonar") ||
    m.includes("perplexity")
  )
    return "perplexity";
  if (
    u.includes("glm") ||
    u.includes("zai") ||
    m.includes("glm") ||
    m.includes("z.ai")
  )
    return "zai";
  if (u.includes("nemotron") || m.includes("nemotron")) return "nvidia";
  if (
    u.includes("llama") ||
    u.includes("muse") ||
    m.includes("llama") ||
    m.includes("muse")
  )
    return "meta";
  if (u.includes("inkling") || m.includes("inkling"))
    return "thinking_machines";
  if (u.startsWith("metac-exa") || m.startsWith("exa")) return "exa";
  if (u.includes("minimax") || m.startsWith("minimax")) return "minimax";

  return "other";
}

export type Family = ReturnType<typeof detectFamily>;

export const FAMILY_METADATA: Readonly<
  Record<Family, { label: string; iconLight?: IconLike; iconDark?: IconLike }>
> = {
  anthropic: {
    label: "Anthropic",
    iconLight: anthropicLight,
    iconDark: anthropicDark,
  },
  google: { label: "Google", iconLight: googleLight },
  openai: { label: "OpenAI", iconLight: openaiLight, iconDark: openaiDark },
  xai: { label: "xAI", iconLight: xLight, iconDark: xDark },
  deepseek: { label: "DeepSeek", iconLight: deepseekLight },
  qwen: { label: "Alibaba", iconLight: qwenLight, iconDark: qwenDark },
  kimi: { label: "Moonshot", iconLight: kimiLight },
  perplexity: { label: "Perplexity", iconLight: perplexityLight },
  zai: { label: "Z.AI", iconLight: zaiLight },
  meta: { label: "Meta", iconLight: metaLight },
  nvidia: { label: "NVIDIA", iconLight: nvidiaLight },
  thinking_machines: {
    label: "Thinking Machines",
    iconLight: thinkingMachinesLight,
    iconDark: thinkingMachinesDark,
  },
  exa: { label: "Exa", iconLight: exaLight },
  minimax: { label: "MiniMax", iconLight: minimaxLight },
  other: { label: "Other" },
};

export function getModelDetailsFromScoreEntry(
  entry: Partial<LeaderboardEntry>
) {
  const username = entry.user?.username;
  const model = entry.user?.metadata?.bot_details?.base_models?.[0]?.name;
  if (!username) return null;
  const family = detectFamily(username, model);
  const familyMeta = FAMILY_METADATA[family];

  return {
    username,
    label: model ?? username,
    family,
    familyLabel: familyMeta.label,
    iconLight: familyMeta.iconLight,
    iconDark: familyMeta.iconDark ?? familyMeta.iconLight,
  } as const;
}
