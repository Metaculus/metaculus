"use client";
import React, { useState, useEffect } from "react";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";

import QuestionManager from "./components/question_manager";

// TODO: Overall
// - Refactor this file into muliple components for cleanliness
// - Clean the code up
// - Clean up any UI/UX eyesores
//   - If mobile is being used
//     - change header.tsx links to not have Tournaments in the main links (since on mobile it overflows)
//     - Make the "threshold 2030" wrap in a way that centers itself

// TODO: ConferencePage
// - Login allows someone to login (reuses existing login)
// - Does not show login button if already logged in, but instead shows 'start' button
// - Consider updating 'conference' in cs.json, es.json, and zh.json (are we supporting multiple languages)
// - test login
// - Add translation to all the words (t = useTranslation())if being used in the international UI (including the 'conference' header)
// - Test making a new account

// TODO: Question Component
// - Figure out if continuous or MC questions will be asked

export default function ConferencePage() {
  const { setCurrentModal } = useModal();
  const { user } = useAuth();
  const [pageState, setPageState] = useState<"login" | "questions">("login");

  useEffect(() => {
    if (user && pageState === "login") {
      setPageState("questions");
    }
  }, [user, pageState]);

  const handleLogin = () => {
    setCurrentModal({ type: "signin" });
  };

  return (
    <>
      {pageState === "login" ? (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <h1 className="mb-16 text-4xl font-bold">
            Welcome to Threshold 2030
          </h1>
          <div className="w-full max-w-sm space-y-4">
            <Button
              className="w-full"
              variant="secondary"
              onClick={handleLogin}
            >
              Login/Signup to Begin
            </Button>
          </div>
        </div>
      ) : (
        <QuestionManager />
      )}
    </>
  );
}
