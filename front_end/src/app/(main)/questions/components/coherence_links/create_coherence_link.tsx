import { FC, useState } from "react";

import { createCoherenceLink } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { Post } from "@/types/post";

type Props = {
  post: Post;
  linkKey: number;
};

export const CreateCoherenceLink: FC<Props> = ({ post, linkKey }) => {
  const [content, setContent] = useState<string>("");
  const [cancelled, setCancelled] = useState<boolean>(false);
  const [isFirstQuestion, setIsFirstQuestion] = useState<boolean>(true);

  async function buttonClick() {
    const result = await createCoherenceLink();
    setContent(JSON.stringify(result));
  }

  async function cancelLink() {
    setCancelled(true);
  }

  async function swapFormat() {
    setIsFirstQuestion(!isFirstQuestion);
  }

  if (cancelled) return null;

  return (
    <div>
      <div>{linkKey}</div>
      <div>{isFirstQuestion ? <div>Is First</div> : <div>Is Second</div>}</div>
      <Button onClick={swapFormat}>Swap</Button>
      <Button onClick={cancelLink}>Cancel</Button>
      <Button onClick={buttonClick}>Save</Button>
      <div>{content}</div>
    </div>
  );
};
