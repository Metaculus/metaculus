"use client";

import { faBell } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "@/contexts/auth_context";
import cn from "@/utils/core/cn";

import { subscribeToNewsletter } from "../../actions";

export type NewsletterCopy = {
  title: string;
  description: string;
  placeholder: string;
  submit: string;
  success: string;
  toastSuccess: string;
  toastError: string;
};

// The Labor Hub's original hardcoded English. Callers that are translated (e.g.
// the Midterms hub) pass localized strings via `copy`; omitting it keeps this
// card rendering exactly as it always has.
const DEFAULT_COPY: NewsletterCopy = {
  title: "Subscribe for updates",
  description:
    "Sign up to get notified when we publish new forecasts, insights, and improvements.",
  placeholder: "Email address",
  submit: "Save",
  success: "You're subscribed!",
  toastSuccess: "Subscribed successfully!",
  toastError: "Failed to subscribe. Please try again.",
};

type Props = {
  listKey?: string;
  className?: string;
  formClassName?: string;
  copy?: Partial<NewsletterCopy>;
};

export function NewsletterSubscribeCard({
  listKey,
  className,
  formClassName,
  copy,
}: Props) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const text = { ...DEFAULT_COPY, ...copy };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await subscribeToNewsletter(email, listKey);
      setIsSuccess(true);
      setEmail("");
      toast(text.toastSuccess, {
        className: "dark:bg-blue-700-dark dark:text-gray-0-dark",
      });
    } catch {
      toast.error(text.toastError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-md bg-purple-200 p-6 text-center dark:bg-purple-200-dark sm:p-8 lg:gap-6 xl:p-10",
        className
      )}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-3 lg:gap-4">
          <FontAwesomeIcon
            icon={faBell}
            className="text-xl text-purple-800 dark:text-purple-800-dark lg:text-[22px]"
          />
          <h3 className="m-0 text-base font-medium leading-7 text-purple-900 dark:text-purple-900-dark lg:text-lg">
            {text.title}
          </h3>
        </div>
        <p className="m-0 text-sm leading-5 text-purple-900 dark:text-purple-900-dark lg:text-base lg:leading-6">
          {text.description}
        </p>
      </div>
      {isSuccess ? (
        <div className="rounded bg-gray-0 px-3 py-2 text-sm text-purple-900 dark:bg-gray-0-dark dark:text-purple-900-dark">
          {text.success}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={cn(
            "flex w-full gap-2.5 lg:flex-col xl:flex-row",
            formClassName
          )}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label={text.placeholder}
            placeholder={text.placeholder}
            className="min-w-0 flex-1 rounded bg-gray-0 px-3 py-2 text-sm text-purple-900 placeholder:text-purple-600 focus:outline-none dark:bg-gray-0-dark dark:text-purple-900-dark dark:placeholder:text-purple-600-dark"
            required
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded bg-blue-800 px-3 py-2 text-sm text-gray-0 transition-colors hover:bg-blue-900 disabled:opacity-50 dark:bg-blue-800-dark dark:text-gray-0-dark dark:hover:bg-blue-900-dark"
          >
            {text.submit}
          </button>
        </form>
      )}
    </div>
  );
}
