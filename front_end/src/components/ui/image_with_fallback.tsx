"use client";
import {
  DetailedHTMLProps,
  FC,
  ImgHTMLAttributes,
  PropsWithChildren,
  useState,
} from "react";

type Props = DetailedHTMLProps<
  ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;

const ImageWithFallback: FC<PropsWithChildren<Props>> = ({
  children,
  ...props
}) => {
  const [isFailed, setIsFailed] = useState(false);

  if (isFailed) {
    return children;
  }

  return <img {...props} onError={() => setIsFailed(true)} />;
};

export default ImageWithFallback;
