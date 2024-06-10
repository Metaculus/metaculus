import classNames from "classnames";
import { useTranslations } from "next-intl";

import {
  FilterOptionType,
  FilterSection,
} from "@/components/popover_filter/types";
import { GroupButton } from "@/components/ui/button_group";
import { ChipColor } from "@/components/ui/chip";
import { SelectOption } from "@/components/ui/select";
import {
  QUESTION_ACCESS_FILTER,
  QUESTION_AUTHOR_FILTER,
  QUESTION_CATEGORIES_FILTER,
  QUESTION_COMMENTED_BY_FILTER,
  QUESTION_GUESSED_BY_FILTER,
  QUESTION_NOT_GUESSED_BY_FILTER,
  QUESTION_ORDER_BY_FILTER,
  QUESTION_TYPE_FILTER,
  QUESTION_STATUS_FILTER,
  QUESTION_TAGS_FILTER,
  QUESTION_TEXT_SEARCH_FILTER,
  QUESTION_TOPIC_FILTER,
  QUESTION_UPVOTED_BY_FILTER,
} from "@/constants/questions_feed";
import { QuestionsParams } from "@/services/questions";
import { SearchParams } from "@/types/navigation";
import { Category, Tag } from "@/types/projects";
import { QuestionOrder, QuestionStatus, QuestionType } from "@/types/question";
import { CurrentUser } from "@/types/users";

// TODO: translate
const QUESTION_TYPE_LABEL_MAP = {
  [QuestionType.Numeric]: "Numeric",
  [QuestionType.Date]: "Date",
  [QuestionType.MultipleChoice]: "Multiple Choice",
  [QuestionType.Binary]: "Binary",
};

// TODO: translate
const QUESTION_STATUS_LABEL_MAP = {
  [QuestionStatus.Active]: "Open",
  [QuestionStatus.Resolved]: "Resolved",
  [QuestionStatus.Closed]: "Closed",
};

export function generateFiltersFromSearchParams(
  searchParams: SearchParams
): QuestionsParams {
  const filters: QuestionsParams = {};

  if (typeof searchParams[QUESTION_TEXT_SEARCH_FILTER] === "string") {
    filters.search = searchParams[QUESTION_TEXT_SEARCH_FILTER];
  }

  if (typeof searchParams[QUESTION_TOPIC_FILTER] === "string") {
    filters.topic = searchParams[QUESTION_TOPIC_FILTER];
  }

  if (searchParams[QUESTION_TYPE_FILTER]) {
    filters.forecast_type = searchParams[QUESTION_TYPE_FILTER];
  }

  if (searchParams[QUESTION_STATUS_FILTER]) {
    filters.status = searchParams[QUESTION_STATUS_FILTER];
  }

  if (searchParams[QUESTION_CATEGORIES_FILTER]) {
    filters.categories = searchParams[QUESTION_CATEGORIES_FILTER];
  }

  if (searchParams[QUESTION_TAGS_FILTER]) {
    filters.tags = searchParams[QUESTION_TAGS_FILTER];
  }

  if (typeof searchParams[QUESTION_GUESSED_BY_FILTER] === "string") {
    filters.guessed_by = searchParams[QUESTION_GUESSED_BY_FILTER];
  }
  if (typeof searchParams[QUESTION_AUTHOR_FILTER] === "string") {
    filters.author = searchParams[QUESTION_AUTHOR_FILTER];
  }
  if (typeof searchParams[QUESTION_UPVOTED_BY_FILTER] === "string") {
    filters.upvoted_by = searchParams[QUESTION_UPVOTED_BY_FILTER];
  }
  if (typeof searchParams[QUESTION_COMMENTED_BY_FILTER] === "string") {
    filters.commented_by = searchParams[QUESTION_COMMENTED_BY_FILTER];
  }
  if (typeof searchParams[QUESTION_NOT_GUESSED_BY_FILTER] === "string") {
    filters.not_guessed_by = searchParams[QUESTION_NOT_GUESSED_BY_FILTER];
  }

  if (typeof searchParams[QUESTION_ACCESS_FILTER] === "string") {
    filters.access = searchParams[QUESTION_ACCESS_FILTER];
  }

  if (typeof searchParams[QUESTION_ORDER_BY_FILTER] === "string") {
    filters.order_by = searchParams[QUESTION_ORDER_BY_FILTER];
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
      id: QUESTION_STATUS_FILTER,
      title: t("questionStatus"),
      type: FilterOptionType.MultiChip,
      options: Object.values(QuestionStatus).map((status) => ({
        label: QUESTION_STATUS_LABEL_MAP[status],
        value: status,
        active: params.getAll(QUESTION_STATUS_FILTER).includes(status),
      })),
    },
    {
      id: QUESTION_CATEGORIES_FILTER,
      title: t("category"),
      type: FilterOptionType.Combobox,
      options: categories.map((category) => ({
        label: category.name,
        value: category.slug,
        active: params
          .getAll(QUESTION_CATEGORIES_FILTER)
          .includes(category.slug),
      })),
      chipColor: getFilterChipColor(QUESTION_CATEGORIES_FILTER),
    },
    {
      id: QUESTION_TAGS_FILTER,
      title: t("tags"),
      type: FilterOptionType.Combobox,
      options: tags.map((tag) => ({
        label: tag.name,
        value: tag.slug,
        active: params.getAll(QUESTION_TAGS_FILTER).includes(tag.slug),
      })),
      chipColor: getFilterChipColor(QUESTION_TAGS_FILTER),
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
          id: QUESTION_GUESSED_BY_FILTER,
          label: t("predicted"),
          value: user.id.toString(),
          active: !!params.get(QUESTION_GUESSED_BY_FILTER),
        },
        {
          id: QUESTION_NOT_GUESSED_BY_FILTER,
          label: t("notPredicted"),
          value: user.id.toString(),
          active: !!params.get(QUESTION_NOT_GUESSED_BY_FILTER),
        },
        {
          id: QUESTION_AUTHOR_FILTER,
          label: t("authored"),
          value: user.id.toString(),
          active: !!params.get(QUESTION_AUTHOR_FILTER),
        },
        {
          id: QUESTION_UPVOTED_BY_FILTER,
          label: t("upvoted"),
          value: user.id.toString(),
          active: !!params.get(QUESTION_UPVOTED_BY_FILTER),
        },
        {
          id: QUESTION_COMMENTED_BY_FILTER,
          label: t("moderating"),
          value: user.id.toString(),
          active: !!params.get(QUESTION_COMMENTED_BY_FILTER),
        },
      ],
    });
  }

  filters.push({
    id: QUESTION_ACCESS_FILTER,
    title: t("visibility"),
    type: FilterOptionType.ToggleChip,
    options: [
      {
        id: QUESTION_ACCESS_FILTER,
        label: t("public"),
        value: "public",
        active: params.get(QUESTION_ACCESS_FILTER) === "public",
      },
      {
        id: QUESTION_ACCESS_FILTER,
        label: t("private"),
        value: "private",
        active: params.get(QUESTION_ACCESS_FILTER) === "private",
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
  if (id === QUESTION_CATEGORIES_FILTER) {
    return "olive";
  }

  return "blue";
}
