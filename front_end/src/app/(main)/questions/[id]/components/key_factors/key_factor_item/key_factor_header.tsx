import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";

type Props = {
  label: string;
  author: {
    id: number;
    username: string;
  };
};

const KeyFactorHeader: FC<Props> = ({ label, author }) => {
  const t = useTranslations();

  return (
    <div className="flex w-full justify-between">
      <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-500-dark">
        {label}
      </div>
      <div className="text-[10px] text-gray-600 dark:text-gray-600-dark">
        {t.rich("byUsername", {
          link: (chunk) => (
            <Button
              className="text-[10px] font-normal text-blue-700 no-underline dark:text-blue-700-dark"
              variant="link"
              href={`/accounts/profile/${author.id}`}
            >
              {chunk}
            </Button>
          ),
          username: `@${author.username}`,
        })}
      </div>
    </div>
  );
};

export default KeyFactorHeader;
