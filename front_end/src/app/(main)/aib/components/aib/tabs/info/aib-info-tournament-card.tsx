"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Props = {
  title: string;
  href: string;
  imgUrl: string;
  prize: string;
  isLive?: boolean;
};

const AIBInfoTournamentCard: React.FC<Props> = ({
  title,
  href,
  imgUrl,
  prize,
  isLive,
}) => {
  const t = useTranslations();

  return (
    <Link href={href} className="block no-underline focus:outline-none">
      <h5 className="m-0 mb-[18px] text-center text-[16px] font-medium text-blue-800 dark:text-blue-800-dark">
        {title}
      </h5>

      <div className="relative h-[120px] w-[120px] overflow-hidden rounded-[10px] md:h-[210px] md:w-[210px]">
        <Image
          src={imgUrl}
          alt={title}
          fill
          className="object-cover"
          priority={false}
          unoptimized
        />

        {isLive ? (
          <div className="absolute left-2.5 right-2.5 top-2 flex items-center justify-center text-sm md:top-2.5 md:justify-between">
            <span
              className="hidden rounded-[4px] px-1 py-0.5 font-bold text-olive-400 dark:text-olive-400-dark md:inline-block"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.40)" }}
            >
              {prize}
            </span>
            <div
              className="flex items-center gap-[7px] rounded-[4px] px-1 py-0.5 font-medium text-salmon-400 dark:text-salmon-400-dark"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.40)" }}
              aria-label={t("aibLive")}
              title={t("aibLive")}
            >
              <span className="h-[6px] w-[6px] rounded-full bg-salmon-400 dark:bg-salmon-400-dark" />
              {t("aibLive")}
            </div>
          </div>
        ) : (
          <div className="absolute left-0 right-0 top-2.5 hidden justify-center md:flex">
            <p
              className="m-0 rounded-[4px] px-1 py-0.5 text-gray-0/80 dark:text-gray-0-dark/80"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.14)" }}
            >
              <span className="font-bold">{prize}</span> {t("aibInPrizes")}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
};

export default AIBInfoTournamentCard;
