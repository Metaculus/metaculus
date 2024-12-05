"use client";

import { useRouter } from "next/navigation";
import { FC, useState } from "react";

import { fetchRandomPostId } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";

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
      style={{
        width: "50px",
        height: "50px",
        background: "transparent",
        border: "0px solid #000",
        borderRadius: "0px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        transition: "transform 0.3s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "rotate(360deg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "rotate(0deg)";
      }}
    >
      {"🎲"}
    </Button>
  );
};

export default RandomButton;
