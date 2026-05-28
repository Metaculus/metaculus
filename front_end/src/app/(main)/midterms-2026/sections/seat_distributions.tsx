import { getTranslations } from "next-intl/server";

import {
  ContentParagraph,
  SectionCard,
  SectionHeader,
} from "@/app/(main)/labor-hub/components/section";
import { PostWithForecasts } from "@/types/post";

import SeatDistributionChart from "../components/seat_distribution_chart";
import { fetchSeatDistributions } from "../helpers/fetch_dashboard_data";

export default async function SeatDistributionsSection() {
  const t = await getTranslations();
  const { senate, house } = await fetchSeatDistributions();

  const demAdvantageLabel = t("midtermsHubDemSeatAdvantage");
  const repAdvantageLabel = t("midtermsHubRepSeatAdvantage");
  const evenLabel = t("midtermsHubEven");
  const unavailableLabel = t("midtermsHubForecastUnavailable");

  return (
    <SectionCard>
      <SectionHeader className="mb-2">
        {t("midtermsHubSeatDistributionsTitle")}
      </SectionHeader>
      <ContentParagraph className="mb-3">
        {t("midtermsHubSeatDistributionsSubtitle")}
      </ContentParagraph>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
        <DistributionSlot
          title={t("midtermsHubSenateSeats")}
          post={senate}
          chamberLabel="senate"
          demAdvantageLabel={demAdvantageLabel}
          repAdvantageLabel={repAdvantageLabel}
          evenLabel={evenLabel}
          unavailableLabel={unavailableLabel}
        />
        <DistributionSlot
          title={t("midtermsHubHouseSeats")}
          post={house}
          chamberLabel="house"
          demAdvantageLabel={demAdvantageLabel}
          repAdvantageLabel={repAdvantageLabel}
          evenLabel={evenLabel}
          unavailableLabel={unavailableLabel}
        />
      </div>
    </SectionCard>
  );
}

type SlotProps = {
  title: string;
  post: PostWithForecasts | null;
  chamberLabel: "senate" | "house";
  demAdvantageLabel: string;
  repAdvantageLabel: string;
  evenLabel: string;
  unavailableLabel: string;
};

function DistributionSlot({
  title,
  post,
  demAdvantageLabel,
  repAdvantageLabel,
  evenLabel,
  unavailableLabel,
}: SlotProps) {
  if (!post) {
    return (
      <div>
        <h3 className="mb-2 text-center text-base font-medium uppercase tracking-wide text-blue-800 dark:text-blue-800-dark">
          {title}
        </h3>
        <div className="flex aspect-[2/1] items-center justify-center rounded-md border border-dashed border-blue-300 text-sm text-blue-600 dark:border-blue-300-dark dark:text-blue-600-dark">
          {unavailableLabel}
        </div>
      </div>
    );
  }

  // Title is rendered inside the chart (top-left, half opacity).
  return (
    <div>
      <SeatDistributionChart
        post={post}
        demAdvantageLabel={demAdvantageLabel}
        repAdvantageLabel={repAdvantageLabel}
        evenLabel={evenLabel}
        ariaTitle={title}
      />
    </div>
  );
}
