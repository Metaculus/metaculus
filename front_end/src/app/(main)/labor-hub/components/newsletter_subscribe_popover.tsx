"use client";

import { faCircleCheck } from "@fortawesome/free-regular-svg-icons";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "@/contexts/auth_context";
import cn from "@/utils/core/cn";

import { subscribeToNewsletter } from "../../actions";

type Props = {
  listKey?: string;
  className?: string;
  onClose?: () => void;
};

export function NewsletterSubscribePopover({
  listKey,
  className,
  onClose,
}: Props) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await subscribeToNewsletter(email, listKey);
      setIsSuccess(true);
      setEmail("");
    } catch {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2.5 rounded-md bg-purple-200 p-5 dark:bg-purple-200-dark",
        className
      )}
    >
      <button
        type="button"
        aria-label="Close newsletter signup"
        onClick={onClose}
        className="absolute right-4 top-4 text-lg text-blue-900/50 transition-colors hover:text-blue-900 dark:text-blue-900-dark/50 dark:hover:text-blue-900-dark"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>

      {isSuccess ? (
        <div className="flex flex-col items-center gap-3.5 py-1 text-center">
          <FontAwesomeIcon
            icon={faCircleCheck}
            className="text-[34px] leading-none text-purple-800 dark:text-purple-800-dark"
          />
          <p className="m-0 text-sm leading-5 text-purple-900 dark:text-purple-900-dark">
            You&apos;re subscribed to the
            <br />
            Labor Hub Newsletter!
          </p>
        </div>
      ) : (
        <>
          <div className="pr-8">
            <h3 className="m-0 text-base font-medium leading-6 text-purple-900 dark:text-purple-900-dark">
              Labor Hub Newsletter
            </h3>
          </div>

          <p className="m-0 text-sm leading-5 text-purple-800 dark:text-purple-800-dark">
            Enter your email to get notified of important news and updates
          </p>

          <form onSubmit={handleSubmit} className="flex items-start gap-2.5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="min-w-0 flex-1 rounded bg-gray-0 px-[11px] py-2 text-sm leading-5 text-purple-900 placeholder:text-purple-600 focus:outline-none disabled:opacity-70 dark:bg-gray-0-dark dark:text-purple-900-dark dark:placeholder:text-purple-600-dark"
              required
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="shrink-0 rounded bg-blue-800 px-[11px] py-2 text-sm leading-5 text-gray-0 transition-colors hover:bg-blue-900 disabled:opacity-50 dark:bg-blue-800-dark dark:text-gray-0-dark dark:hover:bg-blue-900-dark"
            >
              Save
            </button>
          </form>
        </>
      )}
    </div>
  );
}
