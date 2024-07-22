import { ComponentProps, FC } from "react";
import { VictoryLabel } from "victory";

const FONT_SIZE = 10;

type Props = ComponentProps<typeof VictoryLabel> & {
  chartWidth: number;
  withCursor?: boolean;
};

const XTickLabel: FC<Props> = ({ chartWidth, withCursor, ...props }) => {
  const estimatedTextWidth =
    ((props.text?.toString().length ?? 0) * FONT_SIZE) / 2;
  const overlapsRightEdge = withCursor
    ? (props.x ?? 0) > chartWidth - estimatedTextWidth
    : (props.x ?? 0) > chartWidth - 12;

  if (overlapsRightEdge) {
    return null;
  }

  return (
    <VictoryLabel
      {...props}
      style={{
        ...(props.style ?? {}),
        fontSize: FONT_SIZE,
      }}
    />
  );
};

export default XTickLabel;
