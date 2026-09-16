import { ButtonVariant } from "@/components/ui/button";
import { TranslationKey } from "@/types/translations";

export type InitiativePlacement = "hero" | "featured" | "inventory";

export type InitiativeBrand = {
  color: string;
};

export type InitiativePartner = {
  logo: string;
  nameKey: TranslationKey;
  url?: string;
};

export type InitiativeFeature = {
  order: number;
  headingKey: TranslationKey;
  descriptionKey: TranslationKey;
  badgeKey?: TranslationKey;
  partners?: InitiativePartner[];
};

export type Initiative = {
  id: string;
  nameKey: TranslationKey;
  taglineKey: TranslationKey;
  url: string;
  logo?: string;
  artwork?: string;
  brand: InitiativeBrand;
  categoryId?: string;
  order: number;
  placements: InitiativePlacement[];
  feature?: InitiativeFeature;
};

export type FeaturedInitiative = Initiative & { feature: InitiativeFeature };

export type InitiativesHeroAction = {
  id: string;
  labelKey: TranslationKey;
  href: string;
  variant: ButtonVariant;
};

export type InitiativesHero = {
  eyebrowKey: TranslationKey;
  headingKey: TranslationKey;
  descriptionKey: TranslationKey;
  initialInitiativeId?: string;
  actions: InitiativesHeroAction[];
};

export type InitiativesPageData = {
  hero: InitiativesHero;
  initiatives: Initiative[];
};
