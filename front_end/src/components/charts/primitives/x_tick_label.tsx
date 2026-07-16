import { ComponentProps, FC } from "react";
import { VictoryLabel } from "victory";

type Props = ComponentProps<typeof VictoryLabel> & {
  chartWidth: number;
  fontSize?: number;
  dx?: number;
};

const XTickLabel: FC<Props> = ({
  chartWidth,
  fontSize = 10,
  dx = 0,
  ...props
}) => {
  const text = props.text?.toString() ?? "";
  const estimatedTextWidth = (text.length * fontSize) / 2;

  const x = (props.x ?? 0) + dx;

  let textAnchor: "start" | "middle" | "end" = "middle";
  if (x - estimatedTextWidth < 0) {
    textAnchor = "start";
  } else if (x > chartWidth - estimatedTextWidth) {
    textAnchor = "end";
  }

  return (
    <VictoryLabel
      {...props}
      dx={dx}
      textAnchor={textAnchor}
      style={{
        ...(props.style ?? {}),
        fontSize,
      }}
    />
  );
};

export default XTickLabel;
