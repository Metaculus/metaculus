"use client";

import React from "react";

import StyledDisclosure from "../../../components/styled_disclosure";

const FurtherMath = () => {
  return (
    <StyledDisclosure question="Further math details for nerds">
      <p>
        If you have an intuition that something should be 0 and not positive,
        you are correct! The average Peer score across all users is guaranteed
        to be 0. This does not imply that the score of the average (or median)
        forecast is 0: the score of the mean is not the mean of the scores.
      </p>
      <p></p>
      <p>
        There is another reason why the Peer score of the Community Prediction
        is positive: you can rearrange the Peer score formula to show that it is
        the difference between the forecaster log score and the log score of the
        geometric mean of all other forecasters. Since the median will be higher
        than the geometric mean in most cases, it follows that the score of the
        Community Prediction will be positive in most cases.
      </p>
    </StyledDisclosure>
  );
};

export default FurtherMath;
