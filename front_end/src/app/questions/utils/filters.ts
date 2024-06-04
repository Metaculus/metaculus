import classNames from "classnames";
import { useTranslations } from "next-intl";

import {
  QUESTION_STATUS_LABEL_MAP,
  QUESTION_TYPE_LABEL_MAP,
} from "@/app/questions/constants/filters";
import {
  ACCESS_FILTER,
  AUTHOR_FILTER,
  CATEGORIES_FILTER,
  COMMENTED_BY_FILTER,
  GUESSED_BY_FILTER,
  NOT_GUESSED_BY_FILTER,
  QUESTION_TYPE_FILTER,
  STATUS_FILTER,
  TAGS_FILTER,
  UPVOTED_BY_FILTER,
} from "@/app/questions/constants/query_params";
import {
  FilterOptionType,
  FilterSection,
} from "@/components/popover_filter/types";
import { GroupButton } from "@/components/ui/button_group";
import { ChipColor } from "@/components/ui/chip";
import { SelectOption } from "@/components/ui/select";
import { Category, Tag } from "@/types/projects";
import { QuestionOrder, QuestionStatus, QuestionType } from "@/types/question";
import { CurrentUser } from "@/types/users";

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
