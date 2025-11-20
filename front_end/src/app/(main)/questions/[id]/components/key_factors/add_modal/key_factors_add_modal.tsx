"use client";

import { FC, useState } from "react";

import BaseModal from "@/components/base_modal";
import { BECommentType } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { User } from "@/types/users";

import { KeyFactorsProvider } from "../key_factors_context";
import KeyFactorsTypePicker from "../key_factors_type_picker";
import { KFType } from "../types";
import KeyFactorsBaseRateCreationBlock from "./creation_blocks/key_factors_base_rate_creation_block";
import KeyFactorsDriverCreationBlock from "./creation_blocks/key_factors_driver_creation_block";
import KeyFactorsNewsCreationBlock from "./creation_blocks/key_factors_news_creation_block";
import KeyFactorsBreadcrumbs from "./key_factors_breadcrumbs";

type Props = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  user: User;
  // Used when adding key factors to an existing comment
  commentId?: number;
  // Used when adding key factors and also creating a new comment on a given post
  // This also determines the number of steps in the modal: 2 if a new comment is createad too
  post: PostWithForecasts;
  // if true, loads a set of suggested key factors
  showSuggestedKeyFactors?: boolean;
  onSuccess?: (comment: BECommentType) => void;
};

const KeyFactorsAddModal: FC<Props> = ({
  isOpen,
  onClose,
  commentId,
  post,
  onSuccess,
  user,
  showSuggestedKeyFactors = true,
}) => {
  if (!isOpen || !user) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {
        onClose(true);
      }}
      isImmersive
      withCloseButton
      closeButtonClassName="top-5 right-5 sm:top-[28px] sm:right-[28px] p-0 text-base [&>_svg]:size-6"
      className="m-0 flex h-full max-w-[560px] flex-col overscroll-contain rounded-none md:w-auto md:rounded lg:m-auto lg:h-auto lg:w-full"
    >
      <KeyFactorsProvider
        user={user}
        post={post}
        commentId={commentId}
        suggest={showSuggestedKeyFactors && isOpen}
      >
        <KeyFactorsAddModalBody
          post={post}
          commentId={commentId}
          onClose={() => onClose(true)}
          onSuccess={onSuccess}
        />
      </KeyFactorsProvider>
    </BaseModal>
  );
};

const KeyFactorsAddModalBody: React.FC<{
  post: PostWithForecasts;
  commentId?: number;
  onClose: () => void;
  onSuccess?: (c: BECommentType) => void;
}> = ({ post, commentId, onClose, onSuccess }) => {
  const [selectedType, setSelectedType] = useState<KFType>(null);

  return (
    <>
      <KeyFactorsBreadcrumbs
        selectedType={selectedType}
        onRootClick={() => setSelectedType(null)}
      />

      <div className="flex grow flex-col">
        {!selectedType ? (
          <KeyFactorsTypePicker onPick={setSelectedType} />
        ) : selectedType === "driver" ? (
          <KeyFactorsDriverCreationBlock
            post={post}
            commentId={commentId}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        ) : selectedType === "base_rate" ? (
          <KeyFactorsBaseRateCreationBlock
            post={post}
            commentId={commentId}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        ) : selectedType === "news" ? (
          <KeyFactorsNewsCreationBlock
            post={post}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        ) : null}
      </div>
    </>
  );
};

export default KeyFactorsAddModal;
