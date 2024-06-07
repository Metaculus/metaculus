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
      className="mx-2.5 whitespace-nowrap text-base leading-9 text-blue-800 no-underline hover:text-blue-900 dark:text-blue-800-dark hover:dark:text-blue-900-dark"
    >
      <span className="pr-1.5">{emoji}</span>
      <span className="underline decoration-blue-300 underline-offset-4 hover:decoration-blue-500 dark:decoration-blue-300-dark hover:dark:decoration-blue-500-dark">
        {text}
      </span>
    </Link>
  );
};

export default TopicLink;
