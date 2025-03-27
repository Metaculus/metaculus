"use client";
import dynamic from "next/dynamic";

const HtmlContent = dynamic(() => import("./html_content"), { ssr: false });

export default HtmlContent;
