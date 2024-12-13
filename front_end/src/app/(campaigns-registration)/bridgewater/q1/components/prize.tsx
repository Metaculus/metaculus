function Prize() {
  return (
    <div className="flex size-full min-h-[90px] flex-row items-center justify-center lg:h-auto lg:min-h-[180px]">
      <div className="relative z-20 flex size-full select-none flex-col items-center justify-center gap-1 rounded border-olive-700 bg-olive-500/30 py-4 text-olive-800 dark:text-olive-800-dark md:gap-2 lg:gap-3">
        <div className="text-lg opacity-60 md:text-xl lg:text-2xl min-[1920px]:text-3xl">
          PRIZE POOL
        </div>
        <div className="text-4xl md:text-6xl lg:text-7xl min-[1920px]:text-8xl">
          $25k
        </div>
      </div>
    </div>
  );
}

export default Prize;
