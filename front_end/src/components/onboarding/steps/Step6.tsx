import React from "react";

interface Step6Props {
  onPrev: () => void;
  onNext: () => void;
}

const Step6: React.FC<Step6Props> = ({ onPrev, onNext }) => (
  <div className="w-[560px]">
    <h2>Step 6</h2>
    <button onClick={onPrev}>Back</button>
    <button onClick={onNext}>Next</button>
  </div>
);

export default Step6;
