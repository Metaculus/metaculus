import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { POST_CATEGORIES_FILTER } from "@/constants/posts_feed";
import { Category } from "@/types/projects";

import DiscoverySection from "./section";

type Props = {
  categories: Category[];
};

const CategoriesDiscovery: FC<Props> = ({ categories }) => {
  const t = useTranslations();

  const categoriesToDisplay = categories
    .filter((c) => !!c.posts_count)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <DiscoverySection title={t("allCategories")}>
      <div className="grid w-full gap-3 md:grid-cols-5">
        {categoriesToDisplay.map((category) => (
          <Link
            href={`/questions/?${POST_CATEGORIES_FILTER}=${category.slug}&for_main_feed=false`}
            key={category.id}
            className="flex items-center gap-4 rounded bg-olive-300 p-4 text-olive-900 no-underline dark:bg-olive-300-dark dark:text-olive-900-dark md:min-h-[145px] md:flex-col md:items-start md:justify-between md:gap-0"
          >
            <div className="text-3xl">{category.emoji}</div>
            <div>{category.name}</div>
          </Link>
        ))}
      </div>
    </DiscoverySection>
  );
};

export default CategoriesDiscovery;
