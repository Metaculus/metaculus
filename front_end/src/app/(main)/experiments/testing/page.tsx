import OtherMap from "./components/other_map";

export default function OtherChartMap() {
  return (
    <main className="text-extra-label-blue-700 dark:text-extra-label-blue-700-dark mx-auto mb-24 w-full max-w-[93rem] flex-1 items-stretch px-6 sm:px-8 md:mt-4 md:px-12 lg:mt-8 lg:px-16">
      <div className="mx-auto w-full max-w-[68rem]">
        <h1>Sample of customising render output for experiment charts</h1>
        <div className="mt-4 flex w-full flex-col gap-4 rounded bg-gray-0 p-4 dark:bg-gray-0-dark md:gap-10">
          <div className="relative flex flex-col items-center gap-10">
            <OtherMap />
          </div>
        </div>
      </div>
    </main>
  );
}
