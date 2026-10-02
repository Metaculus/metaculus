import { render, screen, within } from "@testing-library/react";

import EmbedQuestionPlot from "@/app/(embed)/questions/components/embed_question_plot";
import ConsumerPostCard from "@/components/consumer_post_card";
import { HideCPContext } from "@/contexts/cp_context";
import { ConditionalPost, PostStatus } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { getPostShortTitle } from "@/utils/questions/helpers";

import CompactConditionalTile from "../compact_conditional_tile";

jest.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
jest.mock(
  "@/app/(main)/questions/components/coherence_links/coherence_prediction_tile",
  () =>
    jest.fn(({ question, colorOverride }) => (
      <div data-testid="branch-forecast" data-color={colorOverride}>
        {question.type}: {question.id}
      </div>
    ))
);
jest.mock("@/components/prediction_chip", () =>
  jest.fn(({ status }) => <div data-testid="condition-chip">{status}</div>)
);
jest.mock("@/components/consumer_post_card/upcoming_cp", () =>
  jest.fn(() => <div data-testid="upcoming-cp" />)
);
jest.mock(
  "@/components/consumer_post_card/basic_consumer_post_card",
  () =>
    function BasicConsumerPostCard({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return <div>{children}</div>;
    }
);
jest.mock("@/components/detailed_question_card/detailed_question_card", () =>
  jest.fn(() => <div>single question</div>)
);
jest.mock("@/components/detailed_question_card/detailed_group_card", () =>
  jest.fn(() => <div>question group</div>)
);

const aggregations = {
  recency_weighted: { latest: null, history: [{ centers: [0.4] }] },
};

function conditional(type = QuestionType.Binary) {
  const branch = (id: number) => ({
    id,
    type,
    resolution: null,
    default_aggregation_method: "recency_weighted",
    aggregations,
  });
  return {
    id: 1,
    title: "Does the condition happen? → What is the outcome?",
    status: PostStatus.APPROVED,
    conditional: {
      condition: { title: "Does the condition happen?", resolution: null },
      condition_child: { title: "What is the outcome?" },
      question_yes: branch(2),
      question_no: branch(3),
    },
  } as unknown as ConditionalPost<QuestionWithNumericForecasts>;
}

const branch = (name: "ifYes" | "ifNo") =>
  within(screen.getByRole("region", { name }));

function renderWithHiddenCP(node: React.ReactNode) {
  return render(
    <HideCPContext.Provider
      value={{ hideCP: true, setCurrentHideCP: jest.fn() }}
    >
      {node}
    </HideCPContext.Provider>
  );
}

describe("CompactConditionalTile", () => {
  it.each([QuestionType.Binary, QuestionType.Numeric, QuestionType.Date])(
    "renders the condition and both %s branches",
    (type) => {
      render(<CompactConditionalTile post={conditional(type)} />);
      expect(
        screen.getByText("Does the condition happen?")
      ).toBeInTheDocument();
      expect(branch("ifYes").getByTestId("branch-forecast")).toHaveTextContent(
        `${type}: 2`
      );
      expect(branch("ifNo").getByTestId("branch-forecast")).toHaveTextContent(
        `${type}: 3`
      );
    }
  );

  it("shows the condition's resolution and keeps an annulled branch", () => {
    const post = conditional();
    post.conditional.condition.resolution = "yes";
    post.conditional.question_yes.resolution = "yes";
    post.conditional.question_no.resolution = "annulled";
    render(<CompactConditionalTile post={post} />);
    expect(screen.getByTestId("condition-chip")).toHaveTextContent(
      PostStatus.RESOLVED
    );
    expect(branch("ifNo").getByTestId("branch-forecast")).toHaveTextContent(
      "binary: 3"
    );
  });

  it("hides continuous values when CP is hidden but lets the gauge hide itself", () => {
    renderWithHiddenCP(
      <CompactConditionalTile post={conditional(QuestionType.Numeric)} />
    );
    expect(screen.queryByTestId("branch-forecast")).not.toBeInTheDocument();
    expect(screen.getAllByText("hidden")).toHaveLength(2);

    renderWithHiddenCP(<CompactConditionalTile post={conditional()} />);
    expect(screen.getAllByTestId("branch-forecast")).toHaveLength(2);
  });

  it("shows the reveal time or empty state instead of a forecast", () => {
    const post = conditional();
    post.conditional.question_yes.cp_reveal_time = new Date(
      Date.now() + 86_400_000
    ).toISOString();
    Object.assign(post.conditional.question_no, {
      aggregations: { recency_weighted: { latest: undefined, history: [] } },
    });
    render(<CompactConditionalTile post={post} />);
    expect(branch("ifYes").getByTestId("upcoming-cp")).toBeInTheDocument();
    expect(branch("ifNo").getByText("noForecastsYet")).toBeInTheDocument();
  });
});

describe("conditional dispatch", () => {
  it("renders branches in the consumer feed card", () => {
    render(<ConsumerPostCard post={conditional()} />);
    expect(screen.getAllByTestId("branch-forecast")).toHaveLength(2);
  });

  it("renders branches in embeds with the partner accent color", () => {
    const theme = {
      container: {},
      card: {},
      predictionChip: {},
      chart: { line: { style: { data: { stroke: "#123456" } } } },
    };
    render(<EmbedQuestionPlot post={conditional()} theme={theme} />);
    for (const forecast of screen.getAllByTestId("branch-forecast")) {
      expect(forecast).toHaveAttribute("data-color", "#123456");
    }
  });
});

describe("getPostShortTitle", () => {
  it("names a conditional by its outcome, not its prefixed short title", () => {
    const post = conditional();
    Object.assign(post, { short_title: "Conditional What is the outcome?" });
    expect(getPostShortTitle(post)).toBe("What is the outcome?");

    Object.assign(post.conditional.condition_child, {
      short_title: "Outcome?",
    });
    expect(getPostShortTitle(post)).toBe("Outcome?");
  });
});
