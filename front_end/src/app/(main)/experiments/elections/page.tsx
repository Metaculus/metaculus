import OtherMap from "./components/other_map";
import StateByForecast from "./components/state_by_forecast";

export default function ElectionsExperiment() {
  return (
    <main className="text-extra-label-blue-700 dark:text-extra-label-blue-700-dark mx-auto mb-24 w-full max-w-[93rem] flex-1 items-stretch px-6 sm:px-8 md:mt-4 md:px-12 lg:mt-8 lg:px-16">
      <div className="mx-auto w-full max-w-[68rem]">
        <div className="flex items-center justify-between gap-6 text-left">
          <div className="mb-0 mt-4 flex flex-col gap-1 sm:mb-2 md:mt-2">
            <h1 className="my-2 text-3xl tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
              2024 US{" "}
              <span className="text-blue-600 dark:text-blue-600-dark">
                Election Hub
              </span>
            </h1>
            <p className="text-base text-gray-700 dark:text-gray-700-dark">
              Explore Metaculus forecasts for the 2024 US presidential election.
            </p>
          </div>
        </div>
        <div className="mt-4 flex w-full flex-col gap-4 rounded bg-gray-0 p-4 dark:bg-gray-0-dark md:gap-10">
          <div className="relative flex flex-col items-center gap-10">
            <StateByForecast questionGroupId={18274} />
          </div>
          <div className="relative flex flex-col items-center gap-10">
            <OtherMap />
          </div>
        </div>
      </div>
    </main>
  );
}
