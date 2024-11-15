import Image from "next/image";
import { getTranslations } from "next-intl/server";

import CurveButton from "../components/curve_button";

export default async function TheCurve() {
  const t = await getTranslations();
  return (
    <main className="flex flex-grow items-center justify-center bg-gradient-to-b from-blue-100 from-20% to-blue-200 to-50% dark:from-blue-100-dark dark:to-blue-200-dark">
      <div className="flex flex-col items-center justify-center">
        <div className="flex w-full items-center justify-center">
          <h1 className="m-0 flex h-[58px] w-[58px] items-center justify-center bg-blue-900 font-league-gothic font-light tracking-widest !text-gray-0 antialiased dark:bg-gray-0-dark">
            <span className="text-[40px]">M</span>
          </h1>
          <Image
            className="mx-[18px] dark:brightness-[0.8] dark:invert-[1]"
            src={"/images/x_mark.svg"}
            alt=""
            width={23}
            height={23}
          />
          <p className="m-0 text-4xl font-bold text-blue-900 dark:text-blue-900-dark">
            TheCurve
          </p>
        </div>
        <h2 className="m-0 mt-9 text-3xl font-medium">
          {t("reciprocalSurvey")}
        </h2>
        <p className="dark:gray-800-dark m-0 mt-7 text-xl text-gray-800 dark:text-gray-800-dark">
          {t("curveIntroduction")}
        </p>

        <CurveButton questionNumber={12} forecastedNumber={0} />
      </div>
    </main>
  );
}
