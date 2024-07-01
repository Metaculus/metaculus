"use client";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import Button from "@/components/ui/button";
import Chip from "@/components/ui/chip";
import { POST_TAGS_FILTER } from "@/constants/posts_feed";
import { Tag } from "@/types/projects";

type TagsProps = {
  tags: Tag[];
};

const AwaitedTags: FC<TagsProps> = ({ tags }) => {
  const t = useTranslations();
  const [displayItemsCount, setDisplayItemsCount] = useState(100);
  const show_tags = tags.slice(0, displayItemsCount);

  if (!show_tags.length) {
    return (
      <div className="flex items-center justify-center text-sm text-blue-900 dark:text-blue-900-dark">
        {t("noTags")}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap justify-start gap-x-2.5 gap-y-3 self-stretch">
        {show_tags.map((tag) => (
          <Chip
            key={tag.slug}
            href={`/questions/?${POST_TAGS_FILTER}=${tag.slug}`}
            color="blue"
            size="sm"
            label={tag.posts_count.toString()}
          >
            {tag.name}
          </Chip>
        ))}
      </div>
      <div className="flex w-full justify-center">
        <Button
          onClick={() => setDisplayItemsCount(() => displayItemsCount + 200)}
        >
          Show More
        </Button>
      </div>
    </>
  );
};

export default AwaitedTags;
