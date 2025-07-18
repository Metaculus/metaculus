import { PropsWithChildren } from "react";

type SVGDefsProps = React.SVGProps<SVGDefsElement>;
type ExcludedProps = {
  standalone?: boolean;
  domain?: any;
  scale?: any;
  horizontal?: boolean;
  polar?: boolean;
  renderInPortal?: boolean;
  width?: number;
  height?: number;
  stringMap?: Record<string, any>;
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
