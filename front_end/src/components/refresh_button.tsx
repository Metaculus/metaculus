"use client";

import { useRouter } from "next/navigation";
import React from "react";

import Button from "./ui/button";

const RefreshButton: React.FC = () => {
  const router = useRouter();

  return (
    <Button variant="primary" onClick={() => router.refresh()}>
      Try again
    </Button>
  );
};

export default RefreshButton;
