import { PropsWithChildren } from "react";

type SVGDefsProps = React.SVGProps<SVGDefsElement>;

type DomainTupleNum = [number, number];
type DomainTupleDate = [Date, Date];
type DomainTuple = DomainTupleNum | DomainTupleDate;
type DomainLike = DomainTuple | { x?: DomainTuple; y?: DomainTuple };

type PrimitiveScale =
  | "linear"
  | "time"
  | "log"
  | "sqrt"
  | "pow"
  | "band"
  | "point"
  | "ordinal";
type ScaleFn = (value: unknown) => number;
type ScaleLike =
  | PrimitiveScale
  | ScaleFn
  | { x?: PrimitiveScale | ScaleFn; y?: PrimitiveScale | ScaleFn };

type ExcludedProps = {
  standalone?: boolean;
  domain?: DomainLike;
  scale?: ScaleLike;
  horizontal?: boolean;
  polar?: boolean;
  renderInPortal?: boolean;
  width?: number;
  height?: number;
  stringMap?: Record<string, number>;
  padding?:
    | number
    | { top?: number; bottom?: number; left?: number; right?: number };
};
type Props = SVGDefsProps & ExcludedProps;

const SvgWrapper: React.FC<PropsWithChildren<Props>> = ({
  children,
  ...props
}) => {
  // remove Victory-specific props that shouldn't be passed to SVG elements
  const {
    standalone,
    domain,
    scale,
    horizontal,
    polar,
    renderInPortal,
    width,
    height,
    padding,
    stringMap,
    ...restProps
  } = props;

  return <defs {...restProps}>{children}</defs>;
};

export default SvgWrapper;
