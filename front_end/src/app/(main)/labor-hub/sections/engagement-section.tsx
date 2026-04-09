"use client";

import { faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { faCommentDots, faCopy } from "@fortawesome/free-regular-svg-icons";
import { faChartBar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

import { useModal } from "@/contexts/modal_context";
import { useCopyUrl, useShareOnTwitterLink } from "@/hooks/share";
import cn from "@/utils/core/cn";

import { NewsletterSubscribeCard } from "../components/newsletter-subscribe-card";

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

export function EngagementSection({
  className,
  newsletterListKey,
}: {
  className?: string;
  newsletterListKey?: string;
}) {
  return (
    <section
      className={cn(
        "grid gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8 print:hidden",
        className
      )}
    >
      <PartnerCard />
      <ShareCard />
      <NewsletterSubscribeCard listKey={newsletterListKey} />
    </section>
  );
}
