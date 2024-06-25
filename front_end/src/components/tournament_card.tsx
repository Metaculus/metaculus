import { faCalendar } from "@fortawesome/free-regular-svg-icons";
import { faAward } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link, { LinkProps } from "next/link";
import { useTranslations } from "next-intl";
import { FC, ReactElement, ReactNodeArray } from "react";

import tournamentPlaceholder from "@/app/assets/images/tournament.webp";

type Props = {
  href: LinkProps["href"];
  headerImageSrc: string;
  name: string;
  questionsCount: number;
  closeDate: string;
  closeDateFormatter?: (date: Date) => string | ReactElement | ReactNodeArray;
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
  closeDateFormatter,
  withCount = true,
}) => {
  const t = useTranslations();

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
        />
        {!!headerImageSrc && (
          <Image
            src={headerImageSrc}
            alt=""
            fill
            className="size-full object-cover object-center"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col whitespace-break-spaces p-6">
        <h3 className="m-0 flex-1">{name}</h3>
        {!!prizePool && (
          <div className="mt-2 text-green-800 dark:text-green-800-dark">
            <FontAwesomeIcon
              icon={faAward}
              className="ml-1 mr-2 align-middle"
              transform={{ size: 18 }}
            />
            <span className="align-middle">
              <strong>${Number(prizePool).toLocaleString()}</strong>
              <span className="whitespace-nowrap"> {t("prizePool")}</span>
            </span>
          </div>
        )}
        {!!closeDateFormatter && (
          <div className="mt-2">
            <FontAwesomeIcon
              icon={faCalendar}
              className="ml-1 mr-2 align-middle"
            />
            <span className="align-middle">
              {closeDateFormatter(new Date(closeDate))}
            </span>
          </div>
        )}
      </div>
      {withCount && (
        <div className="flex flex-col whitespace-break-spaces border-t border-blue-200 px-6 py-3 dark:border-blue-200-dark">
          <strong>{t("questionCount", { count: questionsCount })}</strong>
        </div>
      )}
    </Link>
  );
};

export default TournamentCard;
