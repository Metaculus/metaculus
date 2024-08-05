"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useAuth } from "@/contexts/auth_context";

import DemoWrapper from "./demoWrapper";
import Redirect from "../redirect";

export default function AiBenchmarkingTournamentPage() {
  const { user } = useAuth();
  const isUserAuthenticated = !!user;
  const isUserBot = isUserAuthenticated && user.is_bot;
  const [modalOpen, setModalOpen] = useState(false);
  const [tokenmodalOpen, setTokenModalOpen] = useState(false);
  const t = useTranslations();
  return (
    <>
      {!isUserAuthenticated && <Redirect />}
      {isUserAuthenticated && isUserBot && <DemoWrapper />}
      {isUserAuthenticated && !isUserBot && <Redirect />}
    </>
  );
}
