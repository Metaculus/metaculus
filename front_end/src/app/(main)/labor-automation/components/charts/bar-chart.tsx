import TimeSeriesChart from "@/components/consumer_post_card/time_series_chart";
import { QuestionWithNumericForecasts } from "@/types/question";

export function BarChart({
  questions,
}: {
  questions: QuestionWithNumericForecasts[];
}) {
  return <TimeSeriesChart questions={questions} variant="default" />;
}
