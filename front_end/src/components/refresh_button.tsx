"use client";

import React from "react";
import { useRouter } from "next/navigation";
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
