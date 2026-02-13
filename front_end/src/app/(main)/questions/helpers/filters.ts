import { useTranslations } from "next-intl";

import {
  FilterOptionType,
  FilterSection,
} from "@/components/popover_filter/types";
import { ChipColor } from "@/components/ui/chip";
import {
  POST_ACCESS_FILTER,
  POST_AUTHOR_FILTER,
  POST_CATEGORIES_FILTER,
  POST_COMMENTED_BY_FILTER,
  POST_FOLLOWING_FILTER,
  POST_FOR_MAIN_FEED,
  POST_FORECASTER_ID_FILTER,
  POST_LEADERBOARD_TAGS_FILTER,
  POST_NOT_FORECASTER_ID_FILTER,
  POST_ORDER_BY_FILTER,
  POST_PAGE_FILTER,
  POST_PROJECT_FILTER,
  POST_STATUS_FILTER,
  POST_TEXT_SEARCH_FILTER,
  POST_TOPIC_FILTER,
  POST_TYPE_FILTER,
  POST_UPVOTED_BY_FILTER,
  POST_USERNAMES_FILTER,
  POST_WITHDRAWN_FILTER,
} from "@/constants/posts_feed";
import { PostsParams } from "@/services/api/posts/posts.shared";
import ClientProfileApi from "@/services/api/profile/profile.client";
import { SearchParams } from "@/types/navigation";
import {
  ForecastType,
  NotebookType,
  PostForecastType,
  PostStatus,
} from "@/types/post";
import { TournamentPreview } from "@/types/projects";
import { QuestionType } from "@/types/question";
import { CurrentUser } from "@/types/users";

// TODO: translate
const POST_TYPE_LABEL_MAP: Record<ForecastType, string> = {
  [QuestionType.Binary]: "Binary",
  [QuestionType.MultipleChoice]: "Multiple Choice",
  [QuestionType.Numeric]: "Numeric",
  [QuestionType.Discrete]: "Discrete",
  [QuestionType.Date]: "Date",
  [PostForecastType.Group]: "Group",
  [PostForecastType.Conditional]: "Conditional",
  [NotebookType.Notebook]: "Notebook",
};

// TODO: translate
export const POST_STATUS_LABEL_MAP = {
  [PostStatus.DRAFT]: "Draft",
  [PostStatus.PENDING]: "In Review",
  [PostStatus.UPCOMING]: "Upcoming",
  [PostStatus.APPROVED]: "Approved",
  [PostStatus.OPEN]: "Open",
  [PostStatus.CLOSED]: "Closed",
  [PostStatus.PENDING_RESOLUTION]: "Pending Resolution",
  [PostStatus.RESOLVED]: "Resolved",
  [PostStatus.DELETED]: "Deleted",
  [PostStatus.REJECTED]: "Rejected Posts",
};

type FiltersFromSearchParamsOptions = {
  defaultOrderBy?: string;
  defaultForMainFeed?: boolean;
  withoutPageParam?: boolean;
  filterForConsumerView?: boolean;
};

export function generateFiltersFromSearchParams(
  searchParams: SearchParams,
  options: FiltersFromSearchParamsOptions = {}
): PostsParams {
  const {
    defaultOrderBy,
    defaultForMainFeed,
    withoutPageParam,
    filterForConsumerView,
  } = options;
  const filters: PostsParams = {};

  if (!withoutPageParam && typeof searchParams[POST_PAGE_FILTER] === "string") {
    filters.page = Number(searchParams[POST_PAGE_FILTER]);
  }

  if (typeof searchParams[POST_FOLLOWING_FILTER] === "string") {
    filters.following = Boolean(searchParams[POST_FOLLOWING_FILTER]);
  }

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

  if (searchParams[POST_LEADERBOARD_TAGS_FILTER]) {
    filters.leaderboard_tags = searchParams[POST_LEADERBOARD_TAGS_FILTER];
  }

  if (searchParams[POST_USERNAMES_FILTER]) {
    filters.usernames = searchParams[POST_USERNAMES_FILTER];
  }
  if (searchParams[POST_PROJECT_FILTER]) {
    filters.default_project_id = searchParams[POST_PROJECT_FILTER].toString();
  }
  if (typeof searchParams[POST_FOR_MAIN_FEED] === "string") {
    filters.for_main_feed = searchParams[POST_FOR_MAIN_FEED];
  } else if (
    typeof defaultForMainFeed !== "undefined" &&
    !searchParams[POST_TEXT_SEARCH_FILTER]
  ) {
    filters.for_main_feed = defaultForMainFeed.toString();
  }

  if (typeof searchParams[POST_FORECASTER_ID_FILTER] === "string") {
    filters.forecaster_id = searchParams[POST_FORECASTER_ID_FILTER];
  }
  if (typeof searchParams[POST_WITHDRAWN_FILTER] === "string") {
    filters.withdrawn = searchParams[POST_WITHDRAWN_FILTER];
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
  if (typeof searchParams[POST_NOT_FORECASTER_ID_FILTER] === "string") {
    filters.not_forecaster_id = searchParams[POST_NOT_FORECASTER_ID_FILTER];
  }

  if (typeof searchParams[POST_ACCESS_FILTER] === "string") {
    filters.access = searchParams[POST_ACCESS_FILTER];
  }

  if (
    typeof filterForConsumerView !== "undefined" &&
    !filters.search &&
    !filters.statuses
  ) {
    filters.for_consumer_view = filterForConsumerView.toString();
  }

  if (typeof searchParams[POST_ORDER_BY_FILTER] === "string") {
    filters.order_by = searchParams[POST_ORDER_BY_FILTER];
  } else if (defaultOrderBy) {
    filters.order_by = defaultOrderBy;

    if (!filters.statuses && !filters.search) {
      filters.statuses = [
        PostStatus.OPEN,
        PostStatus.CLOSED,
        PostStatus.RESOLVED,
        PostStatus.UPCOMING,
      ];
    }
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
  statuses,
}: {
  t: ReturnType<typeof useTranslations>;
  params: URLSearchParams;
  statuses?: PostStatus[];
}): FilterSection {
  const options = statuses ?? Object.values(PostStatus);

  return {
    id: POST_STATUS_FILTER,
    title: t("questionStatus"),
    type: FilterOptionType.MultiChip,
    options: options.map((status) => ({
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

      try {
        const response = await ClientProfileApi.searchUsers(query);
        return response.results.map((obj) => ({
          label: obj.username,
          value: obj.username,
          active: params.getAll(POST_USERNAMES_FILTER).includes(obj.username),
        }));
      } catch {
        return [];
      }
    },
    chipColor: getFilterChipColor(POST_USERNAMES_FILTER),
    chipFormat: (value: string) =>
      t("questionAuthorFilter", { author: value.toLowerCase() }),
    shouldEnforceSearch: true,
  };
}

export function getFilterSectionProjects({
  t,
  params,
  projects,
}: {
  t: ReturnType<typeof useTranslations>;
  params: URLSearchParams;
  projects: TournamentPreview[];
}): FilterSection {
  const options = projects.map((project) => ({
    label: project.name,
    value: project.id.toString(),
    active: params.getAll(POST_PROJECT_FILTER).includes(project.id.toString()),
  }));
  return {
    id: POST_PROJECT_FILTER,
    title: t("projects"),
    type: FilterOptionType.Combobox,
    options,
    chipColor: getFilterChipColor(POST_PROJECT_FILTER),
    shouldEnforceSearch: false,
    multiple: false,
  };
}

export function getFilterSectionParticipation({
  t,
  params,
  user,
}: {
  t: ReturnType<typeof useTranslations>;
  params: URLSearchParams;
  user: CurrentUser;
}): FilterSection {
  return {
    id: "userFilters",
    title: t("myParticipation"),
    type: FilterOptionType.ToggleChip,
    options: [
      {
        id: POST_FORECASTER_ID_FILTER,
        label: t("searchOptionPredicted"),
        value: user.id.toString(),
        active:
          !!params.get(POST_FORECASTER_ID_FILTER) &&
          !params.get(POST_WITHDRAWN_FILTER),
      },
      {
        id: POST_WITHDRAWN_FILTER,
        label: t("searchOptionActivePrediction"),
        value: "false",
        extraValues: {
          [POST_FORECASTER_ID_FILTER]: user.id.toString(),
        },
        active:
          !!params.get(POST_FORECASTER_ID_FILTER) &&
          params.get(POST_WITHDRAWN_FILTER) === "false",
      },
      {
        id: POST_WITHDRAWN_FILTER,
        label: t("searchOptionWithdrawnPrediction"),
        value: "true",
        extraValues: {
          [POST_FORECASTER_ID_FILTER]: user.id.toString(),
        },
        active:
          !!params.get(POST_FORECASTER_ID_FILTER) &&
          params.get(POST_WITHDRAWN_FILTER) === "true",
      },
      {
        id: POST_NOT_FORECASTER_ID_FILTER,
        label: t("searchOptionNotPredicted"),
        value: user.id.toString(),
        active: !!params.get(POST_NOT_FORECASTER_ID_FILTER),
      },
      {
        id: POST_FOLLOWING_FILTER,
        label: t("followed"),
        value: "true",
        active: !!params.get(POST_FOLLOWING_FILTER),
        isPersisted: true,
      },
      {
        id: POST_UPVOTED_BY_FILTER,
        label: t("upvoted"),
        value: user.id.toString(),
        active: !!params.get(POST_UPVOTED_BY_FILTER),
        isPersisted: true,
      },
      {
        id: POST_COMMENTED_BY_FILTER,
        label: t("commented"),
        value: user.id.toString(),
        active: !!params.get(POST_COMMENTED_BY_FILTER),
        isPersisted: true,
      },
    ],
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

export function getFilterChipColor(id: string): ChipColor {
  if (id === POST_CATEGORIES_FILTER) {
    return "olive";
  } else if (id === POST_PROJECT_FILTER) {
    return "orange";
  }

  return "blue";
}
