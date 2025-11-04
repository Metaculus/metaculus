"use client";

import { FC, useState } from "react";

import BaseModal from "@/components/base_modal";
import { BECommentType } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { User } from "@/types/users";

import { KeyFactorsProvider, useKeyFactorsCtx } from "../key_factors_context";
<<<<<<< HEAD
import KeyFactorsTypePicker from "../key_factors_type_picker";
import { KFType } from "../types";
import KeyFactorsBaseRateCreationBlock from "./creation_blocks/key_factors_base_rate_creation_block";
import KeyFactorsDriverCreationBlock from "./creation_blocks/key_factors_driver_creation_block";
import KeyFactorsBreadcrumbs from "./key_factors_breadcrumbs";
=======
import KeyFactorsBreadcrumbs from "./blocks/key_factors_breadcrumbs";
import KeyFactorsDriverCreation from "./blocks/key_factors_driver_creation";
import KeyFactorsModalPicker from "./blocks/key_factors_modal_picker";
import Stub from "./blocks/stub";
>>>>>>> 78bf71fce (feat: add types in the modal)
import KeyFactorsLoadingSuggested from "./key_factors_loading_suggested";

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
<<<<<<< HEAD
      className="m-0 flex h-full max-w-[560px] flex-col overscroll-contain rounded-none md:w-auto md:rounded lg:m-auto lg:h-auto lg:w-full"
=======
      className="m-0 flex h-full w-full max-w-[560px] flex-col overscroll-contain rounded-none md:w-auto md:rounded lg:m-auto lg:h-auto"
>>>>>>> 78bf71fce (feat: add types in the modal)
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

<<<<<<< HEAD
=======
export type KFType = "driver" | "base_rate" | "news" | null;

>>>>>>> 78bf71fce (feat: add types in the modal)
const KeyFactorsAddModalBody: React.FC<{
  post: PostWithForecasts;
  commentId?: number;
  onClose: () => void;
  onSuccess?: (c: BECommentType) => void;
}> = ({ post, commentId, onClose, onSuccess }) => {
  const { isLoadingSuggestedKeyFactors } = useKeyFactorsCtx();
  const [selectedType, setSelectedType] = useState<KFType>(null);

  return (
    <>
      <KeyFactorsBreadcrumbs
        selectedType={selectedType}
        onRootClick={() => setSelectedType(null)}
      />

      {isLoadingSuggestedKeyFactors && <KeyFactorsLoadingSuggested />}
<<<<<<< HEAD
      {!isLoadingSuggestedKeyFactors && (
        <div className="flex grow flex-col gap-2">
          {!selectedType ? (
            <KeyFactorsTypePicker onPick={setSelectedType} />
          ) : selectedType === "driver" ? (
            <KeyFactorsDriverCreationBlock
=======

      {!isLoadingSuggestedKeyFactors && (
        <div className="flex grow flex-col gap-2">
          {!selectedType ? (
            <KeyFactorsModalPicker onPick={setSelectedType} />
          ) : selectedType === "driver" ? (
            <KeyFactorsDriverCreation
>>>>>>> 78bf71fce (feat: add types in the modal)
              post={post}
              commentId={commentId}
              onClose={onClose}
              onSuccess={onSuccess}
            />
<<<<<<< HEAD
          ) : selectedType === "base_rate" ? (
            <KeyFactorsBaseRateCreationBlock
              post={post}
              commentId={commentId}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          ) : null}
=======
          ) : (
            <Stub selectedType={selectedType} />
          )}
>>>>>>> 78bf71fce (feat: add types in the modal)
        </div>
      )}
    </>
  );
};

export default KeyFactorsAddModal;
