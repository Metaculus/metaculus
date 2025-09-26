"use client";

import dynamic from "next/dynamic";
import Image, { ImageProps, StaticImageData } from "next/image";
import { FC } from "react";

import useAppTheme from "@/hooks/use_app_theme";

type Props = Omit<ImageProps, "src"> & {
  lightSrc: string | StaticImageData;
  darkSrc: string | StaticImageData;
};

const ClientImage: FC<Props> = ({ lightSrc, darkSrc, alt, ...imageProps }) => {
  const { theme } = useAppTheme();
  return (
    <Image
      src={theme === "dark" ? darkSrc : lightSrc}
      alt={alt ?? ""}
      {...imageProps}
    />
  );
};

export default dynamic(() => Promise.resolve(ClientImage), {
  ssr: false,
});
