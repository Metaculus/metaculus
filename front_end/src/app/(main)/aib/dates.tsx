function Dates() {
  return (
    <div className="relative flex size-full min-h-[90px] grow flex-row items-center justify-center gap-2 lg:h-auto lg:min-h-[180px]">
      <div className="relative flex size-full select-none flex-col items-center justify-center gap-1 rounded bg-blue-500/50 py-4 text-blue-800 hover:cursor-default dark:bg-blue-500-dark/50 dark:text-blue-100 dark:text-blue-800-dark md:gap-2 lg:gap-3">
        <div className="text-lg opacity-60 md:text-lg lg:text-xl min-[1920px]:text-2xl">
          START DATE
        </div>
        <div className="text-2xl md:text-4xl lg:text-6xl min-[1920px]:text-7xl">
          July 8
        </div>
      </div>
    </div>
  );
}

export default Dates;
