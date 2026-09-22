import { ButtonVariant } from "@/components/ui/button";
import { TranslationKey } from "@/types/translations";

export type InitiativePlacement = "hero" | "featured" | "inventory";

export type InitiativeBrand = {
  color: string;
};

export type InitiativeCategory = {
  id: string;
  labelKey: TranslationKey;
  color?: string;
};

export type InitiativesInventoryFilter = InitiativeCategory;

export type InitiativesInventoryView = "list" | "grid";

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
  taglineKey?: TranslationKey;
  inventoryNameKey?: TranslationKey;
  inventoryDescriptionKey?: TranslationKey;
  url: string;
  logo?: string;
  artwork?: string;
  brand?: InitiativeBrand;
  categoryId?: string;
  order: number;
  inventoryOrder?: number;
  placements: InitiativePlacement[];
  feature?: InitiativeFeature;
};

export type FeaturedInitiative = Initiative & {
  brand: InitiativeBrand;
  feature: InitiativeFeature;
};

export type TestimonialAccent = "blue" | "purple";

export type InitiativesTestimonial = {
  id: string;
  quoteKey: TranslationKey;
  authorKey: TranslationKey;
  roleKey: TranslationKey;
  avatar?: string;
  accent?: TestimonialAccent;
};

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

export type InitiativesProgramCta = {
  eyebrowKey: TranslationKey;
  headingKey: TranslationKey;
  descriptionKey: TranslationKey;
  pitchLabelKey: TranslationKey;
  pitchHref?: string;
};

export type InitiativesPageData = {
  hero: InitiativesHero;
  programCta: InitiativesProgramCta;
  testimonials?: InitiativesTestimonial[];
  categories?: InitiativeCategory[];
  initiatives: Initiative[];
};
