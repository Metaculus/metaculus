import { ComponentProps } from "react";

import {
  SectionCard,
  SectionHeader,
  ContentParagraph,
} from "../components/section";
import {
  TableCompact,
  TableCompactHead,
  TableCompactRow,
  TableCompactHeaderCell,
  TableCompactBody,
  TableCompactCell,
  PercentageChange,
} from "../components/table-compact";

export function ResearchSection({
  children,
  ...props
}: ComponentProps<"section">) {
  return (
    <SectionCard {...props}>
      <SectionHeader>
        How does this build on or differ from existing research?
      </SectionHeader>

      <div className="my-4">{children}</div>
      <ContentParagraph>
        A number of recent research publications have identified occupations,
        tasks, and industries that are more vulnerable to automation, as well as
        assessing recent trends in employment to understand the impact of AI.
        Recent work from Stanford University has asserted that AI has already
        had an impact on early career work, while other sources do not yet see
        strong signals. The forecasts here extend this work out to the future,
        eliciting predictions on forecasts by industry. In many cases the
        forecasts agree with classifications from the OECD and other sources of
        exposure to automation, with some key differences.
      </ContentParagraph>
      <ContentParagraph>
        Teachers have high vulnerability ratings, but are predicted to see
        growth as forecasters expect human presence will be strongly desired in
        classrooms by schools and parents, even if schools do increasingly adopt
        AI-powered educational tools. Conversely, occupations such as janitors
        and warehouse workers are rated as low exposure due to the high physical
        nature of the work, but forecasters anticipate that robotic capabilities
        will begin to displace more of these roles by 2035. These forecasts
        provide important context to our understanding of workforce prospects by
        quantifying the predicted impact of AI on employment levels.
      </ContentParagraph>
      <TableCompact
        className="inverted mt-6"
        HeadingSection={
          <div className="mb-4 text-center text-sm font-normal leading-5 text-blue-700 dark:text-blue-400">
            Metaculus Predicted Employment Change
          </div>
        }
      >
        <TableCompactHead>
          <TableCompactRow>
            <TableCompactHeaderCell className="w-[40%]">
              Occupation
            </TableCompactHeaderCell>
            <TableCompactHeaderCell className="w-[20%] text-right">
              2030
            </TableCompactHeaderCell>
            <TableCompactHeaderCell className="w-[20%] text-right">
              2035
            </TableCompactHeaderCell>
            <TableCompactHeaderCell className="w-[20%] text-right">
              AI Vulnerability Rating
            </TableCompactHeaderCell>
          </TableCompactRow>
        </TableCompactHead>
        <TableCompactBody>
          {[
            {
              occupation: "Construction Workers",
              change2030: 11.2,
              change2035: 17.2,
              vulnerabilityRating: -1.218,
            },
            {
              occupation: "Registered Nurses",
              change2030: 8.4,
              change2035: 14.4,
              vulnerabilityRating: -0.211,
            },
            {
              occupation: "Physicians",
              change2030: 5.6,
              change2035: 14.1,
              vulnerabilityRating: -0.403,
            },
            {
              occupation: "General Managers",
              change2030: 3.4,
              change2035: 3.4,
              vulnerabilityRating: -0.024,
            },
            {
              occupation: "Law Enforcement",
              change2030: 2.0,
              change2035: 3.0,
              vulnerabilityRating: -0.403,
            },
            {
              occupation: "Janitors and Cleaners",
              change2030: 0.0,
              change2035: -6.0,
              vulnerabilityRating: 0.954,
            },
            {
              occupation: "Restaurant Servers",
              change2030: -1.6,
              change2035: -6.4,
              vulnerabilityRating: -0.403,
            },
            {
              occupation: "Warehouse Workers",
              change2030: -3.3,
              change2035: -6.6,
              vulnerabilityRating: 0.654,
            },
            {
              occupation: "Engineers",
              change2030: -4.2,
              change2035: -7.6,
              vulnerabilityRating: 0.488,
            },
            {
              occupation: "Designers",
              change2030: -5.6,
              change2035: -8.8,
              vulnerabilityRating: -0.403,
            },
            {
              occupation: "Services Sales Representatives",
              change2030: -8.6,
              change2035: -15.6,
              vulnerabilityRating: 1.954,
            },
            {
              occupation: "Financial Specialists",
              change2030: -18.6,
              change2035: -32.6,
              vulnerabilityRating: 1.954,
            },
            {
              occupation: "Lawyers",
              change2030: -28.6,
              change2035: -38.6,
              vulnerabilityRating: 0.488,
            },
            {
              occupation: "Software Developers",
              change2030: -38.6,
              change2035: -78.6,
              vulnerabilityRating: 0.954,
            },
          ].map((row) => (
            <TableCompactRow key={row.occupation}>
              <TableCompactCell className="font-medium">
                {row.occupation}
              </TableCompactCell>
              <TableCompactCell className="text-right">
                <PercentageChange value={row.change2030} />
              </TableCompactCell>
              <TableCompactCell className="text-right">
                <PercentageChange value={row.change2035} />
              </TableCompactCell>
              <TableCompactCell className="text-right">
                <span
                  className={
                    row.vulnerabilityRating >= 0
                      ? "text-salmon-700 dark:text-salmon-400"
                      : "text-mint-800 dark:text-mint-300"
                  }
                >
                  {row.vulnerabilityRating > 0 ? "+" : ""}
                  {row.vulnerabilityRating}
                </span>
              </TableCompactCell>
            </TableCompactRow>
          ))}
        </TableCompactBody>
      </TableCompact>
    </SectionCard>
  );
}
