"use client";

import { ComponentProps } from "react";

import Button from "./button";
import { trackServicesContactClick } from "./reddit_pixel";

export default function ContactUsButton(props: ComponentProps<typeof Button>) {
  return (
    <Button {...props} href="#contact-us" onClick={trackServicesContactClick} />
  );
}
