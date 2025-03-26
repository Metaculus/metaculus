"use client";
import dynamic from "next/dynamic";

const CpRevealTime = dynamic(() => import("./cp_reveal_time"), { ssr: false });

export default CpRevealTime;
