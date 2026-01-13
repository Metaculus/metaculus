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
  WageValue,
} from "../components/table-compact";

export function ResearchSection({ ...props }: ComponentProps<"section">) {
  return (
    <SectionCard {...props}>
      <SectionHeader>
        How does this build on or differ from existing research?
      </SectionHeader>
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
      <TableCompact className="inverted mt-6">
        <TableCompactHead>
          <TableCompactRow>
            <TableCompactHeaderCell className="w-[40%]">
              Median Wage Changes
            </TableCompactHeaderCell>
            <TableCompactHeaderCell className="w-[20%] text-right">
              Current
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
            {
              occupation: "All Occupations",
              current: 45,
              change2030: 3.4,
              change2035: 6.4,
            },
            {
              occupation: "Construction Workers",
              current: 55,
              change2030: 1.4,
              change2035: 5.4,
            },
            {
              occupation: "General Managers",
              current: 50,
              change2030: 4.4,
              change2035: 7.7,
            },
            {
              occupation: "Engineers",
              current: 70,
              change2030: -5.6,
              change2035: -6.7,
            },
            {
              occupation: "Financial Specialists",
              current: 70,
              change2030: -8.6,
              change2035: -11.7,
            },
          ].map((row, index) => (
            <TableCompactRow key={row.occupation}>
              <TableCompactCell className={index === 0 ? "font-medium" : ""}>
                {row.occupation}
              </TableCompactCell>
              <TableCompactCell className="text-right">
                <WageValue value={row.current} />
              </TableCompactCell>
              <TableCompactCell className="text-right">
                <PercentageChange value={row.change2030} />
              </TableCompactCell>
              <TableCompactCell className="text-right">
                <PercentageChange value={row.change2035} />
              </TableCompactCell>
            </TableCompactRow>
          ))}
        </TableCompactBody>
      </TableCompact>
    </SectionCard>
  );
}
