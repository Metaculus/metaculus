import { icon } from "@fortawesome/fontawesome-svg-core/import.macro";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import PromptDemo from "./promptDemo";

export default function DemoWrapper() {
  return (
    <div className="mx-auto flex size-full max-w-[1680px] flex-col items-center">
      <div className="flex w-full flex-col">
        <h1 className="text-center text-3xl text-blue-800 dark:text-blue-800-dark">
          <a
            href="/aib/"
            className="font-light no-underline opacity-50 hover:opacity-100"
          >
            AI Benchmarking
          </a>{" "}
          <FontAwesomeIcon
            icon={icon({ name: "chevron-right", style: "solid" })}
            className="self-center px-3 text-xl opacity-50"
          />{" "}
          <span className="whitespace-nowrap">Forecasting Demo</span>
        </h1>
        <p className="text-center text-base text-blue-800 dark:text-blue-800-dark">
          Discover how AI predicts the future by experimenting with prompts on
          Metaculus questions.
        </p>
      </div>
      {/* <div className="my-2 flex w-full max-w-3xl flex-col">
        <p className="my-0 flex w-full flex-row items-center gap-3 self-center bg-purple-400/40 px-4 py-3 text-left text-sm text-blue-800 dark:bg-purple-400-dark/40 dark:text-blue-800-dark">
          <FontAwesomeIcon
            icon={icon({ name: "info-circle", style: "light" })}
            className="self-center text-lg text-purple-700 dark:text-purple-700-dark"
          />
          <div>
            When you&apos;re ready to take your bot to the next level, check out
            the full{" "}
            <a
              href="https://www.notion.so/metaculus/Resources-for-Bot-Building-c8e900de01464882aad609687ee02342"
              target="_blank"
              rel="noreferrer"
            >
              documentation
            </a>
            .
          </div>
        </p>

        <div className="flex w-full flex-col">
          <Subsection title="Your token">
            <div className="mb-5 flex w-full flex-col items-center gap-2">
              <span className="text-center text-sm">
                This token is useful only if you&apos;re building a custom bot.
              </span>
              <div className="flex flex-row gap-2 rounded border border-blue-500 bg-blue-400 p-2 dark:border-blue-500-dark dark:bg-blue-400-dark">
                <span>{window.metacData.metaculus_token}</span>
              </div>
            </div>
          </Subsection>
          <Subsection title="Tips and Tricks">
            <div className="mb-4 flex flex-col gap-2">
              <ul className="flex w-full list-disc flex-col items-start gap-2 pl-6 text-lg">
                <li>Step 1</li>
                <li>Step 2</li>
                <li>Step 3</li>
                <li>Step 4</li>
              </ul>
            </div>
          </Subsection>
        </div>
      </div> */}
      <div className="mt-5 flex w-full flex-col gap-4">
        <PromptDemo />
      </div>
    </div>
  );
}
