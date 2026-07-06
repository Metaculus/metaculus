import {
  ContinuousQuestionTypes,
  getEffectiveVisibleCount,
} from "@/constants/questions";
import { GroupOfQuestionsPost, PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

export enum ExportableChartType {
  RadialForecast = "radial_forecast",
  ForecastTimeline = "forecast_timeline",
  Histogram = "histogram",
  FullSizePdf = "full_size_pdf",
  FullSizeCdf = "full_size_cdf",
  TableTop4 = "table_top4",
  FullTable = "full_table",
  Timeline = "timeline",
}

export type ExportableConfig = {
  chartTypes: ExportableChartType[];
};

const BINARY_CHART_TYPES = [
  ExportableChartType.RadialForecast,
  ExportableChartType.ForecastTimeline,
  ExportableChartType.Histogram,
];

const CONTINUOUS_CHART_TYPES = [
  ExportableChartType.FullSizePdf,
  ExportableChartType.FullSizeCdf,
  ExportableChartType.ForecastTimeline,
];

export const EXPORT_DIMENSIONS: Record<
  ExportableChartType,
  { width: number; height: number }
> = {
  [ExportableChartType.RadialForecast]: { width: 288, height: 172 },
  [ExportableChartType.ForecastTimeline]: { width: 380, height: 140 },
  [ExportableChartType.Histogram]: { width: 539, height: 113 },
  [ExportableChartType.FullSizePdf]: { width: 381, height: 141 },
  [ExportableChartType.FullSizeCdf]: { width: 381, height: 141 },
  [ExportableChartType.TableTop4]: { width: 510, height: 307 },
  [ExportableChartType.FullTable]: { width: 510, height: 600 },
  [ExportableChartType.Timeline]: { width: 573, height: 181 },
};

export const CHART_TYPE_TRANSLATION_KEYS: Record<ExportableChartType, string> =
  {
    [ExportableChartType.RadialForecast]: "radialForecastDisplay",
    [ExportableChartType.ForecastTimeline]: "forecastTimeline",
    [ExportableChartType.Histogram]: "histogram",
    [ExportableChartType.FullSizePdf]: "fullSizePdf",
    [ExportableChartType.FullSizeCdf]: "fullSizeCdf",
    [ExportableChartType.TableTop4]: "tableWithTop4",
    [ExportableChartType.FullTable]: "fullTable",
    [ExportableChartType.Timeline]: "timeline",
  };

function getGroupAllChartTypes(totalOptions: number): ExportableChartType[] {
  const effectiveVisible = getEffectiveVisibleCount(totalOptions);
  const types: ExportableChartType[] = [];

  if (effectiveVisible < totalOptions) {
    types.push(ExportableChartType.TableTop4);
  }
  types.push(ExportableChartType.FullTable);
  types.push(ExportableChartType.Timeline);

  return types;
}

export function getExportableConfig(post: PostWithForecasts): ExportableConfig {
  if (isQuestionPost(post)) {
    const questionType = post.question.type;

    if (questionType === QuestionType.MultipleChoice) {
      const totalOptions = (post.question.options ?? []).length;
      return { chartTypes: getGroupAllChartTypes(totalOptions) };
    }

    if (questionType === QuestionType.Binary) {
      return { chartTypes: BINARY_CHART_TYPES };
    }

    if (
      (ContinuousQuestionTypes as readonly QuestionType[]).includes(
        questionType
      )
    ) {
      return { chartTypes: CONTINUOUS_CHART_TYPES };
    }
  }

  if (isGroupOfQuestionsPost(post)) {
    const groupPost =
      post as GroupOfQuestionsPost<QuestionWithNumericForecasts>;
    const questions = groupPost.group_of_questions.questions;
    return { chartTypes: getGroupAllChartTypes(questions.length) };
  }

  if (isConditionalPost(post)) {
    return { chartTypes: getGroupAllChartTypes(2) };
  }

  return { chartTypes: [] };
}

export function getExportQuestion(
  post: PostWithForecasts
): QuestionWithNumericForecasts | null {
  if (isQuestionPost(post)) {
    return post.question as unknown as QuestionWithNumericForecasts;
  }
  return null;
}
