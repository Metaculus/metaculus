"use client";

import React from "react";

import KatexRenderer from "@/components/katex_renderer";

import StyledDisclosure from "../../../components/styled_disclosure";

const PointsMath = () => {
  return (
    <StyledDisclosure question="Metaculus points math">
      <p>
        Your score <KatexRenderer equation="S(T,o)" inline /> at any given time{" "}
        <KatexRenderer equation="T" inline /> is the sum of an
        &quot;absolute&quot; component and a &quot;relative&quot; component:
      </p>
      <KatexRenderer
        equation="S(T,o) = a(N) \times L(p,o) + b(N) \times B(p,o)"
        inline={false}
      />
      <p>where:</p>
      <ul className="ml-5 list-disc">
        <li>
          <KatexRenderer equation="o" inline /> is the outcome of the question:
          1 if the question resolves positive, 0 if it resolves negative.
        </li>
        <li>
          <KatexRenderer equation="N" inline /> is the number of forecasters on
          the question.
        </li>
        <li>
          <KatexRenderer equation="L(p,o)" inline /> is the log score relative
          to a 50% prior, defined as:
        </li>
      </ul>
      <KatexRenderer
        equation="L(p, o) =
  \begin{cases}
  \log_2 \left ( \frac{p}{0.5} \right ) & \text{if } o = 1 \\
  \log_2 \left ( \frac{1 - p}{0.5} \right ) & \text{if } o = 0
  \end{cases}"
        inline={false}
      />
      <ul className="ml-5 list-disc">
        <li>
          <KatexRenderer equation="B(p,o)" inline /> is the betting score and
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
          <KatexRenderer equation="a(N)" inline /> and{" "}
          <KatexRenderer equation="b(N)" inline /> depend on{" "}
          <KatexRenderer equation="N" inline /> only and define how the points
          scale with the number of forecasters.
        </li>
      </ul>
      <KatexRenderer
        equation="\begin{align*}
  A(N) &= 45 + 15 \log_2(1 + N/30) \\
  B(N) &= 30 \log_2(1 + N/30)
  \end{align*}"
        inline={false}
      />
      <p>
        Note that <KatexRenderer equation="B" inline />,{" "}
        <KatexRenderer equation="N" inline />, and{" "}
        <KatexRenderer equation="p" inline /> can all depend on{" "}
        <KatexRenderer equation="T" inline /> and contribute to the
        time-dependence of <KatexRenderer equation="S(T, o)" inline />.
      </p>
      <p>
        Your final score is given by the integral of{" "}
        <KatexRenderer equation="S(T, o)" inline /> over{" "}
        <KatexRenderer equation="T" inline />:
      </p>
      <KatexRenderer
        equation="S = \frac{1}{t_c-t_o} \int_{t_o}^{t_c} S(T, o) \, dT"
        inline={false}
      />
      <p>
        where <KatexRenderer equation="t_o" inline /> and{" "}
        <KatexRenderer equation="t_c" inline /> are the opening and closing
        times. (Note that <KatexRenderer equation="S(T) = 0" inline /> between
        the opening time and your first prediction, and is also zero after
        question resolution but before question close, in the case when a
        question resolves early.)
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
