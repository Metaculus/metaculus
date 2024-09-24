import { v2 as TranslateV2 } from "@google-cloud/translate";

class TranslationApi {
  static async translate(text: string, targetLanguage: string) {
    const apiKey = process.env.GOOGLE_TRANSLATE_API;

    const translate = new TranslateV2.Translate({ key: apiKey });

    const [translation] = await translate.translate(text, targetLanguage);
    console.log("test string", translation);
  }
}

export default TranslationApi;
