import { ComponentProps } from "react";

import SectionToggle from "@/components/ui/section_toggle";

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
        prediction that research has shown to be more accurate on average than
        individuals typically produce.
      </p>
      <div className="space-y-3">
        {METHODOLOGY_SECTIONS.map((section, sectionIndex) => (
          <SectionToggle
            key={sectionIndex}
            title={section.title}
            variant="primary"
            defaultOpen={sectionIndex === 0}
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
