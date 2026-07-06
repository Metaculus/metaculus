"use client";

import { faDice } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ComponentProps, FC, useState } from "react";

import Button from "@/components/ui/button";
import ClientPostsApi from "@/services/api/posts/posts.client";
import cn from "@/utils/core/cn";

const RandomButton: FC<ComponentProps<typeof Button>> = ({
  className,
  ...props
}) => {
  const t = useTranslations();
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
      aria-label={t("randomQuestion")}
      size="md"
      presentationType="icon"
      className={cn(
        "shrink-0 transition-transform hover:animate-spin",
        className
      )}
      {...props}
    >
      <FontAwesomeIcon icon={faDice} />
    </Button>
  );
};

export default RandomButton;
