"use client";
import dynamic from "next/dynamic";
import React, { FC } from "react";

import { useModal } from "@/contexts/modal_context";
import type { CurrentModal, ModalType } from "@/contexts/modal_context";
import { usePublicSettings } from "@/contexts/public_settings_context";

const SignInModal = dynamic(() => import("@/components/auth/signin"), {
  ssr: false,
});

const SignUpModal = dynamic(
  () => import("@/components/auth/signup").then((mod) => mod.SignUpModal),
  {
    ssr: false,
  }
);

const SignUpModalSuccess = dynamic(
  () =>
    import("@/components/auth/signup").then((mod) => mod.SignUpModalSuccess),
  {
    ssr: false,
  }
);

const AccountInactive = dynamic(
  () => import("@/components/auth/signup").then((mod) => mod.AccountInactive),
  {
    ssr: false,
  }
);

const ResetPasswordModal = dynamic(
  () => import("@/components/auth/password_reset"),
  {
    ssr: false,
  }
);

const ResetPasswordConfirmModal = dynamic(
  () =>
    import("@/components/auth/password_reset").then(
      (mod) => mod.ResetPasswordConfirmModal
    ),
  {
    ssr: false,
  }
);

const ContactUsModal = dynamic(() => import("@/components/contact_us_modal"), {
  ssr: false,
});

const OnboardingModal = dynamic(
  () => import("@/components/onboarding/onboarding_modal"),
  {
    ssr: false,
  }
);

const ConfirmModal = dynamic(() => import("@/components/confirm_modal"), {
  ssr: false,
});

const DisputeKeyFactorModal = dynamic(
  () => import("@/components/dispute_key_factor_modal"),
  { ssr: false }
);

function isModal<T extends ModalType>(
  m: CurrentModal | null,
  type: T
): m is CurrentModal<T> {
  return !!m && m.type === type;
}

const GlobalModals: FC = () => {
  const { currentModal, setCurrentModal } = useModal();
  const onClose = () => setCurrentModal(null);

  const { PUBLIC_ALLOW_TUTORIAL } = usePublicSettings();

  return (
    <>
      {isModal(currentModal, "signin") && (
        <SignInModal isOpen onClose={onClose} />
      )}
      {isModal(currentModal, "signup") && (
        <SignUpModal isOpen onClose={onClose} />
      )}
      {isModal(currentModal, "signupSuccess") && (
        <SignUpModalSuccess
          isOpen
          onClose={onClose}
          username={currentModal.data?.username ?? ""}
          email={currentModal.data?.email ?? ""}
        />
      )}
      {isModal(currentModal, "accountInactive") && (
        <AccountInactive
          isOpen
          onClose={onClose}
          login={currentModal.data?.login ?? ""}
        />
      )}
      {isModal(currentModal, "resetPassword") && (
        <ResetPasswordModal isOpen onClose={onClose} />
      )}
      {isModal(currentModal, "resetPasswordConfirm") && (
        <ResetPasswordConfirmModal isOpen onClose={onClose} />
      )}
      {isModal(currentModal, "contactUs") && (
        <ContactUsModal isOpen onClose={onClose} />
      )}
      {PUBLIC_ALLOW_TUTORIAL && isModal(currentModal, "onboarding") && (
        <OnboardingModal isOpen onClose={onClose} />
      )}
      {isModal(currentModal, "confirm") && (
        <ConfirmModal
          isOpen
          onCloseModal={onClose}
          title={currentModal.data?.title ?? ""}
          description={currentModal.data?.description}
          onConfirm={currentModal.data?.onConfirm ?? (() => {})}
          onClose={currentModal.data?.onClose}
          actionText={currentModal.data?.actionText}
        />
      )}
      {isModal(currentModal, "disputeKeyFactor") && currentModal.data && (
        <DisputeKeyFactorModal
          isOpen
          onClose={onClose}
          parentCommentId={currentModal.data.parentCommentId}
          postId={currentModal.data.postId}
          onOptimisticAdd={currentModal.data.onOptimisticAdd}
          onFinalize={currentModal.data.onFinalize}
          onRemove={currentModal.data.onRemove}
        />
      )}
    </>
  );
};

export default GlobalModals;
