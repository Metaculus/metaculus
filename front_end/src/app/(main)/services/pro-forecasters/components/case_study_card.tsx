import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import PdfThumb from "@/app/(main)/services/assets/pdf-thumb.png";

import Button from "../../components/button";

const CaseStudyCard = async () => {
  const t = await getTranslations();
  return (
    <div className="mt-[120px] flex flex-col justify-center gap-x-12 rounded-2xl bg-blue-800 px-8 py-12 text-base text-blue-500 sm:px-14 sm:text-lg">
      <div className="flex flex-col gap-x-9 text-base text-blue-500 sm:text-lg md:flex-row">
        <div className="flex flex-col md:w-2/3">
          <p className="m-0 text-[20px] text-olive-500">{t("caseStudy")}</p>
          <p className="m-0 mt-5 text-2xl font-bold leading-[140%] text-blue-200 sm:text-[30px]">
            {t("proForecastersCaseStudyTitle")}
          </p>
          <p className="m-0 mt-5">{t("proForecastersCaseStudyParagraph1")}</p>
          <br />
          <p className="m-0">
            {t.rich("proForecastersCaseStudyParagraph2", {
              link: (chunks) => (
                <Link
                  className="underline"
                  href="/tournament/respiratory-outlook-24-25/"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
        <div className="mx-auto mt-12 flex w-full max-w-[285px] flex-col items-center justify-center px-0 md:mx-0 md:mt-0 lg:max-w-[365px] lg:px-10">
          <Image src={PdfThumb} alt="PDF thumbnail" className="w-[285px]" />

          <p className="m-0 mt-4 text-pretty text-center text-sm">
            {t("monthlyReportSharedWithCdc")}
          </p>
          <Button className="mt-4">{t("viewPdf")}</Button>
        </div>
      </div>
    </div>
  );
};

export default CaseStudyCard;
