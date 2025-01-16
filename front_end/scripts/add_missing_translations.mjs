import "dotenv/config";
import fs from "fs";
import OpenAI from "openai";
import path from "path";

const MESSAGES_DIR = path.join(process.cwd(), "messages");
const BASE_FILE = "en.json";
const FILES_TO_SKIP = new Set(["original.json", BASE_FILE]);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function getMissingTranslations(missingKeys, baseTranslations, language) {
  const client = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  const toBeTranslated = Object.fromEntries(
    missingKeys
      .filter((key) => key in baseTranslations)
      .map((key) => [key, baseTranslations[key]])
  );

  const systemPrompt = `
You are a professional translator. Translate the following strings from English to ${language} and return only a JSON object with the same keys.

Strings:
${JSON.stringify(toBeTranslated, undefined, 2)}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: systemPrompt.trim() }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices?.[0]?.message?.content || "{}");
}

async function main() {
  const basePath = path.join(MESSAGES_DIR, BASE_FILE);
  const baseTranslations = JSON.parse(fs.readFileSync(basePath, "utf8"));
  const baseKeys = Object.keys(baseTranslations);

  const allFiles = fs.readdirSync(MESSAGES_DIR);
  const languageFiles = allFiles.filter(
    (file) => file.endsWith(".json") && !FILES_TO_SKIP.has(file)
  );

  for (const langFile of languageFiles) {
    const filePath = path.join(MESSAGES_DIR, langFile);
    const language = path.basename(langFile, ".json");
    const existingTranslations = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const missingKeys = baseKeys.filter(
      (key) => !existingTranslations.hasOwnProperty(key)
    );
    if (!missingKeys.length) continue;

    const newTranslations = await getMissingTranslations(
      missingKeys,
      baseTranslations,
      language
    );
    for (const [key, value] of Object.entries(newTranslations)) {
      existingTranslations[key] = value;
    }
    fs.writeFileSync(
      filePath,
      JSON.stringify(existingTranslations, null, 2),
      "utf8"
    );
    console.log(
      `Added ${missingKeys.length} missing translations to ${langFile}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
