"use client";

import Link from "next/link";
import React from "react";

import KatexRenderer from "@/components/katex_renderer";

import StyledDisclosure from "../../../components/styled_disclosure";

const BaselineMath = () => {
  return (
    <StyledDisclosure question="Baseline score math">
      <p>
        The Baseline scores are rescaled{" "}
        <Link href="/help/scores-faq/#log-score">log scores</Link>, with the
        general form:
      </p>
      <KatexRenderer
        equation="\text{Baseline score} = 100 \times
            \frac{
            \operatorname{log\ score}(prediction) - \operatorname{log\ score}(baseline)
            }{
            \text{scale}
            }"
        inline={false}
      />
      <p>
        For binary and multiple choice questions, the{" "}
        <KatexRenderer equation="scale" inline /> is chosen so that a perfect
        prediction (<KatexRenderer equation="P(outcome) = 100 \%" inline />)
        gives a score of +100. The formula for a binary question is:
      </p>
      <KatexRenderer
        equation="\text{binary Baseline score} = 100 \times \frac{ \ln(P(outcome)) - \ln(50 \%) }{ \ln(2)}"
        inline={false}
      />
      <p>
        Note that you can rearrange this formula into:{" "}
        <KatexRenderer equation="100 \times(\log_2(P(outcome)) + 1)" inline />.
      </p>
      <p>The formula for a multiple choice question with N options is:</p>
      <KatexRenderer
        equation="\text{multiple choice Baseline score} = 100 \times \frac{ \ln(P(outcome)) - \ln(\frac{ 1}{ N}) }{ \ln(N)}"
        inline={false}
      />
      <p>
        For continuous questions, the <KatexRenderer equation="scale" inline />{" "}
        was chosen empirically so that continuous scores have roughly the same
        average as binary scores. The formula for a continuous question is:
      </p>
      <KatexRenderer
        equation="\text{continuous Baseline score} = 100 \times \frac{ \ln(\operatorname{pdf}(outcome)) - \ln(baseline) }{ 2 }"
        inline={false}
      />
      <p>
        Where <KatexRenderer equation="\ln" inline /> is the natural logarithm,{" "}
        <KatexRenderer equation="P(outcome)" inline /> is the probability
        predicted for the outcome that actually happened, and{" "}
        <KatexRenderer equation="\operatorname{pdf}(outcome)" inline /> is the
        value of the predicted probability density function at the outcome.
      </p>
      <p>
        The continuous <KatexRenderer equation="baseline" inline /> depends on
        whether the question has open or closed bounds:
      </p>
      <ul className="list-disc pl-5">
        <li>
          If both bounds are closed, the{" "}
          <KatexRenderer equation="baseline" inline /> is 1, corresponding to a
          uniform distribution in range.
        </li>
        <li>
          If one bound is open, the <KatexRenderer equation="baseline" inline />{" "}
          is 0.95, corresponding to a uniform distribution in range + 5%
          probability out of the open bound.
        </li>
        <li>
          If both bounds are open, the{" "}
          <KatexRenderer equation="baseline" inline /> is 0.9, corresponding to
          a uniform distribution in range + 5% probability out of each open
          bound.
        </li>
      </ul>
    </StyledDisclosure>
  );
};

export default BaselineMath;
