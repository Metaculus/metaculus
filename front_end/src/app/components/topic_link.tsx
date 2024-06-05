import Link from "next/link";
import { FC } from "react";

type Props = {
  text: string;
  emoji: string;
  href: string;
};

const TopicLink: FC<Props> = ({ href, text, emoji }) => {
  return (
    <Link
      href={href}
      className="mx-2.5 whitespace-nowrap text-base leading-9 text-metac-blue-800 no-underline hover:text-metac-blue-900 dark:text-metac-blue-800-dark hover:dark:text-metac-blue-900-dark"
    >
      <span className="pr-1.5">{emoji}</span>
      <span className="underline decoration-metac-blue-300 underline-offset-4 hover:decoration-metac-blue-500 dark:decoration-metac-blue-300-dark hover:dark:decoration-metac-blue-500-dark">
        {text}
      </span>
    </Link>
  );
};

export default TopicLink;
