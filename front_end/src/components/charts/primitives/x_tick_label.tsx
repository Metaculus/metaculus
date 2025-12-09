import { ComponentProps, FC } from "react";
import { VictoryLabel } from "victory";

type Props = ComponentProps<typeof VictoryLabel> & {
  chartWidth: number;
  withCursor?: boolean;
  fontSize?: number;
  dx?: number;
};

const XTickLabel: FC<Props> = ({
  chartWidth,
  withCursor,
  fontSize = 10,
  dx = 0,
  ...props
}) => {
  const text = props.text?.toString() ?? "";
  const estimatedTextWidth = (text.length * fontSize) / 2;

  const x = (props.x ?? 0) + dx;

  const overlapsRightEdge = withCursor
    ? x > chartWidth - estimatedTextWidth
    : x > chartWidth - 12;

  if (overlapsRightEdge) {
    return null;
  }

  return (
    <VictoryLabel
      {...props}
      dx={dx}
      style={{
        ...(props.style ?? {}),
        fontSize,
      }}
    />
  );
};

export default XTickLabel;
