import { CSSProperties, ComponentProps } from "react";

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

function getCellBackgroundStyle(
  value: number,
  maxAbsValue: number,
  invertColors = false
): CSSProperties {
  if (value === 0) return {};
  const ratio = Math.min(Math.abs(value) / maxAbsValue, 1);
  const opacity = 0.05 + ratio * 0.55;
  const isPositive = value > 0;
  const useGreen = invertColors ? !isPositive : isPositive;
  const color = useGreen
    ? `rgba(102, 165, 102, ${opacity})`
    : `rgba(213, 139, 128, ${opacity})`;
  return { backgroundColor: color };
}

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
        className="inverted mt-6 [&_table]:border-separate [&_table]:border-spacing-x-2 [&_table]:border-spacing-y-2 [&_td]:py-0.5 [&_th]:pb-3"
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
            <TableCompactHeaderCell className="w-[20%] text-center">
              2030
            </TableCompactHeaderCell>
            <TableCompactHeaderCell className="w-[20%] text-center">
              2035
            </TableCompactHeaderCell>
            <TableCompactHeaderCell className="w-[20%] text-center">
              AI Vulnerability Rating
            </TableCompactHeaderCell>
          </TableCompactRow>
        </TableCompactHead>
        <TableCompactBody>
          {[
            ["Construction Workers", 11.2, 17.2, -1.218],
            ["Registered Nurses", 8.4, 14.4, -0.211],
            ["Physicians", 5.6, 14.1, -0.403],
            ["General Managers", 3.4, 3.4, -0.024],
            ["Law Enforcement", 2.0, 3.0, -0.403],
            ["Janitors and Cleaners", 0.0, -6.0, 0.954],
            ["Restaurant Servers", -1.6, -6.4, -0.403],
            ["Warehouse Workers", -3.3, -6.6, 0.654],
            ["Engineers", -4.2, -7.6, 0.488],
            ["Designers", -5.6, -8.8, -0.403],
            ["Services Sales Representatives", -8.6, -15.6, 1.954],
            ["Financial Specialists", -18.6, -32.6, 1.954],
            ["Lawyers", -28.6, -38.6, 0.488],
            ["Software Developers", -38.6, -78.6, 0.954],
          ].map((row) => (
            <TableCompactRow key={row[0]}>
              <TableCompactCell className="font-medium">
                {row[0]}
              </TableCompactCell>
              <TableCompactCell
                className="text-center"
                style={getCellBackgroundStyle(Number(row[1]), 100)}
              >
                <PercentageChange value={Number(row[1])} />
              </TableCompactCell>
              <TableCompactCell
                className="text-center"
                style={getCellBackgroundStyle(Number(row[2]), 100)}
              >
                <PercentageChange value={Number(row[2])} />
              </TableCompactCell>
              <TableCompactCell
                className="text-center"
                style={getCellBackgroundStyle(Number(row[3]), 2, true)}
              >
                <span
                  className={
                    Number(row[3]) >= 0
                      ? "text-salmon-700 dark:text-salmon-400"
                      : "text-mint-800 dark:text-mint-300"
                  }
                >
                  {Number(row[3]) > 0 ? "+" : ""}
                  {Number(row[3])}
                </span>
              </TableCompactCell>
            </TableCompactRow>
          ))}
        </TableCompactBody>
      </TableCompact>
    </SectionCard>
  );
}
