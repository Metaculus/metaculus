"use client";

import React from "react";

import { SignupForm } from "@/components/auth/signup";
import useSearchParams from "@/hooks/use_search_params";

export const PARAM_INVITE_TOKEN = "invite_token";
export const PARAM_EMAIL = "email";

const SignUp = () => {
  const { params } = useSearchParams();

  return (
    <>
      <SignupForm
        inviteToken={params.get(PARAM_INVITE_TOKEN) || undefined}
        email={params.get(PARAM_EMAIL) || undefined}
      />
    </>
  );
};

export default SignUp;
