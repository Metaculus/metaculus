"use client";

import { Button } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { FC, useState } from "react";

import ClientPostsApi from "@/services/api/posts/posts.client";

import { Die } from "./icons/die";

const RandomButton: FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRandomClick = async () => {
    setIsLoading(true);
    try {
      const data = await ClientPostsApi.getRandomPostId();
      if (!data) {
        return;
      }
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
      className="flex h-[48px] w-[48px] cursor-pointer items-center justify-center rounded-none border-0 bg-transparent text-xl transition-transform hover:animate-spin"
    >
      <Die className="die" />
    </Button>
  );
};

export default RandomButton;
