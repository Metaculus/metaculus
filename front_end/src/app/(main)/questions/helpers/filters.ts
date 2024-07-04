import classNames from "classnames";
import { useTranslations } from "next-intl";

import { searchUsers } from "@/app/(main)/questions/actions";
import {
  FilterOption,
  FilterOptionType,
  FilterSection,
} from "@/components/popover_filter/types";
import { GroupButton } from "@/components/ui/button_group";
import { ChipColor } from "@/components/ui/chip";
import { SelectOption } from "@/components/ui/listbox";
import {
  POST_ACCESS_FILTER,
  POST_AUTHOR_FILTER,
  POST_USERNAMES_FILTER,
  POST_CATEGORIES_FILTER,
  POST_COMMENTED_BY_FILTER,
  POST_GUESSED_BY_FILTER,
  POST_NOT_GUESSED_BY_FILTER,
  POST_ORDER_BY_FILTER,
  POST_STATUS_FILTER,
  POST_TAGS_FILTER,
  POST_TEXT_SEARCH_FILTER,
  POST_TOPIC_FILTER,
  POST_TYPE_FILTER,
  POST_UPVOTED_BY_FILTER,
} from "@/constants/posts_feed";
import { PostsParams } from "@/services/posts";
import { SearchParams } from "@/types/navigation";
import {
  ForecastType,
  NotebookType,
  PostForecastType,
  PostStatus,
} from "@/types/post";
import { Category, Tag } from "@/types/projects";
import { QuestionOrder, QuestionType } from "@/types/question";
import { CurrentUser } from "@/types/users";

// TODO: translate
const POST_TYPE_LABEL_MAP: Record<ForecastType, string> = {
  [QuestionType.Numeric]: "Numeric",
  [QuestionType.Date]: "Date",
  [QuestionType.MultipleChoice]: "Multiple Choice",
  [QuestionType.Binary]: "Binary",
  [PostForecastType.Conditional]: "Conditional",
  [PostForecastType.Group]: "Group",
  [NotebookType.Notebook]: "Notebook",
};

// TODO: translate
export const POST_STATUS_LABEL_MAP = {
  [PostStatus.APPROVED]: "Open",
  [PostStatus.RESOLVED]: "Resolved",
  [PostStatus.CLOSED]: "Closed",
  [PostStatus.PENDING]: "In Review",
  [PostStatus.DRAFT]: "My Drafts",
  [PostStatus.DELETED]: "Removed Posts",
  [PostStatus.REJECTED]: "Rejected Posts",
};

export function generateFiltersFromSearchParams(
  searchParams: SearchParams
): PostsParams {
  const filters: PostsParams = {};

  if (typeof searchParams[POST_TEXT_SEARCH_FILTER] === "string") {
    filters.search = searchParams[POST_TEXT_SEARCH_FILTER];
  }

  if (typeof searchParams[POST_TOPIC_FILTER] === "string") {
    filters.topic = searchParams[POST_TOPIC_FILTER];
  }

  if (searchParams[POST_TYPE_FILTER]) {
    filters.forecast_type = searchParams[POST_TYPE_FILTER];
  }

  if (searchParams[POST_STATUS_FILTER]) {
    filters.statuses = searchParams[POST_STATUS_FILTER];
  }

  if (searchParams[POST_CATEGORIES_FILTER]) {
    filters.categories = searchParams[POST_CATEGORIES_FILTER];
  }

  if (searchParams[POST_TAGS_FILTER]) {
    filters.tags = searchParams[POST_TAGS_FILTER];
  }

  if (searchParams[POST_USERNAMES_FILTER]) {
    filters.usernames = searchParams[POST_USERNAMES_FILTER];
  }

  if (typeof searchParams[POST_GUESSED_BY_FILTER] === "string") {
    filters.guessed_by = searchParams[POST_GUESSED_BY_FILTER];
  }
  if (typeof searchParams[POST_AUTHOR_FILTER] === "string") {
    filters.author = searchParams[POST_AUTHOR_FILTER];
  }
  if (typeof searchParams[POST_UPVOTED_BY_FILTER] === "string") {
    filters.upvoted_by = searchParams[POST_UPVOTED_BY_FILTER];
  }
  if (typeof searchParams[POST_COMMENTED_BY_FILTER] === "string") {
    filters.commented_by = searchParams[POST_COMMENTED_BY_FILTER];
  }
  if (typeof searchParams[POST_NOT_GUESSED_BY_FILTER] === "string") {
    filters.not_guessed_by = searchParams[POST_NOT_GUESSED_BY_FILTER];
  }

  if (typeof searchParams[POST_ACCESS_FILTER] === "string") {
    filters.access = searchParams[POST_ACCESS_FILTER];
  }

  if (typeof searchParams[POST_ORDER_BY_FILTER] === "string") {
    filters.order_by = searchParams[POST_ORDER_BY_FILTER];
  }

  return filters;
}

export function getFilterSectionPostType({
  t,
  params,
}: {
  t: ReturnType<typeof useTranslations>;
  params: URLSearchParams;
}): FilterSection {
  return {
    id: POST_TYPE_FILTER,
    title: t("questionType"),
    type: FilterOptionType.MultiChip,
    options: [
      ...mapForecastTypeOptions(Object.values(QuestionType), params),
      ...mapForecastTypeOptions(Object.values(PostForecastType), params),
      ...mapForecastTypeOptions(Object.values(NotebookType), params),
    ],
  };
}

export function getFilterSectionPostStatus({
  t,
  params,
}: {
  t: ReturnType<typeof useTranslations>;
  params: URLSearchParams;
}): FilterSection {
  return {
    id: POST_STATUS_FILTER,
    title: t("questionStatus"),
    type: FilterOptionType.MultiChip,
    options: Object.values(PostStatus).map((status) => ({
      label: POST_STATUS_LABEL_MAP[status],
      value: status,
      active: params.getAll(POST_STATUS_FILTER).includes(status),
    })),
  };
}

export function getFilterSectionUsername({
  t,
  params,
}: {
  t: ReturnType<typeof useTranslations>;
  params: URLSearchParams;
}): FilterSection {
  return {
    id: POST_USERNAMES_FILTER,
    title: t("questionAuthor"),
    type: FilterOptionType.Combobox,
    options: params.getAll(POST_USERNAMES_FILTER).map((username) => ({
      label: username,
      value: username,
      active: params.getAll(POST_USERNAMES_FILTER).includes(username),
    })),
    optionsFetcher: async (query: string) => {
      if (query.length < 3) {
        return [];
      }

      const response = await searchUsers(query);

      if (response && "errors" in response) {
        return [];
      }

      return response.results.map((obj) => ({
        label: obj.username,
        value: obj.username,
        active: params.getAll(POST_USERNAMES_FILTER).includes(obj.username),
      }));
    },
    chipColor: getFilterChipColor(POST_USERNAMES_FILTER),
    chipFormat: (value: string) =>
      t("questionAuthorFilter", { author: value.toLowerCase() }),
    shouldEnforceSearch: true,
  };
}

const mapForecastTypeOptions = (
  types: ForecastType[],
  params: URLSearchParams
) =>
  types.map((type) => ({
    label: POST_TYPE_LABEL_MAP[type],
    value: type,
    active: params.getAll(POST_TYPE_FILTER).includes(type),
  }));

export function getPostsFilters({
  tags,
  user,
  t,
  params,
  categories,
}: {
  t: ReturnType<typeof useTranslations>;
  params: URLSearchParams;
  categories: Category[];
  tags: Tag[];
  user: CurrentUser | null;
}): FilterSection[] {
  const filters: FilterSection[] = [
    getFilterSectionPostType({ t, params }),
    getFilterSectionPostStatus({ t, params }),
    {
      id: POST_CATEGORIES_FILTER,
      title: t("category"),
      type: FilterOptionType.Combobox,
      options: categories.map((category) => ({
        label: category.name,
        value: category.slug,
        active: params.getAll(POST_CATEGORIES_FILTER).includes(category.slug),
      })),
      chipColor: getFilterChipColor(POST_CATEGORIES_FILTER),
    },
    {
      id: POST_TAGS_FILTER,
      title: t("tags"),
      type: FilterOptionType.Combobox,
      options: tags.map((tag) => ({
        label: tag.name,
        value: tag.slug,
        active: params.getAll(POST_TAGS_FILTER).includes(tag.slug),
      })),
      chipColor: getFilterChipColor(POST_TAGS_FILTER),
      chipFormat: (value) => t("tagFilter", { tag: value.toLowerCase() }),
      shouldEnforceSearch: true,
    },
    getFilterSectionUsername({ t, params }),
  ];

  if (user) {
    filters.push({
      id: "userFilters",
      title: t("myParticipation"),
      type: FilterOptionType.ToggleChip,
      options: [
        {
          id: POST_GUESSED_BY_FILTER,
          label: t("predicted"),
          value: user.id.toString(),
          active: !!params.get(POST_GUESSED_BY_FILTER),
        },
        {
          id: POST_NOT_GUESSED_BY_FILTER,
          label: t("notPredicted"),
          value: user.id.toString(),
          active: !!params.get(POST_NOT_GUESSED_BY_FILTER),
        },
        {
          id: POST_AUTHOR_FILTER,
          label: t("authored"),
          value: user.id.toString(),
          active: !!params.get(POST_AUTHOR_FILTER),
        },
        {
          id: POST_UPVOTED_BY_FILTER,
          label: t("upvoted"),
          value: user.id.toString(),
          active: !!params.get(POST_UPVOTED_BY_FILTER),
        },
        {
          id: POST_COMMENTED_BY_FILTER,
          label: t("moderating"),
          value: user.id.toString(),
          active: !!params.get(POST_COMMENTED_BY_FILTER),
        },
      ],
    });
  }

  filters.push({
    id: POST_ACCESS_FILTER,
    title: t("visibility"),
    type: FilterOptionType.ToggleChip,
    options: [
      {
        id: POST_ACCESS_FILTER,
        label: t("public"),
        value: "public",
        active: params.get(POST_ACCESS_FILTER) === "public",
      },
      {
        id: POST_ACCESS_FILTER,
        label: t("private"),
        value: "private",
        active: params.get(POST_ACCESS_FILTER) === "private",
      },
    ],
  });

  return filters;
}

export function getMainOrderOptions(
  t: ReturnType<typeof useTranslations>
): GroupButton<QuestionOrder>[] {
  return [
    {
      id: QuestionOrder.ActivityDesc,
      label: t("hot"),
    },
    {
      id: QuestionOrder.WeeklyMovementDesc,
      label: t("movers"),
    },
    {
      id: QuestionOrder.PublishTimeDesc,
      label: t("new"),
    },
  ];
}

export function getUserSortOptions(
  t: ReturnType<typeof useTranslations>
): GroupButton<QuestionOrder>[] {
  return [
    {
      label: t("oldest"),
      id: QuestionOrder.LastPredictionTimeAsc,
    },
    {
      label: t("newest"),
      id: QuestionOrder.LastPredictionTimeDesc,
    },
    {
      label: t("divergence"),
      id: QuestionOrder.DivergenceDesc,
    },
  ];
}

export function getDropdownSortOptions(
  t: ReturnType<typeof useTranslations>,
  isAuthenticated: boolean
): SelectOption<QuestionOrder>[] {
  return [
    { value: QuestionOrder.VotesDesc, label: t("mostUpvotes") },
    { value: QuestionOrder.CommentCountDesc, label: t("mostComments") },
    {
      value: QuestionOrder.PredictionCountDesc,
      label: t("mostPredictions"),
    },
    { value: QuestionOrder.CloseTimeAsc, label: t("closingSoon") },
    { value: QuestionOrder.ResolveTimeAsc, label: t("resolvingSoon") },
    ...(isAuthenticated
      ? [
          {
            value: QuestionOrder.UnreadCommentCountDesc,
            label: t("unreadComments"),
          },
          {
            value: QuestionOrder.LastPredictionTimeAsc,
            label: t("oldestPredictions"),
            className: classNames("block lg:hidden"),
          },
          {
            value: QuestionOrder.LastPredictionTimeDesc,
            label: t("newestPredictions"),
            className: classNames("block lg:hidden"),
          },
          {
            value: QuestionOrder.DivergenceDesc,
            label: t("myDivergence"),
            className: classNames("block lg:hidden"),
          },
        ]
      : []),
  ];
}

export function getFilterChipColor(id: string): ChipColor {
  if (id === POST_CATEGORIES_FILTER) {
    return "olive";
  }

  return "blue";
}
