"use client";

import React, { useState, useEffect } from "react";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";

import QuestionManager from "./components/question_manager";

// Future Work:
// - Add translation to all the words (t = useTranslation()) if being made international
// - Get this working with continuous or MC questions

export default function ConferencePage({
  params,
}: {
  params: { slug: string };
}) {
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
    <main className="flex min-h-[calc(100vh-250px)] flex-col">
      <div className="flex flex-grow items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {pageState === "login" ? (
            <div className="flex flex-col items-center justify-center space-y-6">
              <h1 className="text-center text-3xl font-bold text-gray-800 md:text-4xl lg:text-5xl">
                Welcome to Threshold 2030
              </h1>
              <p className="max-w-2xl text-center text-lg text-gray-600 md:text-xl">
                Join us in predicting and shaping the future. Login or sign up
                to start forecasting.
              </p>
              <Button
                className="mt-4 w-full max-w-sm py-3 text-lg"
                variant="primary"
                onClick={handleLogin}
              >
                Login / Sign Up
              </Button>
            </div>
          ) : (
            <QuestionManager slug={params.slug} />
          )}
        </div>
      </div>
    </main>
  );
}
