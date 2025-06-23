import "dotenv/config";
import { encoding_for_model } from "@dqbd/tiktoken";
import fs from "fs";
import OpenAI from "openai";
import path from "path";

const MESSAGES_DIR = path.join(process.cwd(), "messages");
const BASE_FILE = "en.json";
const FILES_TO_SKIP = new Set(["original.json", BASE_FILE]);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GPT_MODEL = "gpt-4o";

const MAX_TOKENS_PER_CHUNK = 3000;

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const enc = encoding_for_model(GPT_MODEL);

function estimateTokensForChunk(chunkObj) {
  const tokens = enc.encode(JSON.stringify(chunkObj, null, 2)).length;
  return tokens + 50;
}

/**
 * Break `missingKeys` into multiple chunks so each chunk's
 * prompt is under MAX_TOKENS_PER_CHUNK.
 */
function chunkMissingTranslations(missingKeys, baseTranslations, language) {
  const chunks = [];
  let currentChunk = {};

  for (const key of missingKeys) {
    const updatedChunk = { ...currentChunk, [key]: baseTranslations[key] };

    // Estimate tokens
    const tokens = estimateTokensForChunk(updatedChunk, language);

    if (tokens > MAX_TOKENS_PER_CHUNK) {
      // If the current chunk is empty, that means
      // a single key-value alone exceeds the limit.
      // We have no choice but to push it alone anyway.
      if (Object.keys(currentChunk).length === 0) {
        chunks.push(updatedChunk);
        // Reset current chunk
        currentChunk = {};
      } else {
        // Otherwise finalize the current chunk
        chunks.push(currentChunk);

        // Start a fresh chunk with the new key
        currentChunk = { [key]: baseTranslations[key] };
      }
    } else {
      // Accept the new key in the current chunk
      currentChunk = updatedChunk;
    }
  }

  // Push the last chunk if not empty
  if (Object.keys(currentChunk).length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Make a single call to GPT for the given chunk of key-value pairs.
 */
async function translateChunk(chunkObj, language) {
  const systemPrompt = `
You are a professional translator. Translate the following strings from English to ${language} and return only a JSON object with the same keys.

Strings:
${JSON.stringify(chunkObj, null, 2)}
`;

  const response = await client.chat.completions.create({
    model: GPT_MODEL,
    messages: [{ role: "system", content: systemPrompt.trim() }],
    response_format: { type: "json_object" },
  });

  const rawContent = response.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(rawContent);
  } catch (err) {
    console.error("Error parsing JSON from GPT response:", err);
    console.error("Raw content was:", rawContent);
    return {};
  }
}

/**
 * Main: read the base file, find missing keys in each language,
 *       chunk them, request translations chunk by chunk.
 */
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

    // Identify missing keys
    const missingKeys = baseKeys.filter(
      (k) => !Object.prototype.hasOwnProperty.call(existingTranslations, k)
    );
    if (missingKeys.length === 0) continue;

    // 1. Split missing keys into token-friendly chunks
    const chunks = chunkMissingTranslations(
      missingKeys,
      baseTranslations,
      language
    );

    console.log(
      `Language: ${language}, missing ${missingKeys.length} keys. ` +
        `Splitting into ${chunks.length} chunk(s).`
    );

    // 2. Translate each chunk
    for (let i = 0; i < chunks.length; i++) {
      console.log(`  Translating chunk ${i + 1} of ${chunks.length}`);
      const chunkObj = chunks[i];
      const chunkResult = await translateChunk(chunkObj, language);

      // 3. Merge partial results
      // pop last key from existing translations
      const [lastKey, lastValue] = Object.entries(existingTranslations).pop();
      if (lastKey) {
        delete existingTranslations[lastKey];
      }
      // merge chunk result into existing translations
      for (const [k, v] of Object.entries(chunkResult)) {
        existingTranslations[k] = v;
      }
      // put last key back on existing translations
      if (lastKey) {
        existingTranslations[lastKey] = lastValue;
      }
    }

    // 4. Save file
    fs.writeFileSync(
      filePath,
      JSON.stringify(existingTranslations, null, 2) + "\n",
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
