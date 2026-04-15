import { ComponentProps } from "react";

import SectionToggle from "@/components/ui/section_toggle";

import { QuestionLoader } from "../components/question_cards/question";
import { SectionCard, SectionHeader } from "../components/section";
import { METHODOLOGY_SECTIONS } from "../data";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-gray-300 border-opacity-50 pb-5 last:border-0 last:pb-0 dark:border-gray-300-dark dark:border-opacity-50">
      <h4 className="mb-2 mt-0 text-base font-medium text-gray-800 dark:text-gray-800-dark md:text-lg">
        {question}
      </h4>
      <p className="my-0 text-sm text-gray-700 dark:text-gray-700-dark md:text-base">
        {answer}
      </p>
    </div>
  );
}

export function MethodologySection({ ...props }: ComponentProps<"section">) {
  return (
    <SectionCard {...props}>
      <SectionHeader>Methodology</SectionHeader>
      <p className="mb-8 text-base text-blue-700 dark:text-blue-700-dark md:text-lg">
        The forecasts presented on this page were designed to address key
        uncertainties about the future impact of artificial intelligence on
        labor and education in the United States. The forecasts themselves are
        produced by aggregating many individual forecasts together to produce a
        prediction that{" "}
        <a
          href="http://jasondana.net/docs/2014%20Davis%20Stober%20et%20al.pdf"
          target="_blank"
          rel="noreferrer"
        >
          research
        </a>{" "}
        has shown to be{" "}
        <a
          href="https://www.metaculus.com/questions/track-record/"
          target="_blank"
          rel="noreferrer"
        >
          more accurate
        </a>{" "}
        on average than individuals typically produce. Metaculus{" "}
        <a
          href="https://www.metaculus.com/pro-forecasters/"
          target="_blank"
          rel="noreferrer"
        >
          Pro Forecasters
        </a>{" "}
        were also specifically engaged to share forecasts and in-depth
        reasoning.
      </p>
      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 print:grid-cols-2">
        {/** 
        <TableCompact
          HeadingSection={
            <h3 className="mb-4 mt-0 w-full pr-8 text-base font-[450] leading-tight text-gray-800 [text-wrap:pretty] dark:text-gray-800-dark">
              Conditional on an active recession during the following years,
              what will overall employment be?
            </h3>
          }
          className=""
        >
          <TableCompactHead>
            <TableCompactRow>
              <TableCompactHeaderCell className="w-[40%]">
                Scenario
              </TableCompactHeaderCell>
              <TableCompactHeaderCell className="w-[20%] text-right">
                2030
              </TableCompactHeaderCell>
              <TableCompactHeaderCell className="w-[20%] text-right">
                2035
              </TableCompactHeaderCell>
            </TableCompactRow>
          </TableCompactHead>
          <TableCompactBody>
            {[
              ["with recession", 3.4, 6.4],
              ["without recession", -1.4, 5.4],
            ].map((row, index) => (
              <TableCompactRow key={row[0]}>
                <TableCompactCell className={index === 0 ? "font-medium" : ""}>
                  {row[0]}
                </TableCompactCell>
                <TableCompactCell className="text-right">
                  <PercentageChange value={Number(row[1])} />
                </TableCompactCell>
                <TableCompactCell className="text-right">
                  <PercentageChange value={Number(row[2])} />
                </TableCompactCell>
              </TableCompactRow>
            ))}
          </TableCompactBody>
        </TableCompact>
        <TableCompact
          HeadingSection={
            <h3 className="mb-4 mt-0 w-full pr-8 text-base font-[450] leading-tight text-gray-800 [text-wrap:pretty] dark:text-gray-800-dark">
              Conditional on AI stagnation what will employment be in the
              following years?
            </h3>
          }
          className=""
        >
          <TableCompactHead>
            <TableCompactRow>
              <TableCompactHeaderCell className="w-[40%]">
                Scenario
              </TableCompactHeaderCell>
              <TableCompactHeaderCell className="w-[20%] text-right">
                2030
              </TableCompactHeaderCell>
              <TableCompactHeaderCell className="w-[20%] text-right">
                2035
              </TableCompactHeaderCell>
            </TableCompactRow>
          </TableCompactHead>
          <TableCompactBody>
            {[
              ["with AI stagnation", 3.4, 6.4],
              ["without AI stagnation", -1.4, 5.4],
            ].map((row, index) => (
              <TableCompactRow key={row[0]}>
                <TableCompactCell className={index === 0 ? "font-medium" : ""}>
                  {row[0]}
                </TableCompactCell>
                <TableCompactCell className="text-right">
                  <PercentageChange value={Number(row[1])} />
                </TableCompactCell>
                <TableCompactCell className="text-right">
                  <PercentageChange value={Number(row[2])} />
                </TableCompactCell>
              </TableCompactRow>
            ))}
          </TableCompactBody>
        </TableCompact>
        */}
        <QuestionLoader questionId={43025} />
        <QuestionLoader questionId={43028} />
      </div>
      <div className="space-y-3">
        {METHODOLOGY_SECTIONS.map((section, sectionIndex) => (
          <SectionToggle
            key={sectionIndex}
            title={section.title}
            variant="primary"
            hiddenUntilFound
          >
            <div className="space-y-5 bg-gray-0 p-5 dark:bg-gray-0-dark">
              {section.faqs.map((faq, faqIndex) => (
                <FAQItem
                  key={faqIndex}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </SectionToggle>
        ))}
      </div>
    </SectionCard>
  );
}
