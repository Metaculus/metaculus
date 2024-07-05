"use client";
import { FC } from "react";

import EmbedModal from "@/components/embed_modal";
import Button from "@/components/ui/button";
import useEmbedModalContext from "@/contexts/embed_modal_context";
import { useEmbedUrl } from "@/hooks/share";

const ElectionsEmbedModal: FC = () => {
  const { isOpen, updateIsOpen } = useEmbedModalContext();

  const embedUrl = useEmbedUrl("/embed/elections");

  if (!embedUrl) {
    return null;
  }

  return (
    <>
      <Button
        variant="tertiary"
        size="sm"
        className="col-start-3 row-start-1 hidden w-auto self-center justify-self-end xs:flex"
        onClick={() => {
          updateIsOpen(true);
        }}
      >
        Embed
      </Button>

      <EmbedModal
        isOpen={isOpen}
        onClose={updateIsOpen}
        embedWidth={800}
        embedHeight={800}
        url={embedUrl}
      />
    </>
  );
};

export default ElectionsEmbedModal;
