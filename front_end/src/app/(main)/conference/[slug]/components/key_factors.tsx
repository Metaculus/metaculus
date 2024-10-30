import { useState } from "react";

import { PostWithForecasts } from "@/types/post";

import { keyFactorsData } from "./key_factor_data";

interface KeyFactorsProps {
  questionId: PostWithForecasts;
}

const CriteriaIcon = ({ met }: { met: boolean }) => (
  <span
    className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${met ? "bg-green-500" : "bg-red-500"}`}
  >
    {met ? "✓" : "✗"}
  </span>
);

const KeyFactors = ({ questionId }: KeyFactorsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const data = keyFactorsData[questionId.id];

  if (!data) return null;

  return (
    <div
      className="mt-2 cursor-pointer rounded-lg border border-gray-200 bg-white py-2 pl-4 [text-align:left!important] dark:border-gray-700 dark:bg-gray-900"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center gap-2">
        <span className="flex items-center pt-[1px] text-xs leading-none">
          {isExpanded ? "▼" : "▶"}
        </span>
        <p className="font-semibold dark:text-white">Key Factors Analysis</p>
      </div>

      {isExpanded && (
        <div className="mt-4 dark:text-gray-300">
          <section className="mb-6">
            <h4 className="mb-2 text-lg font-medium">Results</h4>
            <div>
              <p>{data.results.mainFinding}</p>
              <p>{data.results.numeratorSize}</p>
              <p>{data.results.denominatorSize}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data.results.dateRange}
              </p>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-lg font-medium">Background Information</h4>
            <p className="text-sm leading-relaxed">{data.background}</p>
          </section>

          <section>
            <h4 className="mb-2 text-lg font-medium">Numerator</h4>
            <p className="mb-2">
              Size Found: {data.numerator.size} | Hit Definition:{" "}
              {data.numerator.definition}
            </p>

            <div className="mb-4">
              <h5 className="mb-2 font-medium">Valid Instances:</h5>
              <div className="space-y-2">
                <div className="grid grid-cols-[8rem_8rem_10rem_6rem_1fr] gap-1 text-sm">
                  <div>Date Range</div>
                  <div>Occurrence</div>
                  <div>Official Record</div>
                  <div>Impact</div>
                  <div>Name</div>
                </div>
                {data.numerator.validInstances.map((instance, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[8rem_8rem_10rem_6rem_1fr] gap-1 text-sm"
                  >
                    <div>
                      <CriteriaIcon met={instance.criteria.dateRange} />
                    </div>
                    <div>
                      <CriteriaIcon met={instance.criteria.occurrence} />
                    </div>
                    <div>
                      <CriteriaIcon met={instance.criteria.officialRecord} />
                    </div>
                    <div>
                      <CriteriaIcon met={instance.criteria.impact} />
                    </div>
                    <div>{instance.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <h4 className="mb-2 text-lg font-medium">Denominator</h4>
            <p className="mb-2">
              Size Found: {data.denominator.size} | Hit Definition:{" "}
              {data.denominator.definition}
            </p>

            {data.numerator.invalidInstances && (
              <div>
                <h5 className="mb-2 font-medium">Invalid Instances:</h5>
                <div className="space-y-2">
                  <div className="grid grid-cols-[8rem_8rem_10rem_6rem_1fr] gap-1 text-sm">
                    <div>Date Range</div>
                    <div>Occurrence</div>
                    <div>Official Record</div>
                    <div>Impact</div>
                    <div>Name</div>
                  </div>
                  {data.numerator.invalidInstances.map((instance, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[8rem_8rem_10rem_6rem_1fr] gap-1 text-sm"
                    >
                      <div>
                        <CriteriaIcon met={instance.criteria.dateRange} />
                      </div>
                      <div>
                        <CriteriaIcon met={instance.criteria.occurrence} />
                      </div>
                      <div>
                        <CriteriaIcon met={instance.criteria.officialRecord} />
                      </div>
                      <div>
                        <CriteriaIcon met={instance.criteria.impact} />
                      </div>
                      <div>{instance.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="mb-4">
              <h5 className="mb-2 font-medium">Facts:</h5>
              <ul className="ml-8 list-disc space-y-1 text-sm">
                {data.denominator.facts.map((fact, index) => (
                  <li key={index}>{fact}</li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="mb-2 font-medium">Estimation Steps:</h5>
              <ul className="ml-8 list-decimal space-y-1 text-sm">
                {data.denominator.estimationSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default KeyFactors;
