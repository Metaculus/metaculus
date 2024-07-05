"use client";
import { FC } from "react";

import Button from "@/components/ui/button";
import useEmbedModalContext from "@/contexts/embed_modal_context";

const QuestionEmbedButton: FC = () => {
  const { updateIsOpen } = useEmbedModalContext();

  return (
    <Button variant="secondary" onClick={() => updateIsOpen(true)}>
      Embed
    </Button>
  );
};

export default QuestionEmbedButton;
