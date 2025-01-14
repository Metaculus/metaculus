import { v2 as TranslateV2 } from "@google-cloud/translate";

class TranslationApi {
  static async translate(text: string, targetLanguage: string) {
    const apiKey = process.env.GOOGLE_TRANSLATE_API;

    const translate = new TranslateV2.Translate({ key: apiKey });

    await translate.translate(text, targetLanguage);
  }
}

export default TranslationApi;
