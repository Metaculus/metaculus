function ResultsHero() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-1 rounded bg-white p-4 dark:bg-blue-100-dark md:p-6 lg:w-1/2 lg:gap-2 lg:p-8 min-[1920px]:gap-3 min-[1920px]:p-12">
      <h1 className="m-0 text-balance text-center text-2xl font-bold leading-snug text-blue-600 dark:text-blue-600-dark md:text-2xl md:leading-snug lg:text-3xl lg:leading-snug min-[1920px]:text-4xl min-[1920px]:leading-normal">
        <span className="text-blue-800 dark:text-blue-800-dark">
          Bridgewater <span className="font-thin opacity-50">x</span> Metaculus
        </span>{" "}
        <br />
        Forecasting Contest 2025 <br />
        <span className="font-light text-blue-600 dark:text-blue-600-dark">
          Final Rankings
        </span>
      </h1>
    </div>
  );
}

export default ResultsHero;
