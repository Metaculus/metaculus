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
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_5781_24056)">
      <path
        d="M0 11.0843C0 11.5877 0.404907 11.9986 0.892369 11.9986H19.8457C20.3344 11.9986 20.7393 11.5877 20.7393 11.0843C20.7393 10.5809 20.3344 10.1712 19.8457 10.1712H18.3537V1.71406C18.3537 0.600323 17.7544 0.0078125 16.6662 0.0078125H4.07317C3.02539 0.0078125 2.38437 0.600323 2.38437 1.71406V10.1712H0.892369C0.404907 10.1712 0 10.5809 0 11.0843ZM3.76448 10.1712V2.08196C3.76448 1.63073 3.98355 1.41286 4.42172 1.41286H16.3176C16.7545 1.41286 16.9736 1.63073 16.9736 2.08196V10.1712H3.76448Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_5781_24056">
        <rect width="21" height="12" fill="currentColor" />
      </clipPath>
    </defs>
  </svg>
);

const LanguageIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M5.65481 19.9966C6.14369 19.9966 6.50715 19.7519 7.11567 19.2059L10.1223 16.486H15.551C18.1938 16.486 19.675 14.9339 19.675 12.2703V5.30949C19.675 2.64577 18.1938 1.09375 15.551 1.09375H4.12402C1.48124 1.09375 0 2.63841 0 5.30949V12.2703C0 14.9413 1.51761 16.486 4.06869 16.486H4.54089V18.6984C4.54089 19.4913 4.94827 19.9966 5.65481 19.9966ZM6.08133 18.0198V15.4573C6.08133 14.9305 5.86052 14.7275 5.36723 14.7275H4.17303C2.51259 14.7275 1.72085 13.8645 1.72085 12.2145V5.35795C1.72085 3.70792 2.51259 2.8522 4.17303 2.8522H15.502C17.1552 2.8522 17.9542 3.70792 17.9542 5.35795V12.2145C17.9542 13.8645 17.1552 14.7275 15.502 14.7275H10.03C9.49547 14.7275 9.24165 14.8155 8.86992 15.1995L6.08133 18.0198Z"
      fill="currentColor"
    />
    <path
      d="M7.04538 12.9974C7.4359 12.9974 7.69501 12.7964 7.84029 12.2954L8.38188 10.6615H11.3026L11.8442 12.2954C11.9895 12.7891 12.2501 12.9974 12.6478 12.9974C13.1182 12.9974 13.414 12.7042 13.414 12.2522C13.414 12.0956 13.3829 11.9376 13.3016 11.6998L11.054 5.40641C10.8475 4.79752 10.4323 4.49219 9.83308 4.49219C9.24018 4.49219 8.84004 4.7943 8.63205 5.40641L6.38294 11.6998C6.3016 11.9376 6.27051 12.0956 6.27051 12.2448C6.27051 12.7042 6.56792 12.9974 7.04538 12.9974ZM8.74903 9.42129L9.79548 6.17399H9.89055L10.937 9.42129H8.74903Z"
      fill="currentColor"
    />
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
      <span className="font-bold leading-4 text-gray-500 dark:text-gray-500-dark">
        {title}
      </span>
      {links.map((link, index) => {
        if (link.isModal) {
          return (
            <button
              key={index}
              type="button"
              className="text-left font-medium leading-4 text-gray-300 no-underline hover:text-gray-200 dark:text-gray-300-dark dark:hover:text-gray-200-dark"
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
              className="font-medium leading-4 text-gray-300 no-underline hover:text-gray-200 dark:text-gray-300-dark dark:hover:text-gray-200-dark"
            >
              {t(link.labelKey as Parameters<typeof t>[0])}
            </a>
          );
        }
        return (
          <Link
            key={index}
            href={link.href}
            className="font-medium leading-4 text-gray-300 no-underline hover:text-gray-200 dark:text-gray-300-dark dark:hover:text-gray-200-dark"
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

  const selectedLanguage = user?.language || currentLocale;

  return (
    <Listbox value={selectedLanguage} onChange={updateLanguage}>
      <div className="relative">
        <ListboxButton className="flex h-10 items-center gap-2 text-nowrap rounded-lg border border-gray-300 bg-gray-900 px-3 text-sm font-medium text-gray-200 dark:border-gray-300-dark dark:bg-gray-900-dark dark:text-gray-200-dark">
          <LanguageIcon className="size-5 text-gray-200 dark:text-gray-200-dark" />
          <span>
            {APP_LANGUAGES.find((opt) => opt.locale === selectedLanguage)?.name}
          </span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className="size-3 text-gray-500 dark:text-gray-500-dark"
          />
        </ListboxButton>
        <ListboxOptions className="absolute bottom-full z-50 mb-1 w-full min-w-[160px] overflow-hidden rounded-lg border border-gray-300 bg-gray-900 py-1 shadow-lg dark:border-gray-300-dark dark:bg-gray-900-dark">
          {APP_LANGUAGES.map((language) => (
            <ListboxOption
              key={language.locale}
              value={language.locale}
              className={({ selected }) =>
                cn(
                  "cursor-pointer px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 dark:text-gray-200-dark dark:hover:bg-gray-300",
                  selected && "bg-gray-700 font-medium dark:bg-gray-300"
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
        <ListboxButton className="flex h-10 items-center gap-2 text-nowrap rounded-lg border border-gray-300 bg-gray-900 px-3 text-sm font-medium text-gray-200 dark:border-gray-300-dark dark:bg-gray-900-dark dark:text-gray-200-dark">
          <ComputerIcon className="size-5 text-gray-200 dark:text-gray-200-dark" />
          <span>{t(currentOption.labelKey as Parameters<typeof t>[0])}</span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className="size-3 text-gray-500 dark:text-gray-500-dark"
          />
        </ListboxButton>
        <ListboxOptions className="absolute bottom-full z-50 mb-1 w-full min-w-[180px] overflow-hidden rounded-lg border border-gray-300 bg-gray-900 py-1 shadow-lg dark:border-gray-300-dark dark:bg-gray-900-dark">
          {THEME_OPTIONS.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              className={({ selected }) =>
                cn(
                  "cursor-pointer text-nowrap px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 dark:text-gray-200-dark dark:hover:bg-gray-300",
                  selected && "bg-gray-700 font-medium dark:bg-gray-300"
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
    <footer className="flex w-full flex-col gap-16 bg-gray-900 px-4 py-20 text-gray-300 dark:bg-gray-900-dark dark:text-gray-300-dark lg:items-center lg:px-20">
      {/* Main content */}
      <div className="flex w-full max-w-[1352px] flex-col gap-16 lg:flex-row lg:gap-4">
        {/* Left column - Logo, description, socials, selectors */}
        <div className="flex w-full max-w-[344px] flex-col gap-8 lg:gap-16">
          {/* Logo and description */}
          <div className="flex max-w-[241px] flex-col items-start gap-3">
            <MetaculusTextLogo className="h-[24px] w-auto text-gray-300 dark:text-gray-300-dark" />
            <p className="my-0 text-sm font-medium leading-5 text-gray-300 dark:text-gray-300-dark">
              {t("publicBenefitCorporation")}
            </p>
            <p className="my-0 text-sm font-medium leading-5 text-gray-300 dark:text-gray-300-dark">
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
              className="text-gray-200 no-underline hover:text-white dark:text-gray-200-dark dark:hover:text-gray-0-dark"
            >
              <FontAwesomeIcon icon={faXTwitter} className="size-[18px]" />
            </a>
            <a
              href="https://discord.gg/7GEKtpnVdJ"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("metaculusOnDiscord")}
              className="text-gray-200 no-underline hover:text-white dark:text-gray-200-dark dark:hover:text-gray-0-dark"
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
      <div className="flex w-full max-w-[1352px] gap-8 text-sm font-medium leading-4 text-gray-300 dark:text-gray-300-dark">
        <Link
          href="/help/guidelines/"
          className="no-underline hover:text-gray-200 dark:hover:text-gray-200-dark"
        >
          {t("guidelines")}
        </Link>
        <Link
          href="/privacy-policy/"
          className="no-underline hover:text-gray-200 dark:hover:text-gray-200-dark"
        >
          {t("privacyPolicy")}
        </Link>
        <Link
          href="/terms-of-use/"
          className="no-underline hover:text-gray-200 dark:hover:text-gray-200-dark"
        >
          {t("termsOfUse")}
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
