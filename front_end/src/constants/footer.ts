export type FooterLink =
  | { href: string; labelKey: string; isModal?: false; external?: false }
  | { labelKey: string; isModal: true; href?: undefined; external?: false }
  | { href: string; labelKey: string; external: true; isModal?: false };

export const FOOTER_LINKS = {
  explore: [
    { href: "/questions", labelKey: "questions" },
    { href: "/tournaments", labelKey: "tournaments" },
    { href: "/aib", labelKey: "tournamentsForAIBots" },
    { href: "/futureeval", labelKey: "futureEval" },
  ],
  services: [
    { href: "/services#launch-a-tournament", labelKey: "launchATournament" },
    { href: "/services#private-instances", labelKey: "privateInstances" },
    { href: "/services#pro-forecasters", labelKey: "proForecasters" },
  ],
  company: [
    { href: "/about/", labelKey: "about" },
    { labelKey: "contact", isModal: true },
    {
      href: "https://apply.workable.com/metaculus",
      labelKey: "careers",
      external: true,
    },
    { href: "/faq", labelKey: "faq" },
  ],
} as const satisfies Record<string, readonly FooterLink[]>;
