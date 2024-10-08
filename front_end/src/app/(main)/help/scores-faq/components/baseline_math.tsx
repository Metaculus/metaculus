"use client";

import React from "react";

import MathJaxContent from "@/components/math_jax_content";

import StyledDisclosure from "../../../components/styled_disclosure";

const BaselineMath = () => {
  return (
    <StyledDisclosure question="Baseline score math">
      <p>
        The Baseline scores are rescaled{" "}
        <a href="/help/scores-faq/#log-score">log scores</a>, with the general
        form:
      </p>
      <MathJaxContent
        content={`\\[
            \\text{Baseline score} = 100 \\times 
            \\frac{
            \\operatorname{log\\ score}(prediction) - \\operatorname{log\\ score}(baseline)
            }{
            \\text{scale}
            }
          \\]`}
      />
      <p>
        For binary and multiple choice questions, the{" "}
        <MathJaxContent content={`\\(scale\\)`} /> is chosen so that a perfect
        prediction (<MathJaxContent content={`\\(P(outcome) = 100 \\%\\)`} />)
        gives a score of +100. The formula for a binary question is:
      </p>
      <MathJaxContent
        content={`\\[
            \\text{binary Baseline score} = 100 \\times \\frac{ \\ln(P(outcome)) - \\ln(50 \\%) }{ \\ln(2)}
          \\]`}
      />
      <p>
        Note that you can rearrange this formula into:{" "}
        <MathJaxContent
          content={`\\(100 \\times(\\log_2(P(outcome)) + 1)\\)`}
        />
        .
      </p>
      <p>The formula for a multiple choice question with N options is:</p>
      <MathJaxContent
        content={`\\[
            \\text{multiple choice Baseline score} = 100 \\times \\frac{ \\ln(P(outcome)) - \\ln(\\frac{ 1}{ N}) }{ \\ln(N)}
          \\]`}
      />
      <p>
        For continuous questions, the <MathJaxContent content={`\\(scale\\)`} />{" "}
        was chosen empirically so that continuous scores have roughly the same
        average as binary scores. The formula for a continuous question is:
      </p>
      <MathJaxContent
        content={`\\[
            \\text{continuous Baseline score} = 100 \\times \\frac{ \\ln(\\operatorname{pdf}(outcome)) - \\ln(baseline) }{ 2 }
          \\]`}
      />
      <p>
        Where <MathJaxContent content={`\\(\\ln\\)`} /> is the natural
        logarithm, <MathJaxContent content={`\\(P(outcome)\\)`} /> is the
        probability predicted for the outcome that actually happened, and{" "}
        <MathJaxContent content={`\\(\\operatorname{pdf}(outcome)\\)`} /> is the
        value of the predicted probability density function at the outcome.
      </p>
      <p>
        The continuous <MathJaxContent content={`\\(baseline\\)`} /> depends on
        whether the question has open or closed bounds:
      </p>
      <ul className="list-disc pl-5">
        <li>
          If both bounds are closed, the{" "}
          <MathJaxContent content={`\\(baseline\\)`} /> is 1, corresponding to a
          uniform distribution in range.
        </li>
        <li>
          If one bound is open, the{" "}
          <MathJaxContent content={`\\(baseline\\)`} /> is 0.95, corresponding
          to a uniform distribution in range + 5% probability out of the open
          bound.
        </li>
        <li>
          If both bounds are open, the{" "}
          <MathJaxContent content={`\\(baseline\\)`} /> is 0.9, corresponding to
          a uniform distribution in range + 5% probability out of each open
          bound.
        </li>
      </ul>
    </StyledDisclosure>
  );
};

export default BaselineMath;
