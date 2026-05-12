import { TopChrome } from "@/app/(main)/components/top_chrome";
import {
  FlowHeaderBrand,
  FlowHeaderRoot,
  FlowHeaderTitle,
} from "@/components/flow/flow_header";

import LoadingHeaderActions from "./loading_header_actions";

export default function Loading() {
  return (
    <>
      <TopChrome
        defaultHeader={
          <FlowHeaderRoot title="">
            <FlowHeaderBrand>
              <h1 className="mx-3 my-0 inline-flex h-full max-w-60 flex-shrink-0 flex-grow-0 basis-auto flex-col justify-center text-center font-league-gothic text-[28px] font-light tracking-widest !text-gray-0 no-underline antialiased lg:bg-blue-800 lg:dark:bg-gray-0-dark">
                <span className="inline">M</span>
              </h1>
            </FlowHeaderBrand>

            <FlowHeaderTitle />

            <LoadingHeaderActions />
          </FlowHeaderRoot>
        }
      />
      <div className="mx-auto flex min-h-screen max-w-3xl flex-grow flex-col pt-header">
        <div className="animate-pulse">
          {/* Progress section skeleton */}
          <div className="mb-6 flex items-center gap-2 bg-gray-0 p-4 shadow-md dark:bg-gray-0-dark">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Post skeleton */}
          <div className="rounded-lg bg-gray-0 p-4 shadow-md dark:bg-gray-0-dark">
            <div className="mb-4 h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mb-4 h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mb-4 h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-12 w-full rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </>
  );
}
