import { differenceInMilliseconds } from "date-fns";
import { FC, useEffect, useRef } from "react";

import { QuestionStatus } from "@/types/question";

const CLOCK_RADIUS = 10;

type Props = {
  status: QuestionStatus | null;
  published_at: string;
  closed_at: string;
};

const QuestionStatusIcon: FC<Props> = ({ status, closed_at, published_at }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const showClock =
    status === QuestionStatus.Closes || status === QuestionStatus.Resolves;

  useEffect(() => {
    if (!svgRef.current || !showClock) return;

    const timeSincePublish = differenceInMilliseconds(
      new Date(),
      new Date(published_at)
    );
    const totalTime = differenceInMilliseconds(
      new Date(closed_at),
      new Date(published_at)
    );
    // Make the math simpler by not handling the case where all the time
    // is elapsed (or more). The whole clock should show gray in this case.
    let timeElapsed = Math.min(0.999, timeSincePublish / totalTime);
    // Similarly, for Upcoming questions, don't allow negative times.
    timeElapsed = Math.max(0, timeElapsed);

    const { x, y } = calculateCoordinates(timeElapsed);
    const pathD = buildClockPath(x, y, timeElapsed);

    const nodes = svgRef.current.children;

    const shadedPath = nodes[0];
    shadedPath.setAttribute("d", pathD);

    const outerCircle = nodes[1];
    outerCircle.setAttribute("r", CLOCK_RADIUS.toString());

    const radius = nodes[2];
    radius.setAttribute("x2", x.toString());
    radius.setAttribute("y2", y.toString());
  }, [closed_at, published_at, showClock]);

  const renderIcon = () => {
    if (status === QuestionStatus.Opens) {
      return <circle r="10" className="stroke-metac-blue-700 stroke-1" />;
    }

    if (showClock) {
      return (
        <>
          <path d="" className="fill-metac-mint-500" />
          <circle className="stroke-metac-blue-700 stroke-1" />
          <line x1="0" y1="0" className="stroke-metac-blue-700 stroke-1" />
        </>
      );
    }

    return null;
  };

  return (
    <svg
      ref={svgRef}
      width="20"
      height="20"
      viewBox="-12 -12 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {renderIcon()}
    </svg>
  );
};

const calculateCoordinates = (timeElapsed: number) => {
  const angle = 2 * Math.PI * timeElapsed;
  const x = CLOCK_RADIUS * Math.sin(angle);
  const y = -CLOCK_RADIUS * Math.cos(angle);

  return { x, y };
};

const buildClockPath = (x: number, y: number, timeElapsed: number) => {
  const largeArcFlag = timeElapsed > 0.5 ? 1 : 0;
  return `M 0 0 L ${x} ${y} A ${CLOCK_RADIUS} ${CLOCK_RADIUS} 0 ${largeArcFlag} 0 0 ${-CLOCK_RADIUS} z`;
};

export default QuestionStatusIcon;
