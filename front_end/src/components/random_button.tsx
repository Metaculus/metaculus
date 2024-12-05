"use client";

import { useRouter } from "next/navigation";
import { FC, useState } from "react";

import { fetchRandomPostId } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";

import { Die } from "./icons/die";
import "./icons/die.css";

const RandomButton: FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRandomClick = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRandomPostId();
      router.push(`/questions/${data.id}/${data.url_title}/`);
    } catch (error) {
      console.error("Error fetching random question:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRandomClick}
      disabled={isLoading}
      aria-label="Random Question"
      style={{ background: "transparent" }}
      className={"dieButton"}
    >
      <Die className="die" />
    </Button>
  );
};

export default RandomButton;
