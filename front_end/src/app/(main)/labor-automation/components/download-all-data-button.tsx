"use client";

import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

import DataRequestModal from "@/app/(main)/questions/[id]/components/download_question_data_modal";
import Button from "@/components/ui/button";

type Props = {
  postIds: number[];
  title?: string;
};

export default function DownloadAllDataButton({ postIds, title }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (postIds.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="tertiary"
        onClick={() => setIsModalOpen(true)}
        className="gap-2"
      >
        <FontAwesomeIcon icon={faDownload} />
        <span>Download All Data</span>
      </Button>
      <DataRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        postId={postIds}
        title={title}
      />
    </>
  );
}
