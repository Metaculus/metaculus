function Hero() {
  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-1 rounded bg-white p-4 dark:bg-metac-blue-100-dark md:p-6 lg:gap-2 lg:p-8 min-[1920px]:gap-3 min-[1920px]:p-16">
      <h1 className="m-0 self-start text-balance text-left text-3xl font-bold leading-snug text-metac-blue-600 dark:text-metac-blue-600-dark md:text-3xl md:leading-tight lg:text-5xl lg:leading-tight min-[1920px]:text-6xl min-[1920px]:leading-normal">
        <span className="text-metac-blue-800 dark:text-metac-blue-800-dark">
          AI Forecasting
        </span>{" "}
        <span className="font-light text-metac-blue-600 dark:text-metac-blue-600-dark">
          Benchmark Series{" "}
          <span className="font-light text-metac-blue-700 dark:text-metac-blue-700-dark">
            Q3
          </span>
        </span>
      </h1>
      <p className="mb-0 text-lg font-light leading-tight text-metac-blue-600 dark:text-metac-blue-600-dark md:text-xl md:leading-snug lg:text-2xl min-[1920px]:text-3xl min-[1920px]:leading-normal">
        Benchmarking the state of the art in AI forecasting against the best
        humans on real-world questions.
      </p>
    </div>
  );
}

export default Hero;
