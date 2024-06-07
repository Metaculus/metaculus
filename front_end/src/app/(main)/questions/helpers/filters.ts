import classNames from "classnames";
import { useTranslations } from "next-intl";

import {
  QUESTION_STATUS_LABEL_MAP,
  QUESTION_TYPE_LABEL_MAP,
} from "@/app/(main)/questions/constants/filters";
import {
  ACCESS_FILTER,
  AUTHOR_FILTER,
  CATEGORIES_FILTER,
  COMMENTED_BY_FILTER,
  GUESSED_BY_FILTER,
  NOT_GUESSED_BY_FILTER,
  ORDER_BY_FILTER,
  QUESTION_TYPE_FILTER,
  STATUS_FILTER,
  TAGS_FILTER,
  TEXT_SEARCH_FILTER,
  TOPIC_FILTER,
  UPVOTED_BY_FILTER,
} from "@/app/(main)/questions/constants/query_params";
import {
  FilterOptionType,
  FilterSection,
} from "@/components/popover_filter/types";
import { GroupButton } from "@/components/ui/button_group";
import { ChipColor } from "@/components/ui/chip";
import { SelectOption } from "@/components/ui/select";
import { QuestionsParams } from "@/services/questions";
import { Category, Tag } from "@/types/projects";
import { QuestionOrder, QuestionStatus, QuestionType } from "@/types/question";
import { CurrentUser } from "@/types/users";

export function generateFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): QuestionsParams {
  const filters: QuestionsParams = {};

  if (typeof searchParams[TEXT_SEARCH_FILTER] === "string") {
    filters.search = searchParams[TEXT_SEARCH_FILTER];
  }

  if (typeof searchParams[TOPIC_FILTER] === "string") {
    filters.topic = searchParams[TOPIC_FILTER];
  }

  if (searchParams[QUESTION_TYPE_FILTER]) {
    filters.forecast_type = searchParams[QUESTION_TYPE_FILTER];
  }

  if (searchParams[STATUS_FILTER]) {
    filters.status = searchParams[STATUS_FILTER];
  }

  if (searchParams[CATEGORIES_FILTER]) {
    filters.categories = searchParams[CATEGORIES_FILTER];
  }

  if (searchParams[TAGS_FILTER]) {
    filters.tags = searchParams[TAGS_FILTER];
  }

  if (typeof searchParams[GUESSED_BY_FILTER] === "string") {
    filters.guessed_by = searchParams[GUESSED_BY_FILTER];
  }
  if (typeof searchParams[AUTHOR_FILTER] === "string") {
    filters.author = searchParams[AUTHOR_FILTER];
  }
  if (typeof searchParams[UPVOTED_BY_FILTER] === "string") {
    filters.upvoted_by = searchParams[UPVOTED_BY_FILTER];
  }
  if (typeof searchParams[COMMENTED_BY_FILTER] === "string") {
    filters.commented_by = searchParams[COMMENTED_BY_FILTER];
  }
  if (typeof searchParams[NOT_GUESSED_BY_FILTER] === "string") {
    filters.not_guessed_by = searchParams[NOT_GUESSED_BY_FILTER];
  }

  if (typeof searchParams[ACCESS_FILTER] === "string") {
    filters.access = searchParams[ACCESS_FILTER];
  }

  if (typeof searchParams[ORDER_BY_FILTER] === "string") {
    filters.order_by = searchParams[ORDER_BY_FILTER];
  }

  return filters;
}

export function getQuestionsFilters({
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
    {
      id: QUESTION_TYPE_FILTER,
      title: t("questionType"),
      type: FilterOptionType.MultiChip,
      options: Object.values(QuestionType).map((type) => ({
        label: QUESTION_TYPE_LABEL_MAP[type],
        value: type,
        active: params.getAll(QUESTION_TYPE_FILTER).includes(type),
      })),
    },
    {
      id: STATUS_FILTER,
      title: t("questionStatus"),
      type: FilterOptionType.MultiChip,
      options: Object.values(QuestionStatus).map((status) => ({
        label: QUESTION_STATUS_LABEL_MAP[status],
        value: status,
        active: params.getAll(STATUS_FILTER).includes(status),
      })),
    },
    {
      id: CATEGORIES_FILTER,
      title: t("category"),
      type: FilterOptionType.Combobox,
      options: categories.map((category) => ({
        label: category.name,
        value: category.slug,
        active: params.getAll(CATEGORIES_FILTER).includes(category.slug),
      })),
      chipColor: getFilterChipColor(CATEGORIES_FILTER),
    },
    {
      id: TAGS_FILTER,
      title: t("tags"),
      type: FilterOptionType.Combobox,
      options: tags.map((tag) => ({
        label: tag.name,
        value: tag.slug,
        active: params.getAll(TAGS_FILTER).includes(tag.slug),
      })),
      chipColor: getFilterChipColor(TAGS_FILTER),
      chipFormat: (value) => t("tagFilter", { tag: value.toLowerCase() }),
      shouldEnforceSearch: true,
    },
  ];

  if (user) {
    filters.push({
      id: "userFilters",
      title: t("myParticipation"),
      type: FilterOptionType.ToggleChip,
      options: [
        {
          id: GUESSED_BY_FILTER,
          label: t("predicted"),
          value: user.id.toString(),
          active: !!params.get(GUESSED_BY_FILTER),
        },
        {
          id: NOT_GUESSED_BY_FILTER,
          label: t("notPredicted"),
          value: user.id.toString(),
          active: !!params.get(NOT_GUESSED_BY_FILTER),
        },
        {
          id: AUTHOR_FILTER,
          label: t("authored"),
          value: user.id.toString(),
          active: !!params.get(AUTHOR_FILTER),
        },
        {
          id: UPVOTED_BY_FILTER,
          label: t("upvoted"),
          value: user.id.toString(),
          active: !!params.get(UPVOTED_BY_FILTER),
        },
        {
          id: COMMENTED_BY_FILTER,
          label: t("moderating"),
          value: user.id.toString(),
          active: !!params.get(COMMENTED_BY_FILTER),
        },
      ],
    });
  }

  filters.push({
    id: ACCESS_FILTER,
    title: t("visibility"),
    type: FilterOptionType.ToggleChip,
    options: [
      {
        id: ACCESS_FILTER,
        label: t("public"),
        value: "public",
        active: params.get(ACCESS_FILTER) === "public",
      },
      {
        id: ACCESS_FILTER,
        label: t("private"),
        value: "private",
        active: params.get(ACCESS_FILTER) === "private",
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
  if (id === CATEGORIES_FILTER) {
    return "olive";
  }

  return "blue";
}
