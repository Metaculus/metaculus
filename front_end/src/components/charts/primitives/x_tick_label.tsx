import { ComponentProps, FC } from "react";
import { VictoryLabel } from "victory";

type Props = ComponentProps<typeof VictoryLabel> & {
  chartWidth: number;
  withCursor?: boolean;
  fontSize?: number;
};

const XTickLabel: FC<Props> = ({
  chartWidth,
  withCursor,
  fontSize = 10,
  ...props
}) => {
  const estimatedTextWidth =
    ((props.text?.toString().length ?? 0) * fontSize) / 2;
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
        fontSize: fontSize,
      }}
    />
  );
};

export default XTickLabel;
