"use client";

import { useRouter } from "next/navigation";
import { FC, useState } from "react";

import { fetchRandomPostId } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";

import { Die } from "./icons/die";

const RandomButton: FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRandomClick = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRandomPostId();
      router.push(`/questions/${data.id}/${data.post_slug}/`);
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
      className="flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-none border-0 bg-transparent text-xl transition-transform hover:animate-spin"
      // className={"dieButton"}
    >
      <Die className="die" />
    </Button>
  );
};

export default RandomButton;
