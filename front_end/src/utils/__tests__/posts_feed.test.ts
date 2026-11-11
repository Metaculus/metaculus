import { PostWithForecasts } from "@/types/post";
import { CombinedFeedTile, TilePlacement } from "@/types/projects";

import { filterTilesByPlacement, prioritizeTilesForPost } from "../posts_feed";

function adTile(
  id: string,
  targets: { postId?: number; projectId?: number } = {}
): CombinedFeedTile {
  return {
    type: "ad",
    id,
    project: null,
    ad: {
      title: id,
      description: "",
      image: null,
      cta_text: "",
      url: "https://example.com/",
      exposure_rate: 100,
      placements: [
        TilePlacement.QUESTION_SIDEBAR,
        TilePlacement.QUESTIONS_FEED,
      ],
      project_id: null,
      target_post_id: targets.postId ?? null,
      target_project_id: targets.projectId ?? null,
    },
  };
}

const post = {
  id: 1,
  projects: {
    default_project: { id: 10 },
    tournament: [{ id: 20 }],
    topic: [],
  },
} as unknown as PostWithForecasts;

describe("prioritizeTilesForPost", () => {
  it("orders post-targeted, then project-targeted, then untargeted", () => {
    const tiles = [
      adTile("general"),
      adTile("tournament", { projectId: 20 }),
      adTile("post", { postId: 1 }),
      adTile("default-project", { projectId: 10 }),
    ];

    expect(prioritizeTilesForPost(tiles, post).map((t) => t.id)).toEqual([
      "post",
      "tournament",
      "default-project",
      "general",
    ]);
  });

  it("drops tiles targeted at other posts or projects", () => {
    const tiles = [
      adTile("other-post", { postId: 2 }),
      adTile("other-project", { projectId: 99 }),
      adTile("general"),
    ];

    expect(prioritizeTilesForPost(tiles, post).map((t) => t.id)).toEqual([
      "general",
    ]);
  });
});

describe("filterTilesByPlacement", () => {
  it("keeps targeted tiles out of the feeds", () => {
    const tiles = [adTile("general"), adTile("post", { postId: 1 })];

    expect(
      filterTilesByPlacement(tiles, TilePlacement.QUESTIONS_FEED).map(
        (t) => t.id
      )
    ).toEqual(["general"]);
    expect(
      filterTilesByPlacement(tiles, TilePlacement.QUESTION_SIDEBAR).map(
        (t) => t.id
      )
    ).toEqual(["general", "post"]);
  });
});
