import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import useContainerSize from "@/hooks/use_container_size";
import { Community } from "@/types/projects";
import cn from "@/utils/cn";
import { getMarkdownSummary } from "@/utils/questions";
import { formatUsername } from "@/utils/users";

import Button from "../ui/button";
import "./styles.css";

type Props = {
  community: Community;
};

const CommunityFeedCard: FC<Props> = ({ community }) => {
  const t = useTranslations();
  const router = useRouter();
  const { ref, width } = useContainerSize<HTMLDivElement>();
  return (
    <Link
      href={`/c/${community.slug}`}
      className="group flex h-[186px] flex-col rounded-lg border border-purple-300 bg-gray-0 p-5 no-underline hover:border-blue-700 dark:border-purple-300-dark dark:bg-gray-0-dark dark:hover:border-blue-700-dark"
    >
      <div className="flex items-center justify-between">
        <h1 className="m-0 max-w-[250px] truncate text-lg font-medium text-blue-800 dark:text-blue-800-dark xs:max-w-full">
          {community.name}
        </h1>
        <Button
          presentationType="icon"
          className="!h-[26px] !w-[26px] min-w-[26px] rounded-full !border-blue-400 !text-blue-700 group-hover:!bg-blue-900 group-hover:!text-gray-200 dark:!border-blue-400-dark dark:!text-blue-700-dark dark:group-hover:!bg-blue-900-dark dark:group-hover:!text-gray-200-dark"
        >
          <FontAwesomeIcon icon={faArrowRight} width={12} />
        </Button>
      </div>
      {community.description && (
        <div
          ref={ref}
          className="m-0 my-2.5 line-clamp-3 max-h-[60px] text-sm xs:line-clamp-2 xs:max-h-10"
        >
          {!!width && (
            <MarkdownEditor
              mode="read"
              markdown={getMarkdownSummary({
                markdown: community.description,
                width,
                height: 44,
                charWidth: 7,
              })}
              contentEditableClassName="community font-serif *:m-0"
              withUgcLinks
            />
          )}
        </div>
      )}

      <hr className="text mb-4 mt-auto border-blue-400 dark:border-blue-400-dark" />

      <div className={cn("flex items-center")}>
        <p className="my-0 flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-500-dark">
          {t("followers")}
          <span className="font-bold text-blue-800 dark:text-blue-800-dark">
            {community.followers_count}
          </span>{" "}
        </p>
        <p className="my-0 ml-7 flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-500-dark xs:ml-5">
          {t("questions")}
          <span className="font-bold text-blue-800 dark:text-blue-800-dark">
            {community.posts_count}
          </span>{" "}
        </p>
        {!!community.created_by?.id && !!community.created_by?.username && (
          <div className="ml-auto flex items-center">
            <p className="my-0 ml-auto flex flex-col items-end gap-1 text-xs text-gray-500 dark:text-gray-500-dark">
              {t("moderatedBy")}{" "}
              <Button
                variant="text"
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/accounts/profile/${community.created_by.id}/`);
                }}
                className="!p-0 font-medium text-blue-800 no-underline dark:text-blue-800-dark"
              >
                <span className="lg:max-w-28 lg:truncate lg:pb-[1px]">
                  {formatUsername(community.created_by)}
                </span>
              </Button>
            </p>

            {!!community.header_logo && (
              <div className="relative ml-4 h-[36px] w-[36px] rounded-full border-none bg-cover bg-center">
                <Image
                  quality={100}
                  className="size-full rounded-full object-cover object-center"
                  sizes="50vw"
                  fill
                  src={community.header_logo}
                  alt=""
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default CommunityFeedCard;
