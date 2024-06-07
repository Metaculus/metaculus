import classNames from "classnames";
import { FC } from "react";

type Props = {
  content: string;
  className?: string;
};

const HtmlContent: FC<Props> = ({ content, className }) => {
  return (
    <div
      className={classNames("content", className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default HtmlContent;
