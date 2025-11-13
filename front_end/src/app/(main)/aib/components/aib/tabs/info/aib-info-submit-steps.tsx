"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import videoThumbnail from "@/app/(main)/aib/assets/video-thumbnail.png";
import { useModal } from "@/contexts/modal_context";

const AIBInfoSubmitSteps: React.FC = () => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();

  const submitSteps = [
    t.rich("aibSubmitStep1", {
      here: (chunks) => (
        <button
          type="button"
          className="text-blue-700 underline dark:text-blue-700-dark"
          onClick={() =>
            setCurrentModal({ type: "signup", data: { forceIsBot: true } })
          }
        >
          {chunks}
        </button>
      ),
    }),
    t.rich("aibSubmitStep2", {
      instructions: (chunks) => (
        <Link
          href="/notebooks/38928/futureeval-resources-page/#want-to-join-the-ai-forecasting-benchmark"
          className="text-blue-700 underline dark:text-blue-700-dark"
          target="_blank"
          rel="noopener noreferrer"
        >
          {chunks}
        </Link>
      ),
    }),
    t("aibSubmitStep3"),
  ] as const;

  return (
    <div className="flex flex-col gap-[60px] antialiased sm:pt-5 lg:flex-row lg:items-center lg:pt-10 2xl:pt-0">
      <div className="flex flex-1 flex-col items-center gap-[26px] rounded-[13px] bg-blue-900 p-8 dark:bg-blue-900-dark md:mx-auto md:max-w-[432px] lg:mx-0 lg:max-w-none">
        <p className="m-0 mx-auto max-w-[400px] text-center text-2xl text-gray-0 dark:text-gray-0-dark">
          {t("aibSubmitLearnLine")}
        </p>

        <Link
          href="https://www.loom.com/share/fc3c1a643b984a15b510647d8f760685"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("aibSubmitWatchAria")}
        >
          <Image
            src={videoThumbnail}
            alt={t("aibSubmitVideoAlt")}
            width={468}
            unoptimized
          />
        </Link>
      </div>

      <div className="my-6 flex-1">
        <h4 className="m-0 mb-[55px] text-center text-4xl font-bold text-blue-800 dark:text-blue-800-dark">
          {t("aibSubmitHeading")}
        </h4>
        <div className="flex flex-col gap-[42px]">
          {submitSteps.map((step, index) => (
            <AIBInfoSubmitStep key={index} index={index + 1} content={step} />
          ))}
        </div>
      </div>
    </div>
  );
};

const AIBInfoSubmitStep: React.FC<{
  index: number;
  content: React.ReactNode;
}> = ({ index, content }) => {
  return (
    <div className="flex items-center gap-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500 p-[10px] text-[22.5px] text-gray-0 dark:bg-blue-500-dark dark:text-gray-0-dark">
        {index}
      </div>
      <p className="m-0 text-base text-gray-800 dark:text-gray-800-dark sm:text-2xl">
        {content}
      </p>
    </div>
  );
};

export default AIBInfoSubmitSteps;
