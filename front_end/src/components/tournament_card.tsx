import { faCalendar } from "@fortawesome/free-regular-svg-icons";
import { faAward } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isAfter } from "date-fns";
import { isNil } from "lodash";
import Image from "next/image";
import Link, { LinkProps } from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import tournamentPlaceholder from "@/app/assets/images/tournament.png";
import { formatDate } from "@/utils/date_formatters";

type Props = {
  href: LinkProps["href"];
  headerImageSrc: string;
  name: string;
  questionsCount: number;
  closeDate?: string;
  showCloseDate: boolean;
  isPrivate?: boolean;
  prizePool?: string | null;
  withCount?: boolean;
};

const TournamentCard: FC<Props> = ({
  href,
  headerImageSrc,
  name,
  prizePool,
  questionsCount,
  closeDate,
  isPrivate,
  showCloseDate,
  withCount = true,
}) => {
  const t = useTranslations();
  const locale = useLocale();

  function closeDateFormatter(date: Date) {
    const now = new Date();
    const formattedDate = formatDate(locale, date);

    if (isAfter(now, date)) {
      return t.rich("closedOn", {
        strong: () => (
          <strong className="whitespace-nowrap">{formattedDate}</strong>
        ),
      });
    }

    return t.rich("closesOn", {
      strong: () => (
        <strong className="whitespace-nowrap">{formattedDate}</strong>
      ),
    });
  }

  return (
    <Link
      href={href}
      className="flex flex-col overflow-hidden rounded-md bg-gray-0 text-sm font-medium text-gray-700 no-underline hover:shadow-lg active:shadow-md dark:bg-gray-0-dark dark:text-gray-700-dark"
    >
      <div className="relative h-40 w-full bg-cover bg-center">
        <Image
          src={tournamentPlaceholder}
          className="absolute h-full w-full"
          alt=""
          placeholder={"blur"}
          quality={100}
        />
        {!!headerImageSrc && (
          <Image
            src={headerImageSrc}
            alt=""
            fill
            className="size-full object-cover object-center"
            sizes="(max-width: 768px) 200vw, 100vw"
            quality={100}
          />
        )}

        {isPrivate && (
          <strong className="absolute bottom-2 right-2 rounded-sm bg-blue-300 px-1 text-sm uppercase text-gray-900 dark:bg-blue-300-dark dark:text-gray-900-dark">
            {t("private")}
          </strong>
        )}
      </div>
      <div className="flex flex-1 flex-col whitespace-break-spaces p-6">
        <h3 className="m-0 flex-1">{name}</h3>
        {!!prizePool && Number(prizePool) > 0 && (
          <div className="mt-2 text-green-800 dark:text-green-800-dark">
            <FontAwesomeIcon
              icon={faAward}
              className="ml-1 mr-2 align-middle"
              transform={{ size: 18 }}
            />
            <span className="align-middle">
              <strong>${Number(prizePool).toLocaleString(locale)}</strong>
              <span className="whitespace-nowrap"> {t("prizePool")}</span>
            </span>
          </div>
        )}
        {!!showCloseDate && !isNil(closeDate) && (
          <div className="mt-2">
            <FontAwesomeIcon
              icon={faCalendar}
              className="ml-1 mr-2 align-middle"
            />
            <span className="align-middle" suppressHydrationWarning>
              {closeDateFormatter(new Date(closeDate))}
            </span>
          </div>
        )}
      </div>
      {withCount && questionsCount > 0 && (
        <div className="flex flex-col whitespace-break-spaces border-t border-blue-200 px-6 py-3 dark:border-blue-200-dark">
          <strong>{t("questionCount", { count: questionsCount })}</strong>
        </div>
      )}
    </Link>
  );
};

export default TournamentCard;
