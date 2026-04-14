import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import PageWrapper from "../components/pagewrapper";

export const metadata = {
  title:
    "Less Noise, More Truth: Metaculus' method for clear decisions in a complex world",
  description:
    "Learn why Metaculus is one of the most accurate, well-calibrated forecasting platforms available, built on the wisdom of the crowd and a decade of demonstrated accuracy.",
};

export default async function WhyTrustMetaculusPage() {
  const t = await getTranslations();

  return (
    <PageWrapper>
      <h1>{t("whyTrustMetaculusTitle")}</h1>

      <p>{t("whyTrustMetaculusIntro1")}</p>

      <p>
        {t.rich("whyTrustMetaculusIntro2", {
          wisdomLink: (chunks) => (
            <a
              href="https://en.wikipedia.org/wiki/Wisdom_of_the_crowd"
              target="_blank"
              rel="noreferrer"
            >
              {chunks}
            </a>
          ),
          outperformLink: (chunks) => (
            <a
              href="https://arxiv.org/abs/1406.7563"
              target="_blank"
              rel="noreferrer"
            >
              {chunks}
            </a>
          ),
        })}
      </p>

      <p>
        {t.rich("whyTrustMetaculusIntro3", {
          agiLink: (chunks) => (
            <Link href="/questions/5121/date-of-general-ai/">{chunks}</Link>
          ),
          forbesLink: (chunks) => (
            <a
              href="https://www.forbes.com/sites/calumchace/2023/05/02/gpt-to-ban-or-not-to-ban-that-is-the-question/"
              target="_blank"
              rel="noreferrer"
            >
              {chunks}
            </a>
          ),
        })}
      </p>

      <Image
        src="https://cdn.metaculus.com/metaculus_ai_mentions.jpg"
        alt={t("whyTrustMetaculusAgiCitationsAlt")}
        className="my-4 h-auto w-full rounded"
        width={1200}
        height={400}
        unoptimized
      />

      <p>{t("whyTrustMetaculusIntro4")}</p>

      <h2>{t("whyTrustMetaculusAccuracyTitle")}</h2>

      <p>{t("whyTrustMetaculusAccuracy1")}</p>

      <p>
        {t.rich("whyTrustMetaculusAccuracy2", {
          acx2023Link: (chunks) => (
            <a
              href="https://www.astralcodexten.com/p/who-predicted-2023"
              target="_blank"
              rel="noreferrer"
            >
              {chunks}
            </a>
          ),
          acx2024Link: (chunks) => (
            <Link href="/tournament/ACX2024/">{chunks}</Link>
          ),
          midtermsLink: (chunks) => (
            <a
              href="https://asteriskmag.com/issues/05/prediction-markets-have-an-elections-problem-jeremiah-johnson#:~:text=The%20only%20site,FiveThirtyEight%20was%20Metaculus"
              target="_blank"
              rel="noreferrer"
            >
              {chunks}
            </a>
          ),
          covidLink: (chunks) => (
            <Link href="/notebooks/22691/a-preliminary-look-at-metaculus-and-expert-forecasts/">
              {chunks}
            </Link>
          ),
        })}
      </p>

      <p>
        {t.rich("whyTrustMetaculusAccuracy3", {
          trackRecordLink: (chunks) => (
            <Link href="/questions/track-record/">{chunks}</Link>
          ),
        })}
      </p>

      <h2>{t("whyTrustMetaculusForecastsTitle")}</h2>

      <p>
        {t.rich("whyTrustMetaculusForecasts1", {
          warLink: (chunks) => (
            <Link href="/questions/8362/us-china-war-before-2035/">
              {chunks}
            </Link>
          ),
          scoringLink: (chunks) => (
            <Link href="/help/scores-faq/#proper-scoring">{chunks}</Link>
          ),
        })}
      </p>

      <p>
        {t.rich("whyTrustMetaculusForecasts2", {
          marketsLink: (chunks) => (
            <Link href="/notebooks/38198/metaculus-and-markets-whats-the-difference/">
              {chunks}
            </Link>
          ),
          leaderboardLink: (chunks) => (
            <Link href="/leaderboard/">{chunks}</Link>
          ),
          tournamentsLink: (chunks) => (
            <Link href="/tournaments/">{chunks}</Link>
          ),
        })}
      </p>

      <h2>{t("whyTrustMetaculusLessNoiseTitle")}</h2>

      <p>
        {t.rich("whyTrustMetaculusLessNoise", {
          servicesLink: (chunks) => <Link href="/services/">{chunks}</Link>,
        })}
      </p>
    </PageWrapper>
  );
}
