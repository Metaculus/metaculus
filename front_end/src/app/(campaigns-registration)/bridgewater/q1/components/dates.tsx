import { faArrowsLeftRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Dates() {
  return (
    <div className="relative flex size-full min-h-[90px] flex-row items-center justify-center gap-2 lg:h-auto lg:min-h-[180px]">
      <div className="relative z-10 flex size-full select-none flex-col items-center justify-center gap-1 rounded rounded-r-[16px] bg-blue-500/50 py-4 text-blue-800 transition-all hover:cursor-default hover:bg-blue-500 active:bg-blue-900 active:text-white dark:bg-blue-500-dark/50 dark:text-blue-100 dark:text-blue-800-dark dark:hover:bg-blue-500-dark dark:active:bg-blue-100 dark:active:text-blue-900 md:gap-2 md:rounded-r-[24px] lg:gap-3 xl:rounded-r-[44px]">
        <div className="text-lg opacity-60 md:text-xl lg:text-2xl min-[1920px]:text-3xl">
          APR
        </div>
        <div className="text-4xl md:text-6xl lg:text-7xl min-[1920px]:text-8xl">
          16
        </div>
      </div>
      <div className="relative z-10 flex size-full select-none flex-col items-center justify-center gap-1 rounded rounded-l-[16px] bg-blue-500/50 py-4 text-blue-800 transition-all  hover:cursor-default hover:bg-blue-500 active:bg-blue-900 active:text-white dark:bg-blue-500-dark/50 dark:text-blue-100 dark:text-blue-800-dark dark:hover:bg-blue-500-dark dark:active:bg-blue-100 dark:active:text-blue-900 md:gap-2 md:rounded-l-[24px] lg:gap-3 xl:rounded-l-[44px]">
        <div className="text-lg opacity-60 md:text-xl lg:text-2xl min-[1920px]:text-3xl">
          MAY
        </div>
        <div className="text-4xl md:text-6xl lg:text-7xl min-[1920px]:text-8xl">
          21
        </div>
      </div>
      <span className="absolute left-1/2 z-[11] ml-[-14px] flex size-[28px] rounded-full bg-blue-300 dark:bg-blue-100-dark md:ml-[-16px] md:size-[32px] xl:ml-[-22px] xl:size-[44px]">
        <FontAwesomeIcon
          icon={faArrowsLeftRight}
          size="xl"
          className="mx-auto self-center text-blue-600 dark:text-blue-600-dark/75"
        />
      </span>
    </div>
  );
}

export default Dates;
