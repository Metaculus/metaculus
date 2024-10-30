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
// - Get the threshold url up and running
// - Test everything on a production branch
// - Get environment variables from team members
// - Get Ben communication channel with the engineering team
// - Check for how it looks on light mode and dark mode and mobile
// - Run a gpt code review
// - Go trhough and handle all warnings and errors in client console, server console, backend consoles
//   - One error being found when fetching questions: Fetch error: Error: NEXT_NOT_FOUND. finalUrl: http://127.0.0.1:8000/api/leaderboards/project/3366/

// TODO: ConferencePage
// - Login allows someone to login (reuses existing login)
// - Does not show login button if already logged in, but instead shows 'start' button
// - Consider updating 'conference' in cs.json, es.json, and zh.json (are we supporting multiple languages)
// - test login
// - Add translation to all the words (t = useTranslation())if being used in the international UI (including the 'conference' header)
// - Test making a new account
// - Make sure that question predictions update in overview after a forecast is made (i.e. not just loaded once) (Trigger refresh only on overview?)

// TODO: Question Component
// - Figure out if continuous or MC questions will be asked

// TODO: Forecast Overview
// - Figure out if there is a more direct way to get aggregation information (its a train wreck to get prediction)
// - when questions load, the bottom buttons squish together

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
