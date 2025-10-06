export type IconKey = "openai" | "google" | "anthropic" | "xai";

export type BenchmarkModel = {
  id: string;
  name: string;
  forecasts: number;
  score: number;
  iconKey: IconKey;
};

const DEFAULT_MODELS_BASE: BenchmarkModel[] = [
  {
    id: "gpt4",
    name: "GPT-4",
    forecasts: 1534,
    score: 58.5,
    iconKey: "openai",
  },
  {
    id: "gemini-1-0-pro-new",
    name: "Gemini 1.0 Pro",
    forecasts: 1534,
    score: 57.21,
    iconKey: "google",
  },
  {
    id: "claude-sonnet-37",
    name: "Claude 3.7 Sonnet",
    forecasts: 1534,
    score: 55.2,
    iconKey: "anthropic",
  },
  { id: "grok4", name: "Grok 4", forecasts: 1534, score: 52.8, iconKey: "xai" },
  {
    id: "gemini-2-5-flash",
    name: "Gemini 2.5 Flash",
    forecasts: 1534,
    score: 43.5,
    iconKey: "google",
  },
  {
    id: "gemini-1-0-pro",
    name: "Gemini 1.0 Pro",
    forecasts: 1534,
    score: 42.21,
    iconKey: "google",
  },
  {
    id: "claude-sonnet-37-dup",
    name: "Claude 3.7 Sonnet",
    forecasts: 1534,
    score: 41.2,
    iconKey: "anthropic",
  },
];

export const DEFAULT_MODELS = [
  ...DEFAULT_MODELS_BASE,
  ...DEFAULT_MODELS_BASE.map((m) => ({ ...m, id: m.id + "-1" })),
  ...DEFAULT_MODELS_BASE.map((m) => ({ ...m, id: m.id + "-2" })),
];
