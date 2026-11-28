import {
  POST_CATEGORIES_FILTER,
  POST_FOR_MAIN_FEED,
  POST_IDS_FILTER,
  POST_TEXT_SEARCH_FILTER,
  POST_TOPIC_FILTER,
} from "@/constants/posts_feed";

import { generateFiltersFromSearchParams } from "../filters";

describe("generateFiltersFromSearchParams", () => {
  it("keeps main-feed filtering enabled for text search by default", () => {
    expect(
      generateFiltersFromSearchParams(
        { [POST_TEXT_SEARCH_FILTER]: "ai safety" },
        { defaultForMainFeed: true }
      )
    ).toEqual(
      expect.objectContaining({
        search: "ai safety",
        for_main_feed: "true",
      })
    );
  });

  it("does not apply the main-feed default to id lookups", () => {
    expect(
      generateFiltersFromSearchParams(
        { [POST_IDS_FILTER]: "123" },
        { defaultForMainFeed: true }
      )
    ).toEqual({
      ids: [123],
    });
  });

  it("ignores explicit main-feed bypasses outside id lookups", () => {
    expect(
      generateFiltersFromSearchParams(
        {
          [POST_TOPIC_FILTER]: "ai",
          [POST_FOR_MAIN_FEED]: "false",
        },
        { defaultForMainFeed: true }
      )
    ).toEqual(
      expect.objectContaining({
        topic: "ai",
        for_main_feed: "true",
      })
    );

    expect(
      generateFiltersFromSearchParams(
        {
          [POST_CATEGORIES_FILTER]: "geopolitics",
          [POST_FOR_MAIN_FEED]: "false",
        },
        { defaultForMainFeed: true }
      )
    ).toEqual(
      expect.objectContaining({
        categories: "geopolitics",
        for_main_feed: "true",
      })
    );
  });

  it("allows an explicit main-feed bypass for id lookups", () => {
    expect(
      generateFiltersFromSearchParams(
        {
          [POST_IDS_FILTER]: "123",
          [POST_FOR_MAIN_FEED]: "false",
        },
        { defaultForMainFeed: true }
      )
    ).toEqual({
      ids: [123],
      for_main_feed: "false",
    });
  });
});
