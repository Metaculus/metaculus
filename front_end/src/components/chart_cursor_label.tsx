import { ComponentProps, FC } from "react";
import { VictoryLabel } from "victory";

const FONT_SIZE = 10;

type Props = ComponentProps<typeof VictoryLabel> & {
  positionY: number;
};

const ChartCursorLabel: FC<Props> = ({ positionY, ...props }) => {
  const estimatedTextWidth = (props.text?.toString().length ?? 0) * FONT_SIZE;
  const centeredX = (props.x ?? 0) - estimatedTextWidth / 4;
  return (
    <VictoryLabel
      {...props}
      style={{
        ...(props.style ?? {}),
        fontSize: FONT_SIZE,
      }}
      y={positionY}
      x={centeredX}
    />
  );
};

export default ChartCursorLabel;
