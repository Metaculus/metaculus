import { ComponentProps } from "react";

import SectionToggle from "@/components/ui/section_toggle";

import {
  ContentParagraph,
  SectionCard,
  SectionHeader,
} from "../components/section";
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
      <ContentParagraph className="mb-8 mt-4">
        The forecasts presented on this page were designed to address key
        uncertainties about the future impact of artificial intelligence on
        labor in the United States. They are produced by aggregating many
        individual forecasts into a prediction that{" "}
        <a
          href="https://arxiv.org/abs/1406.7563"
          target="_blank"
          rel="noreferrer"
        >
          research has shown
        </a>{" "}
        to be more accurate on average than individuals typically produce. The
        sections below provide more details about how the information above was
        produced.
      </ContentParagraph>
      <div className="space-y-3">
        <SectionToggle
          key="ack"
          title="Acknowledgments"
          variant="primary"
          hiddenUntilFound
        >
          <div className="px-4 text-gray-800 dark:text-gray-800-dark">
            <p>
              We thank the following individuals for their thoughtful input on
              the Labor Automation Forecasting Hub:{" "}
            </p>
            <ul className="list-inside list-disc pl-3 text-sm">
              <li>Jeremy Avins (Arnold Ventures)</li>
              <li>
                Frank Britt (Valor Equity Partners and Schultz Family
                Foundation)
              </li>
              <li>Brennan Brown (Charles Koch Foundation)</li>
              <li>Bharat Chandar (Stanford Digital Economy Lab)</li>
              <li>Jared Chung (Career Village)</li>
              <li>Tom Cunningham (METR)</li>
              <li>David Daigler (Maine Community College System)</li>
              <li>
                Christian Edlagan (Washington Center for Equitable Growth)
              </li>
              <li>Stuart Elliott (OECD)</li>
              <li>John Garcia III (StriveTogether)</li>
              <li>Andrea Glorioso (European Commission)</li>
              <li>Dan Goldenberg (Call of Duty Endowment)</li>
              <li>Steve Lee (SkillUp)</li>
              <li>Adam Leonard (Data for Prosperity)</li>
              <li>Chauncy Lennon (Lumina Foundation)</li>
              <li>Gad Levanon (Burning Glass Institute)</li>
              <li>
                Cass Madison (Center for Civic Futures / Renaissance
                Philanthropy)
              </li>
              <li>Sam Manning (GovAI)</li>
              <li>Kerry McKittrick (The Project on Workforce at Harvard)</li>
              <li>Michael Meotti (Washington Student Achievement Council)</li>
              <li>Cheryl Oldham (Bipartisan Policy Center)</li>
              <li>Brent Orrell (American Enterprise Institute)</li>
              <li>Sneha Revanur (Encode AI)</li>
              <li>Philipp Schmitt (Axim Collaborative)</li>
              <li>Dane Stangler (Bipartisan Policy Center)</li>
              <li>Shayna Strom (Washington Center for Equitable Growth)</li>
              <li>Elizabeth Texiera (Britebound)</li>
              <li>Julia Trujillo (Maine Community College System)</li>
              <li>Matt Tully (Gates Ventures)</li>
              <li>Teresa Kroeger (Urban Institute)</li>
              <li>Matt Zieger (GitLab Foundation)</li>
            </ul>
            <p className="italic">
              This acknowledgement does not imply agreement with or endorsement
              of the predictions and content presented.
            </p>
          </div>
        </SectionToggle>
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
