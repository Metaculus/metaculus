"use client";

import React from "react";

import StyledDisclosure from "../../../components/styled_disclosure";
import MathJaxContent from "@/components/math_jax_content";

const PeerMath = () => {
  return (
    <StyledDisclosure question="Peer score math">
      <p>
        The Peer scores are built on{" "}
        <a href="/help/scores-faq/#log-score">log scores</a>, with the general
        form:
      </p>
      <MathJaxContent
        block
        content={`\\[
    \\text{Peer score} = 100 \\times \\frac{1}{N} \\sum_{i = 1}^N \\operatorname{log\\ score}(p) - \\operatorname{log\\ score}(p_i)
  \\]`}
      />
      <p>
        Where <MathJaxContent content={`\\(p\\)`} /> is the scored prediction,{" "}
        <MathJaxContent content={`\\(N\\)`} /> is the number of other
        predictions, and <MathJaxContent content={`\\(p_i\\)`} /> is the i-th
        other prediction.
      </p>
      <p>Note that this can be rearranged into:</p>
      <MathJaxContent
        block
        content={`\\[
    \\text{Peer score} = 100 \\times (\\ln(p) - \\ln(\\operatorname{GM}(p_i)))
  \\]`}
      />
      <p>
        Where{" "}
        <a href="https://en.wikipedia.org/wiki/Geometric_mean">
          <MathJaxContent content={`\\(\\operatorname{GM}(p_i)\\)`} />
        </a>{" "}
        is the geometric mean of all other predictions.
      </p>
      <p>
        As before, for binary questions <MathJaxContent content={`\\(p\\)`} />{" "}
        is the probability given to the correct outcome (Yes or No), for
        multiple choice questions it is the probability given to the option
        outcome that resolved Yes, and for continuous questions it is the value
        of the predicted pdf at the outcome.
      </p>
    </StyledDisclosure>
  );
};

export default PeerMath;
