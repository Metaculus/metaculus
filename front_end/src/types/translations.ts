import { MessageKeys } from "next-intl";

import en from "@/../messages/en.json";

type Messages = typeof en;

export type TranslationKey = MessageKeys<Messages, keyof Messages>;
