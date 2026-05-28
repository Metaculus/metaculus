import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import { PostWithForecasts } from "@/types/post";

import {
  createInitialPostsFeedData,
  normalizePostsFeedFilters,
} from "../use_posts_feed_query";

function mockPosts(count: number): PostWithForecasts[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: idx + 1,
  })) as PostWithForecasts[];
}

describe("posts feed query helpers", () => {
  describe("normalizePostsFeedFilters", () => {
    it("removes pagination params from the query key filters", () => {
      expect(
        normalizePostsFeedFilters({
          page: 3,
          offset: 48,
          limit: POSTS_PER_PAGE,
          statuses: ["resolved", "open"],
        })
      ).toEqual({
        statuses: ["open", "resolved"],
      });
    });
  });

  describe("createInitialPostsFeedData", () => {
    it("splits server-hydrated rows into page-sized infinite query pages", () => {
      const data = createInitialPostsFeedData(
        mockPosts(POSTS_PER_PAGE * 3),
        POSTS_PER_PAGE
      );

      expect(data.pageParams).toEqual([0, POSTS_PER_PAGE, POSTS_PER_PAGE * 2]);
      expect(
        data.pages.map((page) => page.results.map((post) => post.id))
      ).toEqual([
        Array.from({ length: POSTS_PER_PAGE }, (_, idx) => idx + 1),
        Array.from({ length: POSTS_PER_PAGE }, (_, idx) => idx + 25),
        Array.from({ length: POSTS_PER_PAGE }, (_, idx) => idx + 49),
      ]);
      expect(data.pages.map((page) => page.next)).toEqual([
        "initial-next-page",
        "initial-next-page",
        "initial-next-page",
      ]);
    });

    it("marks the final partial hydrated page as complete", () => {
      const data = createInitialPostsFeedData(
        mockPosts(POSTS_PER_PAGE + 3),
        POSTS_PER_PAGE
      );

      expect(data.pageParams).toEqual([0, POSTS_PER_PAGE]);
      expect(data.pages.map((page) => page.results.length)).toEqual([
        POSTS_PER_PAGE,
        3,
      ]);
      expect(data.pages.at(-1)?.next).toBeNull();
    });
  });
});
