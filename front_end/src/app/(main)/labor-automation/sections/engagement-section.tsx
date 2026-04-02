"use client";

import { faXTwitter } from "@fortawesome/free-brands-svg-icons";
import {
  faBell,
  faCommentDots,
  faCopy,
} from "@fortawesome/free-regular-svg-icons";
import { faChartBar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { useCopyUrl, useShareOnTwitterLink } from "@/hooks/share";
import cn from "@/utils/core/cn";

import { subscribeToNewsletter } from "../../actions";

function PartnerCard() {
  const { setCurrentModal } = useModal();

  return (
    <div className="flex flex-col items-center gap-4 rounded-md bg-blue-400 p-6 text-center dark:bg-blue-400-dark sm:p-8 lg:gap-6 xl:p-10">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-3 lg:gap-4">
          <FontAwesomeIcon
            icon={faCommentDots}
            className="text-xl text-blue-800 dark:text-blue-800-dark lg:text-[22px]"
          />
          <h3 className="m-0 text-base font-medium leading-7 text-blue-800 dark:text-blue-800-dark lg:text-lg">
            Reach out to Metaculus
          </h3>
        </div>
        <p className="m-0 text-sm leading-5 text-blue-900 dark:text-blue-900-dark lg:text-base lg:leading-6">
          Have thoughts, questions, or spotted something unclear? Your input
          helps us improve this dashboard.
        </p>
      </div>
      <div className="flex gap-2.5 lg:flex-col xl:flex-row">
        <Link
          href="/services"
          className="rounded bg-blue-200 px-3 py-1.5 text-sm text-blue-900 no-underline dark:bg-blue-200-dark dark:text-blue-900-dark"
        >
          View Services
        </Link>
        <button
          onClick={() => setCurrentModal({ type: "contactUs" })}
          className="rounded bg-blue-200 px-3 py-1.5 text-sm text-blue-900 dark:bg-blue-200-dark dark:text-blue-900-dark"
        >
          Contact Us
        </button>
      </div>
    </div>
  );
}

function ShareCard() {
  const copyUrl = useCopyUrl();
  const shareOnTwitterLink = useShareOnTwitterLink(
    "Check out the Labor Automation Forecasting Hub on Metaculus"
  );

  return (
    <div className="flex flex-col items-center gap-4 rounded-md bg-olive-300 p-6 text-center dark:bg-olive-400-dark sm:p-8 lg:gap-6 xl:p-10">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-3 lg:gap-4">
          <FontAwesomeIcon
            icon={faChartBar}
            className="text-xl text-olive-800 dark:text-olive-800-dark lg:text-[22px]"
          />
          <h3 className="m-0 text-base font-medium leading-7 text-olive-900 dark:text-olive-900-dark lg:text-lg">
            Share the dashboard
          </h3>
        </div>
        <p className="m-0 text-sm leading-5 text-olive-900 dark:text-olive-900-dark lg:text-base lg:leading-6">
          Think this could help others understand how AI affects jobs? Share it
          with your network.
        </p>
      </div>
      <div className="flex gap-2.5 text-sm text-olive-900 dark:text-olive-900-dark lg:flex-col xl:flex-row">
        <button
          onClick={copyUrl}
          className="flex items-center gap-2.5 rounded bg-olive-100 px-3 py-1.5 dark:bg-olive-100-dark"
        >
          <FontAwesomeIcon icon={faCopy} />
          <span>Copy Link</span>
        </button>
        <a
          href={shareOnTwitterLink}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 rounded bg-olive-100 px-3 py-1.5 text-olive-900 no-underline dark:bg-olive-100-dark dark:text-olive-900-dark"
        >
          <FontAwesomeIcon icon={faXTwitter} />
          <span>Share on X</span>
        </a>
      </div>
    </div>
  );
}

function SubscribeCard({ listKey }: { listKey?: string }) {
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
      toast("Subscribed successfully!", {
        className: "dark:bg-blue-700-dark dark:text-gray-0-dark",
      });
    } catch {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-md bg-purple-200 p-6 text-center dark:bg-purple-200-dark sm:p-8 lg:gap-6 xl:p-10">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-3 lg:gap-4">
          <FontAwesomeIcon
            icon={faBell}
            className="text-xl text-purple-800 dark:text-purple-800-dark lg:text-[22px]"
          />
          <h3 className="m-0 text-base font-medium leading-7 text-purple-900 dark:text-purple-900-dark lg:text-lg">
            Subscribe for updates
          </h3>
        </div>
        <p className="m-0 text-sm leading-5 text-purple-900 dark:text-purple-900-dark lg:text-base lg:leading-6">
          Sign up to get notified when we publish new forecasts, insights, and
          improvements.
        </p>
      </div>
      {isSuccess ? (
        <div className="rounded bg-gray-0 px-3 py-2 text-sm text-purple-900 dark:bg-gray-0-dark dark:text-purple-900-dark">
          You&apos;re subscribed!
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex w-full gap-2.5 lg:flex-col xl:flex-row"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="min-w-0 flex-1 rounded bg-gray-0 px-3 py-2 text-sm text-purple-900 placeholder:text-purple-600 focus:outline-none dark:bg-gray-0-dark dark:text-purple-900-dark dark:placeholder:text-purple-600-dark"
            required
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded bg-blue-800 px-3 py-2 text-sm text-gray-0 transition-colors hover:bg-blue-900 disabled:opacity-50 dark:bg-blue-800-dark dark:text-gray-0-dark dark:hover:bg-blue-900-dark"
          >
            Save
          </button>
        </form>
      )}
    </div>
  );
}

export function EngagementSection({
  className,
  newsletterListKey,
}: {
  className?: string;
  newsletterListKey?: string;
}) {
  return (
    <section
      className={cn("grid gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8", className)}
    >
      <PartnerCard />
      <ShareCard />
      <SubscribeCard listKey={newsletterListKey} />
    </section>
  );
}
