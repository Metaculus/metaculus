import { faCircleInfo, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { HighlightWithinTextarea } from "react-highlight-within-textarea";
import ReactMarkdown from "react-markdown";

//import { http } from "../../http";

// import Checkbox from "../Checkbox";

type Response = {
  id: string;
  question_title: string;
  question_id: number;
  reasoning: string;
  prediction: string;
  perplexity_research: string;
  last_cp: number | null;
  chatgpt_prompt: string;
};

function PromptDemo() {
  const [questionIds, setQuestionIds] = useState("");
  const [maxQuestions, setMaxQuestions] = useState(1);
  const [prompt, setPrompt] =
    useState(`You are a professional forecaster interviewing for a job.

Your interview question is:
{title}

Your research assistant says:
{summary_report}

Background:
{background}

Resolution criteria:
{resolution_criteria}

Fine print:
{fine_print}

Today is {today}.

You write your rationale and give your final answer as: "Probability: ZZ%", 0-100`);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleForecast = async () => {
    setIsLoading(true);
    const ids = questionIds.split(",").map((id) => id.trim());
    const totalQuestions = Math.max(Math.min(maxQuestions, 5), 1);
    const questions = [
      ...ids,
      ...Array(totalQuestions - ids.length).fill("random"),
    ].slice(0, totalQuestions);

    try {
      const results = await Promise.all(
        questions.map(async (id) => {
          const requestBody = {
            question_id:
              id === "random" || isNaN(parseInt(id, 10))
                ? "random"
                : parseInt(id, 10),
            prompt,
          };

          const result = await http.post("/gpt-forecast/", requestBody);
          const data = await result.json();
          return { id, ...data };
        })
      );
      setResponses(results);
    } catch (error) {
      alert("Error fetching forecast");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form className="flex size-full flex-col divide-x-0 divide-y divide-blue-400 rounded bg-white/75 dark:divide-blue-400-dark/50 dark:bg-black/30 lg:flex-row lg:divide-x lg:divide-y-0">
        <div className="flex w-full flex-col gap-6 p-6 lg:max-w-[300px]">
          <div className="flex w-full flex-col gap-1.5">
            <h3 className="m-0 text-base">View Question List</h3>
            <a
              href="https://www.metaculus.com/project/ai-benchmarking-warmup/"
              target="_blank"
              rel="noreferrer"
              className="text-base"
            >
              AI Benchmarking Warmup
            </a>
          </div>
          <div className="flex w-full flex-col gap-1.5">
            <label
              htmlFor="maxQuestions"
              className="m-0 text-base font-bold text-gray-800 dark:text-gray-800-dark"
            >
              Set Number of Questions to Forecast
            </label>
            <input
              className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
              type="number"
              id="maxQuestions"
              value={maxQuestions}
              onChange={(e) =>
                setMaxQuestions(
                  Math.min(Math.max(parseInt(e.target.value, 10), 1), 5)
                )
              }
            />
          </div>
          <div className="flex w-full flex-col gap-1.5">
            <label
              htmlFor="questionIds"
              className="m-0 text-base font-bold text-gray-800 dark:text-gray-800-dark"
            >
              Enter Question ID&apos;s (Optional)
            </label>
            <input
              className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
              type="text"
              id="questionIds"
              value={questionIds}
              onChange={(e) => setQuestionIds(e.target.value)}
            />
            <span className="text-xs opacity-75">
              If you leave this empty, we&apos;ll select random questions for
              you. Separate multiple ID&apos;s by commas
            </span>
          </div>
          <div className="flex w-full flex-col gap-1.5 text-base">
            <span>
              <FontAwesomeIcon
                icon={faCircleInfo}
                className="mr-2 text-lg text-blue-700 opacity-50 dark:text-blue-700-dark"
              />
              <span className="inline bg-green-500/35 dark:bg-green-700/75 dark:text-white">
                Green-highlighted text
              </span>{" "}
              sections are variables pulled directly from Metaculus questions.
              You can use all or some of them in your prompt.
            </span>
          </div>
          {/* <Checkbox checked onChange={() => {}} className="mr-3 w-full">
            <span className="ml-1.5">Enable Perplexity Research</span>
          </Checkbox>
          <div className="flex flex-col gap-0.5">
            <Checkbox checked onChange={() => {}} className="w-full">
              <span className="ml-1.5">Testing Mode</span>
            </Checkbox>
            <span className="text-xs opacity-75">
              Disable this to allow your bot to actually submit forecasts
            </span>
          </div> */}
        </div>
        <div className="flex w-full flex-col gap-4 p-6">
          <div className="flex w-full flex-col gap-5">
            <label
              htmlFor="prompt"
              className="m-0 text-base font-bold text-gray-800 dark:text-gray-800-dark"
            >
              Fine-tune Your Prompt
            </label>

            <div
              className="block min-h-[440px] w-full rounded border border-blue-400 bg-white p-3 text-base hover:border-blue-500 dark:border-blue-400-dark/50 dark:bg-blue-200-dark hover:dark:border-blue-500"
              id="prompt"
            >
              <HighlightWithinTextarea
                value={prompt}
                onChange={(e) => setPrompt(e)}
                placeholder="Placeholder"
                highlight={[
                  {
                    highlight: "{title}",
                    className:
                      "bg-green-500/35 dark:text-white dark:bg-green-700/75",
                  },
                  {
                    highlight: "{summary_report}",
                    className:
                      "bg-green-500/35 dark:text-white dark:bg-green-700/75",
                  },
                  {
                    highlight: "{background}",
                    className:
                      "bg-green-500/35 dark:text-white dark:bg-green-700/75",
                  },
                  {
                    highlight: "{resolution_criteria}",
                    className:
                      "bg-green-500/35 dark:text-white dark:bg-green-700/75",
                  },
                  {
                    highlight: "{fine_print}",
                    className:
                      "bg-green-500/35 dark:text-white dark:bg-green-700/75",
                  },
                  {
                    highlight: "{today}",
                    className:
                      "bg-green-500/35 dark:text-white dark:bg-green-700/75",
                  },
                  {
                    highlight: '"Probability: ZZ%", 0-100',
                    className:
                      "bg-green-500/35 dark:text-white dark:bg-green-700/75",
                  },
                ]}
              />
            </div>

            <button
              type="button"
              onClick={handleForecast}
              className="w-full gap-3 rounded-full border border-blue-500 bg-gray-0 px-5 py-2 text-lg font-medium leading-7 text-blue-700 no-underline hover:border-blue-600 hover:bg-blue-100 active:border-blue-600 active:bg-blue-200 disabled:border-blue-500 disabled:bg-gray-0 dark:border-blue-500-dark dark:bg-gray-0-dark dark:text-blue-700-dark dark:hover:border-blue-600-dark dark:hover:bg-blue-100-dark dark:active:border-blue-600-dark dark:active:bg-blue-200-dark disabled:dark:border-blue-500-dark disabled:dark:bg-gray-0-dark"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Forecast"}
            </button>
          </div>
        </div>
        <div className="flex max-h-min w-full flex-col gap-4 p-6 lg:max-h-[700px] lg:overflow-y-auto">
          <div className="flex w-full flex-col gap-5">
            <h3 className="m-0 text-base">Review Results</h3>
            <div className="flex flex-col gap-3">
              {isLoading ? (
                <div className="mx-auto size-full">
                  {" "}
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin self-center text-3xl text-blue-700 opacity-50 dark:text-blue-700-dark md:text-2xl lg:self-start min-[1920px]:text-5xl"
                  />
                </div>
              ) : (
                responses.length > 0 &&
                responses.map((response, index) => (
                  <div
                    key={index}
                    className="mx-auto w-full max-w-2xl rounded-md border border-gray-300 bg-gray-50 bg-purple-400/20 p-4 dark:border-gray-700 dark:bg-purple-400-dark/20"
                  >
                    <h2 className="mb-4 mt-0 text-xl font-bold text-blue-800 dark:text-blue-800-dark">
                      <a
                        className="no-underline"
                        href={`/questions/${response.question_id}/`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {response.question_title}
                      </a>
                    </h2>
                    <div className="mb-1">
                      <p>
                        <strong>Reasoning:</strong>{" "}
                        <ReactMarkdown>{response.reasoning}</ReactMarkdown>
                      </p>
                      <p>
                        <strong>Prediction:</strong> {response.prediction}
                      </p>
                      <h3 className="my-0 text-lg font-bold text-blue-800 dark:text-blue-800-dark">
                        <a
                          className="no-underline"
                          href={`/questions/${response.question_id}/`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Last Community Prediction:{" "}
                          <span className="ml-1.5 rounded-full bg-olive-600 px-2 py-1.5 text-white dark:bg-olive-600-dark dark:text-olive-100-dark">
                            {response.last_cp
                              ? (response.last_cp * 100).toFixed(0) + "%"
                              : "n/a"}
                          </span>
                        </a>
                      </h3>
                      <hr className="opacity-35" />
                      <h3 className="text-lg font-bold text-blue-800 dark:text-blue-800-dark">
                        Prompt sent to ChatGPT
                      </h3>
                      <pre>
                        <code className="whitespace-pre-wrap">
                          {response.chatgpt_prompt}
                        </code>
                      </pre>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

export default PromptDemo;
