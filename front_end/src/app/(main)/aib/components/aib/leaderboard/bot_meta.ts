import type { StaticImageData } from "next/image";

import anthropicIcon from "@/app/(main)/aib/assets/ai-models/claude.png";
import deepseekIcon from "@/app/(main)/aib/assets/ai-models/deepseek.png";
import exaIcon from "@/app/(main)/aib/assets/ai-models/exa.png";
import googleIcon from "@/app/(main)/aib/assets/ai-models/google.png";
import openaiIcon from "@/app/(main)/aib/assets/ai-models/gpt.png";
import kimiIcon from "@/app/(main)/aib/assets/ai-models/kimi.png";
import llamaIcon from "@/app/(main)/aib/assets/ai-models/llama.png";
import perplexityIcon from "@/app/(main)/aib/assets/ai-models/perplexity.png";
import qwenIcon from "@/app/(main)/aib/assets/ai-models/qwen.png";
import xIcon from "@/app/(main)/aib/assets/ai-models/x.png";
import zaiIcon from "@/app/(main)/aib/assets/ai-models/zai.png";

export type BotMeta = {
  label: string;
  username?: string;
  releasedAt?: string;
  icon?: StaticImageData;
};

export const BOT_CATALOG = [
  {
    id: 236045,
    username: "metac-Gemini-Exp-1206",
    model: "Gemini Experimental",
    releaseDate: "2025-03-29",
  },
  {
    id: 236047,
    username: "metac-Llama-3.1",
    model: "Llama 3.1",
    releaseDate: "2025-07",
  },
  {
    id: 236041,
    username: "metac-claude-3-5-sonnet-20240620+asknews",
    model: "Claude 3.5 Sonnet",
    releaseDate: "2024-06-20",
  },
  {
    id: 236040,
    username: "metac-claude-3-5-sonnet-latest+asknews",
    model: "Claude 3.5 Sonnet",
    releaseDate: "2024-06-20",
  },
  {
    id: 269195,
    username: "metac-claude-3-7-sonnet+asknews",
    model: "Claude 3.7 Sonnet",
    releaseDate: "2025-02-24",
  },
  {
    id: 269194,
    username: "metac-claude-3-7-sonnet-thinking+asknews",
    model: "Claude 3.7 Sonnet",
    releaseDate: "2025-02-24",
  },
  {
    id: 278276,
    username: "metac-claude-4-1-opus-high-16k+asknews",
    model: "Claude 4.1 Opus",
    releaseDate: "2025-08-05",
  },
  {
    id: 278275,
    username: "metac-claude-4-sonnet+asknews",
    model: "Claude 4 Sonnet",
    releaseDate: "2025-05-22",
  },
  {
    id: 278274,
    username: "metac-claude-4-sonnet-high-16k+asknews",
    model: "Claude 4 Sonnet",
    releaseDate: "2025-05-22",
  },

  {
    id: 250015,
    username: "metac-deepseek-r1+asknews",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 278280,
    username: "metac-deepseek-r1+asknews(variance-test)",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 269786,
    username: "metac-deepseek-r1+asknews-deepnews",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 278297,
    username: "metac-deepseek-r1+deepseek-r1-exa-online",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 269785,
    username: "metac-deepseek-r1+exa-answer",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 269784,
    username: "metac-deepseek-r1+exa-smart-searcher",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 269783,
    username: "metac-deepseek-r1+gemini-2-5-pro-grounding",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 269782,
    username: "metac-deepseek-r1+gpt-4o-search-preview",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 278301,
    username: "metac-deepseek-r1+no-research",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 278300,
    username: "metac-deepseek-r1+o4-mini-deep-research",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 269777,
    username: "metac-deepseek-r1+sonar",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 269778,
    username: "metac-deepseek-r1+sonar-deep-research",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 269776,
    username: "metac-deepseek-r1+sonar-pro",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 269780,
    username: "metac-deepseek-r1+sonar-reasoning",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 269779,
    username: "metac-deepseek-r1+sonar-reasoning-pro",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 278298,
    username: "metac-deepseek-r1+sonnet-4-search",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },
  {
    id: 278299,
    username: "metac-deepseek-r1+xai-livesearch",
    model: "DeepSeek R1",
    releaseDate: "2025-01-20",
  },

  {
    id: 269201,
    username: "metac-deepseek-v3+asknews",
    model: "DeepSeek v3",
    releaseDate: "2024-12",
  },
  {
    id: 278284,
    username: "metac-deepseek-v3-1+asknews",
    model: "DeepSeek v3.1",
    releaseDate: "2025-03",
  },
  {
    id: 278285,
    username: "metac-deepseek-v3-1+asknews(variance-test-1)",
    model: "DeepSeek v3.1",
    releaseDate: "2025-03",
  },
  {
    id: 278286,
    username: "metac-deepseek-v3-1+asknews(variance-test-2)",
    model: "DeepSeek v3.1",
    releaseDate: "2025-03",
  },
  {
    id: 278283,
    username: "metac-deepseek-v3-1-reasoning+asknews",
    model: "DeepSeek v3.1",
    releaseDate: "2025-03",
  },

  {
    id: 239759,
    username: "metac-exa",
    model: "Exa",
    releaseDate: "2025-10-09",
  },
  {
    id: 278290,
    username: "metac-exa-research-pro[research-only-bot]",
    model: "Exa Research",
    releaseDate: "2025-06-04",
  },

  {
    id: 269197,
    username: "metac-gemini-2-0-flash+asknews",
    model: "Gemini 2.0 Flash",
    releaseDate: "2025-02-05",
  },
  {
    id: 269794,
    username: "metac-gemini-2-5-flash+asknews",
    model: "Gemini 2.5 Flash",
    releaseDate: "2025-06-17",
  },
  {
    id: 269196,
    username: "metac-gemini-2-5-pro+asknews",
    model: "Gemini 2.5 Pro",
    releaseDate: "2025-06-17",
  },
  {
    id: 269775,
    username: "metac-gemini-2-5-pro+exa-pro",
    model: "Gemini 2.5 Pro",
    releaseDate: "2025-06-17",
  },
  {
    id: 269773,
    username: "metac-gemini-2-5-pro+gemini-2-5-pro-grounding",
    model: "Gemini 2.5 Pro",
    releaseDate: "2025-06-17",
  },
  {
    id: 269774,
    username: "metac-gemini-2-5-pro+sonar-reasoning-pro",
    model: "Gemini 2.5 Pro",
    releaseDate: "2025-06-17",
  },
  {
    id: 278291,
    username: "metac-gemini-2-5-pro-grounding[research-only]",
    model: "Gemini 2.5 Pro",
    releaseDate: "2025-06-17",
  },

  {
    id: 269192,
    username: "metac-gpt-3-5-turbo+asknews",
    model: "GPT-3.5 Turbo",
    releaseDate: "2022-11-30",
  },
  {
    id: 269791,
    username: "metac-gpt-4-1+asknews",
    model: "GPT-4.1",
    releaseDate: "2025-04-14",
  },
  {
    id: 278302,
    username: "metac-gpt-4-1+asknews[optimized-prompt]",
    model: "GPT-4.1",
    releaseDate: "2025-04-14",
  },
  {
    id: 269792,
    username: "metac-gpt-4-1-mini+asknews",
    model: "GPT-4.1 Mini",
    releaseDate: "2025-04-14",
  },
  {
    id: 269793,
    username: "metac-gpt-4-1-nano+asknews",
    model: "GPT-4.1 Nano",
    releaseDate: "2025-04-14",
  },
  {
    id: 278303,
    username: "metac-gpt-4-1-nano+asknews[optimized-prompt]",
    model: "GPT-4.1 Nano",
    releaseDate: "2025-04-14",
  },
  {
    id: 269191,
    username: "metac-gpt-4-5-preview",
    model: "GPT-4.5 Preview",
    releaseDate: "2025-02-27",
  },
  {
    id: 236038,
    username: "metac-gpt-4o+asknews",
    model: "GPT-4o",
    releaseDate: "2025-05-13",
  },
  {
    id: 269193,
    username: "metac-gpt-4o-mini+asknews",
    model: "GPT-4o Mini",
    releaseDate: "2025-07-18",
  },
  {
    id: 278271,
    username: "metac-gpt-5+asknews",
    model: "GPT-5",
    releaseDate: "2025-08-07",
  },
  {
    id: 278270,
    username: "metac-gpt-5-high+asknews",
    model: "GPT-5",
    releaseDate: "2025-08-07",
  },
  {
    id: 278305,
    username: "metac-gpt-5-high+tools[agent-bot]",
    model: "GPT-5",
    releaseDate: "2025-08-07",
  },
  {
    id: 278272,
    username: "metac-gpt-5-mini+asknews",
    model: "GPT-5 Mini",
    releaseDate: "2025-08-07",
  },
  {
    id: 278273,
    username: "metac-gpt-5-nano+asknews",
    model: "GPT-5 Nano",
    releaseDate: "2025-08-07",
  },
  {
    id: 278293,
    username: "metac-gpt-5-search[research-only-bot]",
    model: "GPT-5 Search",
    releaseDate: "2025-08-07",
  },

  {
    id: 278281,
    username: "metac-gpt-oss-120b+asknews",
    model: "GPT-OSS 120B",
    releaseDate: "2025-08-05",
  },

  {
    id: 236043,
    username: "metac-grok-2-1212",
    model: "Grok 2",
    releaseDate: "2024-08-20",
  },
  {
    id: 269202,
    username: "metac-grok-3+asknews",
    model: "Grok 3",
    releaseDate: "2025-02-17",
  },
  {
    id: 269203,
    username: "metac-grok-3-mini-high+asknews",
    model: "Grok 3 Mini",
    releaseDate: "2025-02-17",
  },
  {
    id: 278277,
    username: "metac-grok-4+asknews",
    model: "Grok 4",
    releaseDate: "2025-07-09",
  },
  {
    id: 278304,
    username: "metac-grok-4+tools[agent-bot]",
    model: "Grok 4",
    releaseDate: "2025-07-09",
  },
  {
    id: 278294,
    username: "metac-grok-4-live-search[research-only-bot]",
    model: "Grok 4 Live Search",
    releaseDate: "2025-07-09",
  },

  {
    id: 278278,
    username: "metac-kimi-k2+asknews",
    model: "KIMI K2",
    releaseDate: "2025-07-11",
  },

  {
    id: 269199,
    username: "metac-llama-3-3-nemotron-49b",
    model: "LLaMA 3.3 Nemotron 49B",
    releaseDate: "2024-07-25",
  },
  {
    id: 269198,
    username: "metac-llama-4-maverick-17b+asknews",
    model: "LLaMA 4 Maverick 17B",
    releaseDate: "2025-04-05",
  },
  {
    id: 236037,
    username: "metac-o1+asknews",
    model: "OpenAI o1",
    releaseDate: "2024-12-05",
  },
  {
    id: 269187,
    username: "metac-o1-high+asknews",
    model: "OpenAI o1",
    releaseDate: "2024-12-05",
  },
  {
    id: 269190,
    username: "metac-o1-mini+asknews",
    model: "OpenAI o1 Mini",
    releaseDate: "2024-09-12",
  },
  {
    id: 240416,
    username: "metac-o1-preview",
    model: "OpenAI o1 Preview",
    releaseDate: "2024-09-12",
  },
  {
    id: 269788,
    username: "metac-o3+asknews",
    model: "OpenAI o3",
    releaseDate: "2025-04-16",
  },
  {
    id: 278288,
    username: "metac-o3-deep-research[research-only]",
    model: "OpenAI o3 Deep Research",
    releaseDate: "2025-06-27",
  },
  {
    id: 269787,
    username: "metac-o3-high+asknews",
    model: "OpenAI o3",
    releaseDate: "2025-04-16",
  },
  {
    id: 269188,
    username: "metac-o3-mini",
    model: "OpenAI o3 Mini",
    releaseDate: "2025-01-31",
  },
  {
    id: 269189,
    username: "metac-o3-mini-high+asknews",
    model: "OpenAI o3 Mini",
    releaseDate: "2025-01-31",
  },
  {
    id: 269790,
    username: "metac-o4-mini+asknews",
    model: "OpenAI o4 Mini",
    releaseDate: "2025-04-16",
  },
  {
    id: 278287,
    username: "metac-o4-mini-deep-research[research-only-bot]",
    model: "OpenAI o4 Mini Deep Research",
    releaseDate: "2025-07-27",
  },
  {
    id: 269789,
    username: "metac-o4-mini-high+asknews",
    model: "OpenAI o4 Mini",
    releaseDate: "2025-04-16",
  },

  {
    id: 269781,
    username: "metac-only-sonar-reasoning-pro",
    model: "Perplexity Sonar Reasoning Pro",
    releaseDate: "2025-03-07",
  },

  {
    id: 269200,
    username: "metac-qwen-2-5-max+asknews",
    model: "Qwen 2.5 Max",
    releaseDate: "2025-01-28",
  },

  {
    id: 278289,
    username: "metac-sonar-deep-research[research-only]",
    model: "Perplexity Sonar Deep Research",
    releaseDate: "2025-03-07",
  },
  {
    id: 278306,
    username: "metac-sonnet-4-high+tools[agent-bot]",
    model: "Claude Sonnet 4",
    releaseDate: "2025-05-22",
  },
  {
    id: 278295,
    username: "metac-sonnet-4-search[research-only-bot]",
    model: "Claude Sonnet 4",
    releaseDate: "2025-05-22",
  },

  {
    id: 269204,
    username: "metac-uniform-probability-bot",
    model: "N/A",
    releaseDate: "",
  },

  {
    id: 278282,
    username: "metac-zai-glm-4-5+asknews",
    model: "Z.AI GLM 4.5",
    releaseDate: "2025-07-28",
  },
  {
    id: 999001,
    username: "metac-asknews-deepnews[research-only]",
    model: "N/A",
    releaseDate: "",
  },
] as const;

const ICONS_BY_FAMILY: Record<string, StaticImageData | undefined> = {
  anthropic: anthropicIcon,
  google: googleIcon,
  openai: openaiIcon,
  xai: xIcon,

  deepseek: deepseekIcon,
  qwen: qwenIcon,
  kimi: kimiIcon,
  perplexity: perplexityIcon,
  zai: zaiIcon,
  llama: llamaIcon,
  exa: exaIcon,
};

function detectFamily(username: string, model?: string) {
  const u = username.toLowerCase();
  const m = (model ?? "").toLowerCase();

  if (
    u.includes("claude") ||
    m.includes("claude") ||
    m.includes("opus") ||
    m.includes("sonnet")
  )
    return "anthropic";
  if (u.includes("gemini") || m.startsWith("gemini")) return "google";
  if (
    u.includes("gpt") ||
    u.includes("metac-o") ||
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
  if (
    u.includes("llama") ||
    u.includes("nemotron") ||
    m.includes("llama") ||
    m.includes("nemotron")
  )
    return "llama";
  if (u.startsWith("metac-exa") || m.startsWith("exa")) return "exa";

  return undefined;
}

function pickIcon(
  username: string,
  model?: string
): StaticImageData | undefined {
  const fam = detectFamily(username, model);
  return fam ? ICONS_BY_FAMILY[fam] : undefined;
}

const META_BY_USERNAME: Record<string, BotMeta> = BOT_CATALOG.reduce(
  (acc, { username, model, releaseDate }) => {
    acc[username] = {
      label: model || username,
      username,
      releasedAt: releaseDate || undefined,
      icon: pickIcon(username, model),
    };
    return acc;
  },
  {} as Record<string, BotMeta>
);

export function getBotMeta(username?: string): BotMeta | null {
  if (!username) return null;
  return META_BY_USERNAME[username] ?? null;
}
