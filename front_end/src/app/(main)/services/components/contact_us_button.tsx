"use client";

import { ComponentProps } from "react";

import { usePublicSettings } from "@/contexts/public_settings_context";

import Button from "./button";
import { trackServicesContactClick } from "./reddit_pixel";

export default function ContactUsButton(props: ComponentProps<typeof Button>) {
  const { PUBLIC_REDDIT_SERVICES_PIXEL_ID: pixelId } = usePublicSettings();

  return (
    <Button
      {...props}
      href="#contact-us"
      onClick={() => trackServicesContactClick(pixelId)}
    />
  );
}
