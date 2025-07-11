import { FC, useState } from "react";

import { createCoherenceLink } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import DropdownMenu from "@/components/ui/dropdown_menu";
import { Post } from "@/types/post";

type Props = {
  post: Post;
  linkKey: number;
};

const directionOptions = ["positive", "negative"];
type Directions = (typeof directionOptions)[number];

const strengthOptions = ["low", "medium", "high"];
type Strengths = (typeof strengthOptions)[number];

export const CreateCoherenceLink: FC<Props> = ({ post, linkKey }) => {
  const [content, setContent] = useState<string>("");
  const [cancelled, setCancelled] = useState<boolean>(false);
  const [isFirstQuestion, setIsFirstQuestion] = useState<boolean>(true);
  const [direction, setDirection] = useState<Directions>("positive");
  const [strength, setStrength] = useState<Strengths>("medium");

  const directionMenuItems = directionOptions.map((it) => ({
    id: it,
    name: it,
    onClick: () => setDirection(it as Directions),
  }));
  const strengthMenuItems = strengthOptions.map((it) => ({
    id: it,
    name: it,
    onClick: () => setStrength(it as Strengths),
  }));

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
      <div>
        {isFirstQuestion ? (
          <div>
            This question has a{" "}
            <DropdownMenu
              items={directionMenuItems}
              itemClassName={"inline-block"}
              innerDivClassName={"inline-block"}
            >
              <Button>{direction}</Button>
            </DropdownMenu>{" "}
            <DropdownMenu
              items={strengthMenuItems}
              itemClassName={"inline-block"}
              innerDivClassName={"inline-block"}
            >
              <Button>{strength}</Button>
            </DropdownMenu>{" "}
            causal impact on another question.
          </div>
        ) : (
          <div>
            Another question has a{" "}
            <DropdownMenu
              items={directionMenuItems}
              itemClassName={"inline-block"}
              innerDivClassName={"inline-block"}
            >
              <Button>{direction}</Button>
            </DropdownMenu>{" "}
            <DropdownMenu
              items={strengthMenuItems}
              itemClassName={"inline-block"}
              innerDivClassName={"inline-block"}
            >
              <Button>{strength}</Button>
            </DropdownMenu>{" "}
            causal impact on this question.
          </div>
        )}
      </div>
      <Button onClick={swapFormat}>Swap</Button>
      <Button onClick={cancelLink}>Cancel</Button>
      <Button onClick={buttonClick}>Save</Button>
      <div>{content}</div>
    </div>
  );
};
