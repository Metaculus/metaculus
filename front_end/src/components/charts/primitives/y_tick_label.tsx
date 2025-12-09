import { ComponentProps, FC } from "react";
import { VictoryLabel } from "victory";

type Props = ComponentProps<typeof VictoryLabel> & {
  nudgeTop?: number;
  nudgeBottom?: number;
};

const YTickLabel: FC<Props> = ({ nudgeTop = 0, nudgeBottom = 0, ...props }) => {
  const text = props.text?.toString();

  let extraDy = 0;

  if (text === "100%") extraDy = nudgeTop;
  if (text === "0%") extraDy = -nudgeBottom;

  const baseDy = typeof props.dy === "number" ? props.dy : 0;
  return <VictoryLabel {...props} dy={baseDy + extraDy} />;
};

export default YTickLabel;
