import { render, screen, within } from "@testing-library/react";

import ConditionalChart from "@/components/conditional_tile/conditional_chart";
import { HideCPContext } from "@/contexts/cp_context";
import { ConditionalPost } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";

import EmbedQuestionPlot from "../embed_question_plot";

jest.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
jest.mock("@/components/detailed_question_card/detailed_question_card", () =>
  jest.fn(() => <div>single question</div>)
);
jest.mock("@/components/detailed_question_card/detailed_group_card", () =>
  jest.fn(() => <div>question group</div>)
);
jest.mock("@/components/conditional_tile/conditional_chart", () =>
  jest.fn(({ question, disabled }) => (
    <div data-testid="branch-chart" data-disabled={disabled}>
      {question.type}: {question.id}
    </div>
  ))
);

function conditional(type = QuestionType.Binary) {
  return {
    id: 1,
    title: "Conditional forecast",
    conditional: {
      condition: { title: "Does the condition happen?", resolution: null },
      condition_child: { title: "What is the outcome?" },
      question_yes: { id: 2, type, resolution: null },
      question_no: { id: 3, type, resolution: null },
    },
  } as ConditionalPost<QuestionWithNumericForecasts>;
}

describe("conditional embeds", () => {
  it.each([QuestionType.Binary, QuestionType.Numeric, QuestionType.Date])(
    "renders both %s branches through the embed dispatcher",
    (type) => {
      render(<EmbedQuestionPlot post={conditional(type)} />);
      expect(
        screen.getByText("Does the condition happen?")
      ).toBeInTheDocument();
      expect(screen.getByText("What is the outcome?")).toBeInTheDocument();
      expect(
        within(screen.getByRole("region", { name: "ifYes" })).getByTestId(
          "branch-chart"
        )
      ).toHaveTextContent(`${type}: 2`);
      expect(
        within(screen.getByRole("region", { name: "ifNo" })).getByTestId(
          "branch-chart"
        )
      ).toHaveTextContent(`${type}: 3`);
    }
  );

  it("preserves an annulled branch and forwards hidden-CP and partner theme", () => {
    const post = conditional();
    post.conditional.question_no.resolution = "annulled";
    const theme = {
      container: {},
      card: {},
      predictionChip: {},
      chart: { line: { style: { data: { stroke: "#123456" } } } },
    };
    render(
      <HideCPContext.Provider
        value={{ hideCP: true, setCurrentHideCP: jest.fn() }}
      >
        <EmbedQuestionPlot post={post} theme={theme} />
      </HideCPContext.Provider>
    );
    expect(
      within(screen.getByRole("region", { name: "ifNo" })).getByTestId(
        "branch-chart"
      )
    ).toHaveAttribute("data-disabled", "true");
    expect(jest.mocked(ConditionalChart).mock.calls).toEqual(
      expect.arrayContaining([
        [
          expect.objectContaining({
            question: post.conditional.question_yes,
            hideCP: true,
            chartTheme: theme.chart,
            disabled: false,
          }),
          undefined,
        ],
        [
          expect.objectContaining({
            question: post.conditional.question_no,
            hideCP: true,
            chartTheme: theme.chart,
            disabled: true,
          }),
          undefined,
        ],
      ])
    );
  });
});
