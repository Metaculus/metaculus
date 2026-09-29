import { getTranslations } from "next-intl/server";
import { ReactNode } from "react";

import { NoQuestionPlaceholder } from "@/app/(main)/labor-hub/components/question_cards/placeholder";
import {
  SectionCard,
  SectionHeader,
} from "@/app/(main)/labor-hub/components/section";
import { PostWithForecasts } from "@/types/post";

import { EditionSwitcher } from "../components/edition_switcher";
import { LinkedTimeline } from "../components/linked_timeline/linked_timeline";
import { LinkedTimelineChart } from "../components/linked_timeline/linked_timeline_chart";
import { PastEditionBanner } from "../components/past_edition_banner";
import { GHM_VALUES, GhmValueKey } from "../config/questions";
import { Edition } from "../editions/types";
import { toTimelineMarkers } from "../helpers/edition_markers";
import { GhmSnapshot } from "../helpers/snapshot";

export async function KeyTakeawaysSection({
  edition,
  snapshot,
  latestSlug,
  posts,
}: {
  edition: Edition;
  snapshot: GhmSnapshot;
  latestSlug: string;
  posts: Map<number, PostWithForecasts>;
}) {
  const t = await getTranslations();
  const markers = toTimelineMarkers(snapshot.editionMarkers);

  const charts: Partial<Record<GhmValueKey, ReactNode>> = {};
  for (const { lead } of edition.takeaways) {
    const post = posts.get(GHM_VALUES[lead].postId);
    charts[lead] = post ? (
      <LinkedTimelineChart
        post={post}
        valueKey={lead}
        markers={markers}
        activeMarkerId={edition.slug}
      />
    ) : (
      <NoQuestionPlaceholder />
    );
  }

  return (
    <SectionCard id="takeaways" className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeader>
          {t("globalHealthMonitorKeyTakeawaysTitle")}
        </SectionHeader>
        <EditionSwitcher
          editions={snapshot.editionMarkers}
          currentSlug={edition.slug}
          latestSlug={latestSlug}
        />
      </div>
      {!snapshot.isLatest && (
        <PastEditionBanner date={snapshot.edition.label} />
      )}
      <LinkedTimeline
        takeaways={edition.takeaways.map(({ id, diseases, lead, content }) => ({
          id,
          diseases,
          lead,
          content,
        }))}
        charts={charts}
      />
    </SectionCard>
  );
}
