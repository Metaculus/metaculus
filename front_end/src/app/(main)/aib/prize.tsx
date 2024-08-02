function Prize() {
  return (
    <div className="flex size-full min-h-[90px] grow flex-row items-center justify-center lg:h-auto lg:min-h-[180px]">
      <div className="relative z-20 flex size-full select-none flex-col items-center justify-center gap-1 rounded border-metac-olive-700 bg-metac-olive-500/50 py-4 text-metac-olive-800 dark:bg-metac-olive-500/30 dark:text-metac-olive-900-dark md:gap-2 lg:gap-3">
        <div className="text-lg opacity-60 md:text-lg lg:text-xl min-[1920px]:text-2xl">
          PRIZE POOL
        </div>
        <div className="text-2xl md:text-4xl lg:text-6xl min-[1920px]:text-7xl">
          $30,000
        </div>
      </div>
    </div>
  );
}

export default Prize;
