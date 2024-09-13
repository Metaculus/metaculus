import React from "react";

interface Step5Props {
  onPrev: () => void;
  onNext: () => void;
}

const Step5: React.FC<Step5Props> = ({ onPrev, onNext }) => (
  <div className="w-[560px]">
    <h2>Step 5</h2>
    <button onClick={onPrev}>Back</button>
    <button onClick={onNext}>Next</button>
  </div>
);

export default Step5;
