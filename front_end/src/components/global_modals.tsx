"use client";
import dynamic from "next/dynamic";
import React, { FC, useEffect } from "react";

import { useAuth } from "@/contexts/auth_context";
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

const CopyQuestionLinkModal = dynamic(
  () => import("@/components/copy_question_link_modal"),
  { ssr: false }
);

const DisputeKeyFactorModal = dynamic(
  () => import("@/components/dispute_key_factor_modal"),
  { ssr: false }
);

const EmailCaptureDrawer = dynamic(
  () => import("@/components/email_capture/email_capture_drawer"),
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
  // Logging out is a client-side navigation, so the root layout (and this
  // modal state) survives it. The tutorial is for signed-in forecasters
  // only, so never show it to a signed-out visitor whatever opened it.
  const { user } = useAuth();

  // Hiding it is not enough: the request has to be dropped too. A sign-in that
  // does not itself open a modal (SimplifiedSignupModal owns its own state and
  // only calls setUser) would otherwise reveal the stale tutorial the moment a
  // user reappears, with nothing having asked for it.
  useEffect(() => {
    if (!user && isModal(currentModal, "onboarding")) {
      setCurrentModal(null);
    }
  }, [user, currentModal, setCurrentModal]);

  return (
    <>
      {isModal(currentModal, "signin") && (
        <SignInModal
          isOpen
          onClose={onClose}
          onSuccess={currentModal.data?.onSuccess}
        />
      )}
      {isModal(currentModal, "signup") && (
        <SignUpModal
          isOpen
          onClose={onClose}
          onSuccess={currentModal.data?.onSuccess}
        />
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
      {PUBLIC_ALLOW_TUTORIAL &&
        !!user &&
        isModal(currentModal, "onboarding") && (
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
          onSubmitted={currentModal.data.onSubmitted}
        />
      )}
      {isModal(currentModal, "emailCapture") && currentModal.data && (
        <EmailCaptureDrawer
          isOpen
          onClose={onClose}
          trigger={currentModal.data.trigger}
          surface={currentModal.data.surface}
          gatedAction={currentModal.data.gatedAction}
          subscribePost={currentModal.data.subscribePost}
          initialView={currentModal.data.initialView}
        />
      )}
      {isModal(currentModal, "copyQuestionLink") && currentModal.data && (
        <CopyQuestionLinkModal
          isOpen
          onClose={onClose}
          targetElementId={currentModal.data.targetElementId}
          fromQuestionTitle={currentModal.data.fromQuestionTitle}
          toQuestionTitle={currentModal.data.toQuestionTitle}
          defaultDirection={currentModal.data.defaultDirection}
          defaultStrength={currentModal.data.defaultStrength}
          onCreate={currentModal.data.onCreate}
        />
      )}
    </>
  );
};

export default GlobalModals;
