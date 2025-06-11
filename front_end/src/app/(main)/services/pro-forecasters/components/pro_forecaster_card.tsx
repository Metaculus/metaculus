import Image from "next/image";
import { FC } from "react";

import LinkedInIcon from "@/app/(main)/pro-forecasters/assets/LinkedInIcon";
import { ProForecaster } from "@/app/(main)/pro-forecasters/types";
import cn from "@/utils/core/cn";

type Props = {
  proForecaster: ProForecaster;
  className?: string;
};

const ProForecasterCard: FC<Props> = ({ proForecaster, className }) => {
  const { image, name, rawDescription, linkedInUrl } = proForecaster;
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-md bg-gray-0 p-6 dark:bg-gray-0-dark",
        className
      )}
    >
      <Image
        width={106}
        height={106}
        src={image}
        alt={name}
        className="h-[106px] w-[106px] shrink-0 rounded-full object-cover"
        quality={100}
      />
      <p className="m-0 my-3 flex items-center text-xl font-medium text-blue-800 dark:text-blue-800-dark">
        {name}
        {!!linkedInUrl && (
          <a href={linkedInUrl} className="ml-2.5">
            <LinkedInIcon />
          </a>
        )}
      </p>
      <p className="m-0 text-sm text-blue-700 dark:text-blue-700-dark">
        {rawDescription}
      </p>
    </div>
  );
};

export default ProForecasterCard;
