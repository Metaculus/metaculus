import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import {
  POST_CATEGORIES_FILTER,
  POST_FOR_MAIN_FEED,
} from "@/constants/posts_feed";
import { Post } from "@/types/post";
import { Category } from "@/types/projects";
import cn from "@/utils/core/cn";

type CategoryWithPosts = Category & { posts: Post[] };

type Props = {
  categories: CategoryWithPosts[];
  className?: string;
};

const AllCategoriesSection: FC<Props> = async ({ categories, className }) => {
  const t = await getTranslations();

  if (!categories || categories.length === 0) {
    return null;
  }

  const sortedCategories = [...categories]
    .filter((c) => c && c.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className={cn("py-20", className)}>
      <h2 className="m-0 mb-10 text-xl font-bold leading-7 text-gray-1000 dark:text-gray-1000-dark">
        <span className="hidden md:inline">
          {t("allCategoriesTopQuestions")}
        </span>

        <span className="inline md:hidden">{t("allCategories")}</span>
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sortedCategories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
};

type CategoryCardProps = {
  category: CategoryWithPosts;
};

const CategoryCard: FC<CategoryCardProps> = ({ category }) => {
  const categoryUrl = `/questions/?${POST_CATEGORIES_FILTER}=${category.slug}&${POST_FOR_MAIN_FEED}=false`;

  return (
    <div className="flex flex-col gap-3.5 rounded-lg border border-gray-300 bg-gray-0 p-4 dark:border-gray-300-dark dark:bg-gray-0-dark">
      <Link
        href={categoryUrl}
        className="flex flex-row items-center gap-2 no-underline"
      >
        <span className="text-xl">{category.emoji}</span>
        <span className="text-base font-bold leading-5 text-gray-800 dark:text-gray-800-dark">
          {category.name}
        </span>
      </Link>

      {category.posts && category.posts.length > 0 && (
        <div className="hidden flex-col gap-2.5 md:flex">
          {category.posts.slice(0, 3).map(({ title, slug, id }, index) => (
            <div key={index}>
              <div className="flex text-sm font-medium leading-5 text-gray-800 dark:text-gray-800-dark">
                <span className="mr-1 shrink-0 text-gray-500 dark:text-gray-500-dark">
                  {index + 1}.
                </span>
                <Link
                  href={`/questions/${id}/${slug}`}
                  className="no-underline hover:underline"
                >
                  {title}
                </Link>
              </div>
              {index < Math.min(category.posts.length, 3) - 1 && (
                <hr className="my-2.5 border-t border-gray-300 dark:border-gray-300-dark" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllCategoriesSection;
