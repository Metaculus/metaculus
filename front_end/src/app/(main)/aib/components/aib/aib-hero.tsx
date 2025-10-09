const AIBHero: React.FC = () => {
  return (
    <>
      <h1 className="m-0 text-center text-[32px] leading-[116%] text-blue-800 dark:text-blue-800-dark sm:text-[44px] lg:text-left lg:text-5xl">
        Metaculus{" "}
        <span className="text-blue-600 dark:text-blue-600-dark">
          FutureEval
        </span>
      </h1>
      <p className="m-0 mt-4 text-center text-[14px] leading-[20px] text-blue-700 dark:text-blue-700-dark sm:text-[18px] sm:leading-[28px] lg:text-left lg:text-[20px]">
        Measuring the accuracy of <br className="sm:hidden" /> forecasting AIs.
      </p>
    </>
  );
};

export default AIBHero;
