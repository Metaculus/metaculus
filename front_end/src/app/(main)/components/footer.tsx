"use client";

import { faTwitter, faDiscord } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { useModal } from "@/contexts/modal_context";

const Footer: FC = () => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();

  return (
    <footer className="dark relative mx-auto my-0 flex w-full flex-wrap justify-center bg-blue-900 px-0 pb-0 pt-2 text-gray-0">
      <div className="flex min-w-72 max-w-96 flex-1 justify-evenly px-4 pb-0 pt-4">
        <ul className="mr-3">
          <li className="my-2">
            <Link className="capitalize no-underline" href="/about/">
              {t("about")}
            </Link>
          </li>
          <li className="my-2">
            <Link className="no-underline" href="/api">
              {t("api")}
            </Link>
          </li>
        </ul>
        <ul className="mr-3">
          <li className="my-2">
            <Link className="no-underline" href="/faq">
              {t("faq")}
            </Link>
          </li>
          <li className="my-2">
            <a
              className="capitalize no-underline"
              href="/help/prediction-resources"
            >
              {t("forecastingResources")}
            </a>
          </li>
          <li className="my-2">
            <Link className="capitalize no-underline" href="/press">
              {t("forJournalists")}
            </Link>
          </li>
        </ul>
        <ul className="mr-3">
          <li className="my-2">
            <button
              type="button"
              className="text-left capitalize no-underline"
              onClick={() => setCurrentModal({ type: "contactUs" })}
            >
              {t("contact")}
            </button>
          </li>
          <li className="my-2">
            <a
              className="no-underline"
              href="https://apply.workable.com/metaculus"
            >
              {t("careers")}
            </a>
          </li>
          <div className="flex flex-row gap-2">
            <li className="my-2">
              <a
                className="no-underline"
                href="https://twitter.com/metaculus"
                aria-label={t("metaculusOnTwitter")}
                target="_blank"
              >
                <FontAwesomeIcon icon={faTwitter} size="lg"></FontAwesomeIcon>
              </a>
            </li>
            <li className="my-2">
              <a
                className="no-underline"
                href="https://discord.gg/7GEKtpnVdJ"
                aria-label={t("metaculusOnDiscord")}
                target="_blank"
              >
                <FontAwesomeIcon icon={faDiscord} size="lg"></FontAwesomeIcon>
              </a>
            </li>
          </div>
        </ul>
      </div>

      <div id="newsletter-form"></div>

      <div className="w-full px-6 pb-0 pt-1 text-center text-xs text-gray-600-dark lg:w-auto lg:pt-4 lg:text-left">
        <a
          className="my-1 inline px-2 no-underline lg:block lg:px-0"
          href="/help/guidelines/"
        >
          {t("guidelines")}
        </a>
        <a
          className="my-1 inline border-l border-gray-600-dark px-2 no-underline lg:block lg:border-0 lg:px-0"
          href="/privacy-policy/"
        >
          {t("privacyPolicy")}
        </a>
        <a
          className="my-1 inline border-l border-gray-600-dark px-2 no-underline lg:block lg:border-0 lg:px-0"
          href="/terms-of-use/"
        >
          {t("termsOfUse")}
        </a>
      </div>

      <div className="mt-3 flex w-full items-center justify-around bg-gray-600-dark py-0.5 sm:py-1">
        <a
          className="relative flex h-5 w-[92px]"
          href="https://www.forbes.com/sites/erikbirkeneder/2020/06/01/do-crowdsourced-predictions-show-the-wisdom-of-humans/"
        >
          <Image
            className="object-contain px-2 invert"
            src="https://cdn.metaculus.com/static/media/Forbes.webp"
            alt="Forbes"
            fill
            sizes="(max-width: 768px) 92px, 20vw"
          />
        </a>
        <a
          className="relative flex h-5 w-[85px]"
          href="https://blogs.scientificamerican.com/observations/prediction-tools-can-save-lives-in-the-covid-19-crisis/"
        >
          <Image
            className="object-contain px-2 invert"
            src="https://cdn.metaculus.com/static/media/Scientific_American.webp"
            alt="Scientific American"
            fill
            sizes="(max-width: 768px) 85px, 20vw"
          />
        </a>
        <a
          className="relative flex h-5 w-[80px]"
          href="https://time.com/5848271/superforecasters-covid-19/"
        >
          <Image
            className="w-auto max-w-[80px] object-contain px-2 invert"
            src="https://cdn.metaculus.com/static/media/time.webp"
            alt="Time"
            fill
            sizes="(max-width: 768px) 80px, 20vw"
          />
        </a>
        <a
          className="relative flex h-5 w-[60px]"
          href="https://www.vox.com/future-perfect/2020/4/8/21210193/coronavirus-forecasting-models-predictions"
        >
          <Image
            className="w-auto max-w-[60px] object-contain px-2 invert"
            src="https://cdn.metaculus.com/static/media/vox.webp"
            alt="Vox"
            fill
            sizes="(max-width: 768px) 60px, 20vw"
          />
        </a>
        <a
          className="relative flex h-5 w-[125px]"
          href="https://news.yale.edu/2016/11/02/metaculus-prediction-website-eye-science-and-technology"
        >
          <Image
            className="w-auto max-w-[125px] object-contain px-2 invert"
            src="https://cdn.metaculus.com/static/media/yale.webp"
            alt="Yale News"
            fill
            sizes="(max-width: 768px) 125px, 20vw"
          />
        </a>
        <a
          className="relative flex h-5 w-[96px]"
          href="https://www.nature.com/news/the-power-of-prediction-markets-1.20820"
        >
          <Image
            className="w-auto max-w-[96px] object-contain px-2 invert"
            src="https://cdn.metaculus.com/static/media/nature.webp"
            alt="Nature"
            fill
            sizes="(max-width: 768px) 96px, 20vw"
          />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
