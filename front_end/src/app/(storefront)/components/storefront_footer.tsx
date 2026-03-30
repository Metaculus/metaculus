"use client";

import { faXTwitter, faDiscord } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { useModal } from "@/contexts/modal_context";

type FooterLink =
  | { href: string; labelKey: string; isModal?: false; external?: false }
  | { labelKey: string; isModal: true; href?: undefined; external?: false }
  | { href: string; labelKey: string; external: true; isModal?: false };

const FOOTER_LINKS = {
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

const FooterLinkColumn: FC<{
  title: string;
  links: readonly FooterLink[];
  onContactClick?: () => void;
}> = ({ title, links, onContactClick }) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-1.5 text-[10px] leading-3 md:gap-3 md:text-sm md:leading-4">
      <span className="text-xs font-bold leading-4 text-blue-800 md:text-sm">
        {title}
      </span>
      {links.map((link, index) => {
        if (link.isModal) {
          return (
            <button
              key={index}
              type="button"
              className="whitespace-nowrap text-left font-normal text-blue-700 no-underline hover:text-blue-800 md:font-medium"
              onClick={onContactClick}
            >
              {t(link.labelKey as Parameters<typeof t>[0])}
            </button>
          );
        }
        if (link.external) {
          return (
            <a
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap font-normal text-blue-700 no-underline hover:text-blue-800 md:font-medium"
            >
              {t(link.labelKey as Parameters<typeof t>[0])}
            </a>
          );
        }
        return (
          <Link
            key={index}
            href={link.href}
            className="whitespace-nowrap font-normal text-blue-700 no-underline hover:text-blue-800 md:font-medium"
          >
            {t(link.labelKey as Parameters<typeof t>[0])}
          </Link>
        );
      })}
    </div>
  );
};

const StorefrontFooter: FC = () => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();

  const handleContactClick = () => setCurrentModal({ type: "contactUs" });

  return (
    <footer className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 rounded-t-2xl bg-white/50 p-4 md:gap-8 md:rounded-t-3xl md:p-10">
      {/* Main content */}
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:gap-4">
        {/* Left column - Description + socials */}
        <div className="flex flex-col gap-4 lg:w-[370px] lg:gap-16">
          <div className="flex items-start justify-between lg:flex-col lg:gap-16">
            <p className="max-w-[241px] text-xs font-medium leading-4 text-blue-700 md:text-sm md:leading-5">
              {t("metaculusDescription")}
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-6">
              <a
                href="https://twitter.com/metaculus"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("metaculusOnTwitter")}
                className="text-blue-700 no-underline hover:text-blue-800"
              >
                <FontAwesomeIcon icon={faXTwitter} className="size-[18px]" />
              </a>
              <a
                href="https://discord.gg/7GEKtpnVdJ"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("metaculusOnDiscord")}
                className="text-blue-700 no-underline hover:text-blue-800"
              >
                <FontAwesomeIcon icon={faDiscord} className="size-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Right section - Link columns */}
        <div className="flex gap-[30px] md:gap-[120px]">
          <FooterLinkColumn title={t("explore")} links={FOOTER_LINKS.explore} />
          <FooterLinkColumn
            title={t("services")}
            links={FOOTER_LINKS.services}
          />
          <FooterLinkColumn
            title={t("company")}
            links={FOOTER_LINKS.company}
            onContactClick={handleContactClick}
          />
        </div>
      </div>

      {/* Bottom links */}
      <div className="flex w-full gap-8 text-xs font-medium leading-4 text-blue-700 md:text-sm">
        <Link
          href="/help/guidelines/"
          className="no-underline hover:text-blue-800"
        >
          {t("guidelines")}
        </Link>
        <Link
          href="/privacy-policy/"
          className="no-underline hover:text-blue-800"
        >
          {t("privacyPolicy")}
        </Link>
        <Link
          href="/terms-of-use/"
          className="no-underline hover:text-blue-800"
        >
          {t("termsOfUse")}
        </Link>
      </div>
    </footer>
  );
};

export default StorefrontFooter;
