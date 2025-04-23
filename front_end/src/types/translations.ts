import { MessageKeys } from "next-intl";

export type TranslationKey = MessageKeys<IntlMessages, keyof IntlMessages>;
