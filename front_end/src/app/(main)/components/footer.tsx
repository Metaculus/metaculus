"use client";

import { faXTwitter, faDiscord } from "@fortawesome/free-brands-svg-icons";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { FC } from "react";

import { updateLanguagePreference } from "@/app/(main)/accounts/profile/actions";
import { APP_LANGUAGES } from "@/components/language_menu";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import useAppTheme from "@/hooks/use_app_theme";
import useMounted from "@/hooks/use_mounted";
import { AppTheme } from "@/types/theme";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import { MetaculusTextLogo } from "./MetaculusTextLogo";

const ComputerIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    width="21"
    height="12"
    viewBox="0 0 21 12"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M2.625 0C1.17525 0 0 1.175 0 2.625V7.875C0 9.325 1.17525 10.5 2.625 10.5H8.75V11.375H6.125V12H14.875V11.375H12.25V10.5H18.375C19.825 10.5 21 9.325 21 7.875V2.625C21 1.175 19.825 0 18.375 0H2.625ZM2.625 0.875H18.375C19.35 0.875 20.125 1.65 20.125 2.625V7.875C20.125 8.85 19.35 9.625 18.375 9.625H2.625C1.65 9.625 0.875 8.85 0.875 7.875V2.625C0.875 1.65 1.65 0.875 2.625 0.875Z" />
  </svg>
);

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
  resources: [
    { href: "/help/prediction-resources", labelKey: "forecastingResources" },
    { href: "/press", labelKey: "forJournalists" },
    { href: "/api", labelKey: "api" },
  ],
} as const satisfies Record<string, readonly FooterLink[]>;

const THEME_OPTIONS = [
  { value: AppTheme.System, labelKey: "settingsThemeSystemDefault" },
  { value: AppTheme.Light, labelKey: "settingsThemeLightMode" },
  { value: AppTheme.Dark, labelKey: "settingsThemeDarkMode" },
] as const satisfies readonly { value: AppTheme; labelKey: string }[];

const FooterLinkColumn: FC<{
  title: string;
  links: readonly FooterLink[];
  onContactClick?: () => void;
}> = ({ title, links, onContactClick }) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-3 text-sm">
      <span className="font-bold leading-4 text-gray-500">{title}</span>
      {links.map((link, index) => {
        if (link.isModal) {
          return (
            <button
              key={index}
              type="button"
              className="text-left font-medium leading-4 text-gray-300 no-underline hover:text-gray-200"
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
              className="font-medium leading-4 text-gray-300 no-underline hover:text-gray-200"
            >
              {t(link.labelKey as Parameters<typeof t>[0])}
            </a>
          );
        }
        return (
          <Link
            key={index}
            href={link.href}
            className="font-medium leading-4 text-gray-300 no-underline hover:text-gray-200"
          >
            {t(link.labelKey as Parameters<typeof t>[0])}
          </Link>
        );
      })}
    </div>
  );
};

const LanguageSelector: FC = () => {
  const { user } = useAuth();
  const currentLocale = useLocale();
  const router = useRouter();

  const updateLanguage = (language: string) => {
    updateLanguagePreference(language, false)
      .then(() => router.refresh())
      .catch(logError);
  };

  // Use user's language preference, fallback to current locale if not set
  const selectedLanguage = user?.language || currentLocale;

  return (
    <Listbox value={selectedLanguage} onChange={updateLanguage}>
      <div className="relative">
        <ListboxButton className="flex h-10 items-center gap-2 text-nowrap rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900">
          <span className="flex items-center text-base font-bold">
            <span className="text-blue-800">a</span>
            <span className="text-gray-400">/</span>
            <span className="text-salmon-600">文</span>
          </span>
          <span>
            {APP_LANGUAGES.find((opt) => opt.locale === selectedLanguage)?.name}
          </span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className="size-3 text-gray-500"
          />
        </ListboxButton>
        <ListboxOptions className="absolute bottom-full z-50 mb-1 w-full min-w-[160px] overflow-hidden rounded-lg border border-gray-300 bg-white py-1 shadow-lg">
          {APP_LANGUAGES.map((language) => (
            <ListboxOption
              key={language.locale}
              value={language.locale}
              className={({ selected }) =>
                cn(
                  "cursor-pointer px-3 py-2 text-sm text-gray-900 hover:bg-gray-100",
                  selected && "bg-gray-100 font-medium"
                )
              }
            >
              {language.name}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
};

const ThemeSelector: FC = () => {
  const t = useTranslations();
  const mounted = useMounted();
  const { themeChoice, setTheme } = useAppTheme();

  const currentTheme = mounted ? themeChoice : AppTheme.System;
  const currentOption =
    THEME_OPTIONS.find((opt) => opt.value === currentTheme) ?? THEME_OPTIONS[0];

  const handleThemeChange = (value: AppTheme) => {
    setTheme(value);
  };

  return (
    <Listbox value={currentTheme} onChange={handleThemeChange}>
      <div className="relative">
        <ListboxButton className="flex h-10 items-center gap-2 text-nowrap rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900">
          <ComputerIcon className="size-5 text-gray-700" />
          <span>{t(currentOption.labelKey as Parameters<typeof t>[0])}</span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className="size-3 text-gray-500"
          />
        </ListboxButton>
        <ListboxOptions className="absolute bottom-full z-50 mb-1 w-full min-w-[180px] overflow-hidden rounded-lg border border-gray-300 bg-white py-1 shadow-lg">
          {THEME_OPTIONS.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              className={({ selected }) =>
                cn(
                  "cursor-pointer text-nowrap px-3 py-2 text-sm text-gray-900 hover:bg-gray-100",
                  selected && "bg-gray-100 font-medium"
                )
              }
            >
              {t(option.labelKey as Parameters<typeof t>[0])}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
};

const Footer: FC = () => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();

  const handleContactClick = () => setCurrentModal({ type: "contactUs" });

  return (
    <footer className="flex w-full flex-col gap-16 bg-gray-900 px-4 py-20 text-gray-300 lg:items-center lg:px-20">
      {/* Main content */}
      <div className="flex w-full max-w-[1352px] flex-col gap-16 lg:flex-row lg:gap-4">
        {/* Left column - Logo, description, socials, selectors */}
        <div className="flex w-full max-w-[344px] flex-col gap-8 lg:gap-16">
          {/* Logo and description */}
          <div className="flex max-w-[241px] flex-col items-start gap-3">
            <MetaculusTextLogo className="h-[24px] w-auto text-gray-300" />
            <p className="my-0 text-sm font-medium leading-5 text-gray-300">
              {t("publicBenefitCorporation")}
            </p>
            <p className="my-0 text-sm font-medium leading-5 text-gray-300">
              {t("metaculusDescription")}
            </p>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-6">
            <a
              href="https://twitter.com/metaculus"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("metaculusOnTwitter")}
              className="text-gray-200 no-underline hover:text-white"
            >
              <FontAwesomeIcon icon={faXTwitter} className="size-[18px]" />
            </a>
            <a
              href="https://discord.gg/7GEKtpnVdJ"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("metaculusOnDiscord")}
              className="text-gray-200 no-underline hover:text-white"
            >
              <FontAwesomeIcon icon={faDiscord} className="size-6" />
            </a>
          </div>

          {/* Language and Theme selectors */}
          <div className="flex gap-4">
            <LanguageSelector />
            <ThemeSelector />
          </div>
        </div>

        {/* Right section - Link columns */}
        <div className="flex flex-col gap-7 lg:flex-row lg:gap-[120px]">
          {/* First row on mobile / all columns on desktop */}
          <div className="flex gap-6 sm:gap-[120px]">
            <FooterLinkColumn
              title={t("explore")}
              links={FOOTER_LINKS.explore}
            />
            <FooterLinkColumn
              title={t("services")}
              links={FOOTER_LINKS.services}
            />
          </div>
          {/* Second row on mobile */}
          <div className="flex gap-[122px] sm:gap-[218px] lg:gap-[120px]">
            <FooterLinkColumn
              title={t("company")}
              links={FOOTER_LINKS.company}
              onContactClick={handleContactClick}
            />
            <FooterLinkColumn
              title={t("resources")}
              links={FOOTER_LINKS.resources}
            />
          </div>
        </div>
      </div>

      {/* Bottom links */}
      <div className="flex gap-8 self-start text-sm font-medium leading-4 text-gray-300">
        <Link
          href="/help/guidelines/"
          className="no-underline hover:text-gray-200"
        >
          {t("guidelines")}
        </Link>
        <Link
          href="/privacy-policy/"
          className="no-underline hover:text-gray-200"
        >
          {t("privacyPolicy")}
        </Link>
        <Link
          href="/terms-of-use/"
          className="no-underline hover:text-gray-200"
        >
          {t("termsOfUse")}
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
