import Image from "next/image";
import { useTranslations } from "next-intl";
import { FC } from "react";

import LinkedInIcon from "../assets/LinkedInIcon";
import { PRO_FORECASTERS } from "../constants/pro_forecasters";
import { ProForecaster } from "../types";

const ProForecasterCard: FC<ProForecaster> = ({
  name,
  description,
  image,
  linkedInUrl,
}) => {
  return (
    <div className="flex gap-6">
      <Image
        src={image}
        alt={name}
        className="size-[72px] shrink-0 rounded-2xl object-cover md:size-[180px]"
      />

      <div className="-mt-1 flex flex-col gap-2">
        <h3 className="m-0 text-xl font-medium">{name}</h3>
        <p className="m-0 text-sm">{description}</p>
        {!!linkedInUrl && (
          <a href={linkedInUrl}>
            <LinkedInIcon />
          </a>
        )}
      </div>
    </div>
  );
};

const ProForecastersSection: FC = () => {
  const t = useTranslations();

  return (
    <>
      <p className="m-0">{t("meetProForecasters")}</p>

      <div className="flex flex-col gap-8 pt-3">
        {PRO_FORECASTERS.map((proForecaster) => (
          <ProForecasterCard key={proForecaster.id} {...proForecaster} />
        ))}
      </div>
    </>
  );
};

export default ProForecastersSection;
