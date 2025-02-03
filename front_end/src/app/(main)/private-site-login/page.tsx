"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { setPrivateSiteToken, sumbitPrivateSiteLogin } from "./actions";

export default function PrivateSiteLogin() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    const password = (
      event.currentTarget.elements.namedItem("password") as HTMLInputElement
    )?.value;

    try {
      const response = await sumbitPrivateSiteLogin(password);
      console.log({ response });

      if (response && response.errors?.length) {
        setErrorMessage(response.errors.at(0) || "");
      } else {
        // If no errors, set the private site token
        const token = response.token;
        if (!token) {
          setErrorMessage("No token received from the server");
          return;
        }
        console.log({ token });
        setPrivateSiteToken(token);
        console.log("Token set");
        // then redirect to the questions page
        router.push("/questions/"); // NOTE: doesn't always work
      }
    } catch (e) {
      if (e instanceof Error) {
        setErrorMessage(e.message);
      } else {
        // Fallback for network or unexpected errors
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto mt-4 min-h-min w-full max-w-5xl flex-auto px-0 sm:px-2 md:px-3">
      <h1 className="mb-5 mt-20 text-balance text-center text-4xl text-blue-800 dark:text-blue-800-dark sm:text-5xl sm:tracking-tight md:text-6xl">
        {"Private Site Sign In - password is 'password'"}
      </h1>
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="mb-3 text-red-700 dark:text-red-500-dark">
            {errorMessage}
          </div>
        )}

        <label htmlFor="password">Password:</label>
        <input
          disabled={isSubmitting}
          type="password"
          id="password"
          name="password"
          className="mb-4"
        />

        <div className="mt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </main>
  );
}
