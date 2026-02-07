"use client";

import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, FormEvent, useState } from "react";

import cn from "@/utils/core/cn";

import { subscribeToNewsletter } from "../../actions";

const BENEFITS = [
  "newsletterBenefit1",
  "newsletterBenefit2",
  "newsletterBenefit3",
] as const;

const NewsletterSubscription: FC = () => {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await subscribeToNewsletter(email);
      setIsSuccess(true);
      setEmail("");
    } catch {
      setError(t("newsletterError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-olive-500 dark:bg-olive-500-dark">
      <div className="mx-auto flex w-full max-w-[1352px] flex-col items-start gap-8 px-4 py-8 md:justify-between md:px-20 md:py-[60px] lg:flex-row lg:items-center 2xl:px-0">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10 lg:items-center">
          <div className="flex flex-col gap-1.5 text-mint-900 dark:text-mint-900-dark">
            <h2 className="m-0 text-xl font-bold leading-7">
              {t("newsletterTitle")}
            </h2>
            <p className="m-0 text-base font-medium leading-5">
              {t("newsletterDescription")}
            </p>
          </div>

          <div className="hidden flex-col items-start gap-4 md:flex">
            {BENEFITS.map((benefitKey) => (
              <div
                key={benefitKey}
                className="flex items-center gap-2 text-mint-900 dark:text-mint-900-dark"
              >
                <FontAwesomeIcon icon={faCheck} className="size-3" />
                <span className="text-sm font-medium leading-4">
                  {t(benefitKey)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isSuccess ? (
          <div className="flex h-10 items-center rounded-lg bg-mint-200 px-4 text-sm font-medium text-mint-900 dark:bg-mint-200-dark dark:text-mint-900-dark">
            {t("newsletterSuccess")}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
          >
            <div className="flex flex-col gap-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("newsletterPlaceholder")}
                className={cn(
                  "h-10 w-full rounded-lg border-[1.5px] border-transparent bg-mint-200 px-3.5 text-sm font-medium text-mint-800 placeholder:text-mint-700 focus:border-mint-700 focus:outline-none dark:bg-mint-200-dark dark:text-mint-800-dark dark:placeholder:text-mint-700-dark dark:focus:border-mint-700-dark sm:w-[352px]",
                  error &&
                    "border-red-500 focus:border-red-500 dark:border-red-500-dark dark:focus:border-red-500-dark"
                )}
                required
                disabled={isLoading}
              />
              {error && (
                <span className="text-xs font-medium text-red-500 dark:text-red-500-dark">
                  {error}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-10 w-full items-center justify-center rounded-lg bg-mint-700 px-3.5 text-sm font-medium text-mint-200 transition-colors hover:bg-mint-800 disabled:opacity-50 dark:bg-mint-700-dark dark:text-mint-200-dark dark:hover:bg-mint-800-dark sm:w-auto"
            >
              {isLoading ? t("subscribing") : t("subscribe")}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default NewsletterSubscription;
