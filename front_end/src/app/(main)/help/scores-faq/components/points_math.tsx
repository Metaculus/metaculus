"use client";

import React from "react";

import MathJaxContent from "@/components/math_jax_content";

import StyledDisclosure from "../../../components/styled_disclosure";

const PointsMath = () => {
  return (
    <StyledDisclosure question="Metaculus points math">
      <p>
        Your score <MathJaxContent content={`S(T,o)`} /> at any given time{" "}
        <MathJaxContent content={`T`} /> is the sum of an &quot;absolute&quot;
        component and a &quot;relative&quot; component:
      </p>
      <MathJaxContent
        block
        content={`\\[
  S(T,o) = a(N) \\times L(p,o) + b(N) \\times B(p,o)
  \\]`}
      />
      <p>where:</p>
      <ul className="ml-5 list-disc">
        <li>
          <MathJaxContent content={`o`} /> is the outcome of the question: 1 if
          the question resolves positive, 0 if it resolves negative.
        </li>
        <li>
          <MathJaxContent content={`N`} /> is the number of forecasters on the
          question.
        </li>
        <li>
          <MathJaxContent content={`L(p,o)`} /> is the log score relative to a
          50% prior, defined as:
        </li>
      </ul>
      <MathJaxContent
        block
        content={`\\[
  L(p, o) =
  \\begin{cases}
  \\log_2 \\left ( \\frac{p}{0.5} \\right ) & \\text{if } o = 1 \\\\
  \\log_2 \\left ( \\frac{1 - p}{0.5} \\right ) & \\text{if } o = 0
  \\end{cases}
  \\]`}
      />
      <ul className="ml-5 list-disc">
        <li>
          <MathJaxContent content={`B(p,o)`} /> is the betting score and
          represents a bet placed against every other forecaster. It is
          described under &quot;constant pool scoring&quot; on the Metaculus
          scoring demo (but with a modification that for computational
          efficiency, the full distribution of other forecaster predictions is
          replaced by a fitted{" "}
          <a href="https://en.wikipedia.org/wiki/Beta_distribution">
            beta distribution
          </a>
          ).
        </li>
        <li>
          <MathJaxContent content={`a(N)`} /> and{" "}
          <MathJaxContent content={`b(N)`} /> depend on{" "}
          <MathJaxContent content={`N`} /> only and define how the points scale
          with the number of forecasters.
        </li>
      </ul>
      <MathJaxContent
        block
        content={`\\[
  \\begin{align*}
  A(N) &= 45 + 15 \\log_2(1 + N/30) \\\\
  B(N) &= 30 \\log_2(1 + N/30)
  \\end{align*}
  \\]`}
      />
      <p>
        Note that <MathJaxContent content={`B`} />,{" "}
        <MathJaxContent content={`N`} />, and <MathJaxContent content={`p`} />{" "}
        can all depend on <MathJaxContent content={`T`} /> and contribute to the
        time-dependence of <MathJaxContent content={`S(T, o)`} />.
      </p>
      <p>
        Your final score is given by the integral of{" "}
        <MathJaxContent content={`S(T, o)`} /> over{" "}
        <MathJaxContent content={`T`} />:
      </p>
      <MathJaxContent
        block
        content={`\\[
  S = \\frac{1}{t_c-t_o} \\int_{t_o}^{t_c} S(T, o) \\, dT
  \\]`}
      />
      <p>
        where <MathJaxContent content={`t_o`} /> and{" "}
        <MathJaxContent content={`t_c`} /> are the opening and closing times.
        (Note that <MathJaxContent content={`S(T) = 0`} /> between the opening
        time and your first prediction, and is also zero after question
        resolution but before question close, in the case when a question
        resolves early.)
      </p>
      <p>
        Before May 2022, there was also a 50% point bonus given at the time the
        question closes, but it was discontinued and the points multiplied by
        1.5 henceforth.
      </p>
    </StyledDisclosure>
  );
};

export default PointsMath;
