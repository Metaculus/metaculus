import { TranslationKey } from "@/types/translations";

import { InitiativesTestimonial, TestimonialContent } from "../types";

export function resolveTestimonials(
  approved: InitiativesTestimonial[] | undefined,
  translate: (key: TranslationKey) => string
): TestimonialContent[] {
  return (approved ?? []).map(
    ({ id, quoteKey, authorKey, roleKey, avatar, accent }) => ({
      id,
      quote: translate(quoteKey),
      author: translate(authorKey),
      role: translate(roleKey),
      avatar,
      accent,
    })
  );
}
