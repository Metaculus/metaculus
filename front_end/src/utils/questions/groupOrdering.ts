import {
  GroupOfQuestionsGraphType,
  PostGroupOfQuestions,
  PostGroupOfQuestionsSubquestionsOrder,
} from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { scaleInternalLocation } from "@/utils/math";

export function sortGroupPredictionOptions<QT>(
  questions: QuestionWithNumericForecasts[],
  group?: PostGroupOfQuestions<QT>
) {
  return [...questions].sort((a, b) => {
    const aMean =
      a.aggregations[a.default_aggregation_method]?.latest?.centers?.[0] ?? 0;
    const bMean =
      b.aggregations[b.default_aggregation_method]?.latest?.centers?.[0] ?? 0;
    const aValueScaled = scaleInternalLocation(aMean, {
      range_min: a.scaling?.range_min ?? 0,
      range_max: a.scaling?.range_max ?? 1,
      zero_point: a.scaling?.zero_point ?? null,
    });
    const bValueScaled = scaleInternalLocation(bMean, {
      range_min: b.scaling?.range_min ?? 0,
      range_max: b.scaling?.range_max ?? 1,
      zero_point: b.scaling?.zero_point ?? null,
    });

    const aResTime = new Date(a.scheduled_resolve_time).getTime();
    const bResTime = new Date(b.scheduled_resolve_time).getTime();

    // Default sorting to CP descending if no order is specified
    if (!group?.subquestions_order) {
      return bValueScaled - aValueScaled;
    }

    let subquestions_order = group?.subquestions_order;

    // If this is a FanGraph, always sort manually
    if (group?.graph_type === GroupOfQuestionsGraphType.FanGraph) {
      subquestions_order = PostGroupOfQuestionsSubquestionsOrder.MANUAL;
    }

    switch (subquestions_order) {
      case PostGroupOfQuestionsSubquestionsOrder.CP_ASC:
        return aValueScaled - bValueScaled;
      case PostGroupOfQuestionsSubquestionsOrder.CP_DESC:
        return bValueScaled - aValueScaled;
      default:
        return (a.group_rank ?? aResTime) - (b.group_rank ?? bResTime);
    }
  });
}
