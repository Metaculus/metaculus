import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import Button from "@/components/ui/button";
import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";
import cn from "@/utils/core/cn";

import FutureEvalTable from "./future_eval_table";

const ListStarIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-gray-500 dark:text-gray-500-dark"
  >
    <g clipPath="url(#clip0_5369_16385)">
      <path
        d="M6.74824 18.7623H18.747C19.2438 18.7623 19.6477 18.3579 19.6477 17.8616C19.6477 17.3507 19.2456 16.9531 18.747 16.9531H6.74824C6.24188 16.9531 5.85352 17.3558 5.85352 17.8616C5.85352 18.3528 6.24529 18.7623 6.74824 18.7623Z"
        fill="#91999E"
      />
      <path
        d="M1.18575 19.5244L1.98107 18.9387L2.75133 19.5244C3.07348 19.7713 3.42996 19.5063 3.31025 19.1467L3.00233 18.1925L3.78209 17.6069C4.06629 17.3886 3.95094 16.9833 3.5918 16.9833H2.61967L2.29448 15.9562C2.19545 15.6426 1.76061 15.6366 1.66157 15.9562L1.3364 16.9833H0.354772C-0.00607591 16.9833 -0.129204 17.3886 0.162775 17.6069L0.952017 18.1942L0.645806 19.1467C0.526093 19.5063 0.871383 19.7539 1.18575 19.5244Z"
        fill="#91999E"
      />
      <path
        d="M6.74824 12.9107H18.747C19.2438 12.9107 19.6477 12.4985 19.6477 12.0022C19.6477 11.499 19.2456 11.1016 18.747 11.1016H6.74824C6.24188 11.1016 5.85352 11.5042 5.85352 12.0022C5.85352 12.4951 6.24529 12.9107 6.74824 12.9107Z"
        fill="#91999E"
      />
      <path
        d="M1.18575 13.6543L1.98107 13.0687L2.75133 13.6543C3.07348 13.9012 3.42996 13.6361 3.31025 13.2767L3.00233 12.3224L3.78209 11.7368C4.06629 11.5185 3.95094 11.1132 3.5918 11.1132H2.61967L2.29448 10.086C2.19545 9.77254 1.76061 9.77426 1.66157 10.086L1.3364 11.1132H0.354772C-0.00607591 11.1132 -0.129204 11.5185 0.162775 11.7368L0.952017 12.3241L0.645806 13.2767C0.526093 13.6361 0.871383 13.8838 1.18575 13.6543Z"
        fill="#91999E"
      />
      <path
        d="M6.74824 7.05129H18.747C19.2438 7.05129 19.6477 6.64696 19.6477 6.15065C19.6477 5.64138 19.2456 5.24219 18.747 5.24219H6.74824C6.24188 5.24219 5.85352 5.64481 5.85352 6.15065C5.85352 6.64352 6.24529 7.05129 6.74824 7.05129Z"
        fill="#91999E"
      />
      <path
        d="M1.18575 7.80857L1.98107 7.22297L2.75133 7.80857C3.07348 8.04767 3.42996 7.79045 3.31025 7.43096L3.00233 6.47669L3.78209 5.89109C4.06629 5.67279 3.95094 5.2614 3.5918 5.2614H2.61967L2.29448 4.24035C2.19545 3.91902 1.76061 3.92074 1.66157 4.24035L1.3364 5.2614H0.354772C-0.00607591 5.2614 -0.129204 5.67279 0.162775 5.89109L0.952017 6.48013L0.645806 7.43096C0.518314 7.79045 0.871383 8.03984 1.18575 7.80857Z"
        fill="#91999E"
      />
    </g>
    <defs>
      <clipPath id="clip0_5369_16385">
        <rect width="20" height="16" fill="white" transform="translate(0 4)" />
      </clipPath>
    </defs>
  </svg>
);

const PersonIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-gray-500 dark:text-gray-500-dark"
  >
    <g clipPath="url(#clip0_5369_16399)">
      <path
        d="M9.3203 13.7031C8.97901 13.994 8.67714 14.3092 8.41617 14.639C7.78753 14.326 7.05562 14.1415 6.28328 14.1415C3.99517 14.1415 2.05214 15.7691 2.05214 17.4775C2.05214 17.6084 2.11503 17.6677 2.24857 17.6677H7.25199C7.25382 18.1341 7.36403 18.5658 7.59979 18.9267H2.32873C1.29448 18.9267 0.779297 18.4762 0.779297 17.5909C0.779297 15.1302 3.24384 12.8864 6.28328 12.8864C7.40734 12.8864 8.45146 13.1921 9.3203 13.7031ZM9.02889 9.01645C9.02889 10.7225 7.79865 12.1078 6.28918 12.1078C4.77975 12.1078 3.5482 10.7313 3.5482 9.02861C3.5482 7.37103 4.78493 6 6.28918 6C7.80396 6 9.02889 7.35012 9.02889 9.01645ZM4.77442 9.02861C4.77442 10.0378 5.47093 10.8453 6.28918 10.8453C7.11464 10.8453 7.80985 10.0378 7.80985 9.01645C7.80985 8.03756 7.12716 7.26246 6.28918 7.26246C5.46762 7.26246 4.77442 8.04973 4.77442 9.02861Z"
        fill="#91999E"
      />
      <path
        d="M14.6268 12.0227C16.3664 12.0227 17.7739 10.446 17.7739 8.50605C17.7739 6.59025 16.3658 5.07031 14.6268 5.07031C12.8994 5.07031 11.4782 6.61457 11.4782 8.51821C11.4782 10.4521 12.8929 12.0227 14.6268 12.0227ZM14.6268 10.7415C13.6306 10.7415 12.7817 9.76941 12.7817 8.51687C12.7817 7.29727 13.6227 6.35161 14.6268 6.35161C15.6367 6.35161 16.4705 7.27903 16.4705 8.50605C16.4705 9.75458 15.636 10.7415 14.6268 10.7415ZM10.1404 18.9205H19.1117C20.3502 18.9205 20.9484 18.519 20.9484 17.6485C20.9484 15.6201 18.4852 12.8937 14.6268 12.8937C10.7611 12.8937 8.29785 15.6201 8.29785 17.6485C8.29785 18.519 8.89606 18.9205 10.1404 18.9205ZM9.90128 17.6392C9.731 17.6392 9.66226 17.5859 9.66226 17.4476C9.66226 16.3054 11.4458 14.1763 14.6268 14.1763C17.8017 14.1763 19.584 16.3054 19.584 17.4476C19.584 17.5859 19.5211 17.6392 19.3522 17.6392H9.90128Z"
        fill="#91999E"
      />
    </g>
    <defs>
      <clipPath id="clip0_5369_16399">
        <rect width="22" height="16" fill="white" transform="translate(0 4)" />
      </clipPath>
    </defs>
  </svg>
);

const TrophyIcon = () => (
  <svg
    width="22"
    height="24"
    viewBox="0 0 22 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-gray-500 dark:text-gray-500-dark"
  >
    <g clipPath="url(#clip0_5369_16409)">
      <path
        d="M0 5.09914C0 8.75287 1.76921 11.1076 5.28873 12.2177C5.74617 12.8184 6.267 13.3015 6.76928 13.6548V17.2979H5.73663C4.47289 17.2979 3.78559 18.0577 3.78559 19.2843V21.1696C3.78559 21.6415 4.14857 21.9797 4.59082 21.9797H13.0825C13.5248 21.9797 13.8878 21.6415 13.8878 21.1696V19.2843C13.8878 18.0577 13.1932 17.2979 11.9295 17.2979H10.9041V13.6622C11.4063 13.3089 11.9344 12.8184 12.3919 12.2177C15.9058 11.1002 17.6733 8.75287 17.6733 5.09914C17.6733 4.10147 17.0448 3.4824 16.024 3.4824H14.3465C14.1639 2.55675 13.4886 2 12.3919 2H5.28148C4.19359 2 3.50946 2.54939 3.32849 3.4824H1.65091C0.628516 3.4824 0 4.10147 0 5.09914ZM1.47365 5.30566C1.47365 5.16684 1.57482 5.05656 1.72012 5.05656H3.25575V6.71641C3.25575 7.96103 3.56119 9.12464 4.04176 10.1378C2.36047 9.22234 1.47365 7.60309 1.47365 5.30566ZM4.83976 6.96784V4.13666C4.83976 3.82703 5.05179 3.61296 5.35617 3.61296H12.3172C12.6216 3.61296 12.8336 3.82703 12.8336 4.13666V6.96784C12.8336 10.1372 9.98741 12.9016 8.83668 12.9016C7.68592 12.9016 4.83976 10.1372 4.83976 6.96784ZM5.36958 20.3667V19.4153C5.36958 19.1112 5.56802 18.9109 5.86693 18.9109H11.7992C12.1069 18.9109 12.3038 19.1112 12.3038 19.4153V20.3667H5.36958ZM8.28019 17.2979V14.4255C8.47775 14.4803 8.66242 14.5039 8.83668 14.5039C9.01252 14.5039 9.19557 14.4803 9.39317 14.4255V17.2979H8.28019ZM13.6332 10.1378C14.1122 9.12464 14.4176 7.96103 14.4176 6.71641V5.05656H15.9548C16.0986 5.05656 16.1997 5.16684 16.1997 5.30566C16.1997 7.60309 15.3129 9.22234 13.6332 10.1378Z"
        fill="#91999E"
      />
    </g>
    <defs>
      <clipPath id="clip0_5369_16409">
        <rect width="18" height="20" fill="white" transform="translate(0 2)" />
      </clipPath>
    </defs>
  </svg>
);

type FeatureItemProps = {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
};

const FeatureItem: FC<FeatureItemProps> = ({ icon, title, description }) => (
  <div className="flex gap-2">
    <div className="flex size-6 shrink-0 items-center justify-center">
      {icon}
    </div>
    <div className="flex flex-col gap-2">
      <p className="my-0 text-sm font-bold leading-5 text-gray-800 dark:text-gray-800-dark">
        {title}
      </p>
      <p className="my-0 text-sm font-medium leading-5 text-gray-700 dark:text-gray-700-dark">
        {description}
      </p>
    </div>
  </div>
);

const FutureEvalSection: FC<{ className?: string }> = async ({ className }) => {
  const t = await getTranslations();
  const data = await ServerLeaderboardApi.getGlobalLeaderboard(
    null,
    null,
    "manual",
    "Global Bot Leaderboard"
  );

  const hasData = data?.entries?.length > 0;
  if (!hasData) {
    return null;
  }

  return (
    <section
      className={cn(
        "flex flex-col gap-10 bg-gray-0 py-20 dark:border-gray-300-dark dark:bg-gray-0-dark",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-xl font-bold leading-7 text-gray-1000 dark:text-gray-1000-dark">
            {t("metaculusFutureEval")}
          </h2>
          <p className="m-0 text-base font-normal leading-6 text-gray-1000 dark:text-gray-1000-dark">
            {t("futureEvalDescription")}
          </p>
        </div>
        <Button
          href="/futureeval/"
          variant="secondary"
          size="md"
          className="shrink-0 whitespace-nowrap font-normal"
        >
          {t("explore")} →
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Info box - determines container height */}
        <div className="shrink rounded-lg border border-gray-300 bg-gray-100 dark:border-gray-300-dark dark:bg-gray-100-dark lg:w-[500px]">
          <div className="flex flex-col gap-8 overflow-hidden p-5 pb-8 lg:h-full lg:gap-10 lg:py-4">
            <p className="max-w-[379px] text-base font-bold leading-6 text-gray-900 dark:text-gray-900-dark">
              {t("futureEvalTagline")}
            </p>
            <div className="flex flex-col gap-8">
              <FeatureItem
                icon={<ListStarIcon />}
                title={t("modelLeaderboard")}
                description={t("modelLeaderboardDescription")}
              />
              <FeatureItem
                icon={<PersonIcon />}
                title={t("botsVsHumans")}
                description={t("botsVsHumansDescription")}
              />
              <FeatureItem
                icon={<TrophyIcon />}
                title={t("startCompeting")}
                description={
                  <>
                    {t("startCompetingDescription")}{" "}
                    <Link href="/aib/" className="underline">
                      {t("miniBench")}
                    </Link>
                    .
                  </>
                }
              />
            </div>
          </div>
        </div>

        {/* Table wrapper - stretches to match first child height, content scrolls */}
        <div className="shrink-2 min-w-0 flex-1 lg:relative">
          <FutureEvalTable
            details={data}
            className=" lg:absolute lg:inset-0 lg:overflow-y-auto"
          />
        </div>
      </div>
    </section>
  );
};

export default WithServerComponentErrorBoundary(FutureEvalSection);
