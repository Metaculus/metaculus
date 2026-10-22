import { PostWithForecasts } from "@/types/post";

import { KeyTakeawaysSection } from "./key_takeaways";
import {
  DiseaseSection,
  DiseaseSectionRow,
} from "../components/disease_section";
import {
  getSectionPostIds,
  getSectionRows,
  OTHER_DISEASES_ID,
  SectionConfig,
} from "../config/sections";
import { Edition } from "../editions/types";
import { fetchGhmDistributionsAt } from "../helpers/ghm_distributions";
import { snapshotPostsAt } from "../helpers/snapshot_posts";

type Props = {
  edition: Edition;
  layout: SectionConfig[];
  posts: Map<number, PostWithForecasts>;
  // Past editions end their timelines at publication (ms).
  asOfTime?: number;
};

// An edition's key takeaways and disease sections.
export function EditionBody({ edition, layout, posts, asOfTime }: Props) {
  const renderSection = (section: SectionConfig) => (
    <DiseaseSection
      key={section.id}
      section={section}
      content={edition.sections[section.id]}
      posts={posts}
      asOfTime={asOfTime}
    />
  );

  return (
    <>
      <KeyTakeawaysSection edition={edition} posts={posts} />
      {getSectionRows(layout).map((row) =>
        row.kind === "section" ? (
          renderSection(row.section)
        ) : (
          <DiseaseSectionRow
            key={OTHER_DISEASES_ID}
            diseases={row.sections.map((section) => section.id)}
          >
            {row.sections.map(renderSection)}
          </DiseaseSectionRow>
        )
      )}
    </>
  );
}

// A past edition's body, as of its publication. It waits for the numeric curves, which only the
// aggregation explorer has, so the page streams it in behind a loader.
export async function PastEditionBody({
  edition,
  layout,
  livePosts,
  asOfTime,
}: Omit<Props, "posts" | "asOfTime"> & {
  livePosts: Map<number, PostWithForecasts>;
  asOfTime: number;
}) {
  const asOf = Math.floor(asOfTime / 1000);
  const layoutPosts = getSectionPostIds(layout).flatMap((postId) => {
    const post = livePosts.get(postId);
    return post ? [post] : [];
  });
  const distributions = await fetchGhmDistributionsAt(layoutPosts, asOf);

  return (
    <EditionBody
      edition={edition}
      layout={layout}
      posts={snapshotPostsAt(livePosts, asOf, distributions)}
      asOfTime={asOfTime}
    />
  );
}
