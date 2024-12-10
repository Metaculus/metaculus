import { FC, ReactNode } from "react";

type Tag = "strong" | "br";

type Props = {
  children(tags: Record<Tag, (chunks: ReactNode) => ReactNode>): ReactNode;
};

const RichText: FC<Props> = ({ children }) => {
  return (
    <>
      {children({
        strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
        br: () => <br />,
      })}
    </>
  );
};

export default RichText;
