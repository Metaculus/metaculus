import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/**
 * Hook to display remaining time until grace period ends
 * Updates every second for a live countdown
 */
const useGracePeriodCountdown = (gracePeriodEnd: Date | null) => {
  const t = useTranslations();
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!gracePeriodEnd) {
      setTimeRemaining("");
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const updateTime = () => {
      const now = new Date();
      const diff = gracePeriodEnd.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("expired");
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(
          `${t("periodDays", { count: days })}, ${t("periodHours", { count: hours })}`
        );
      } else if (hours > 0) {
        setTimeRemaining(
          `${t("periodHours", { count: hours })}, ${t("periodMinutes", { count: minutes })}`
        );
      } else if (minutes > 0) {
        setTimeRemaining(
          `${t("periodMinutes", { count: minutes })}, ${t("periodSeconds", { count: seconds })}`
        );
      } else {
        setTimeRemaining(t("periodSeconds", { count: seconds }));
      }
    };

    updateTime();
    intervalId = setInterval(updateTime, 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [gracePeriodEnd, t]);

  return timeRemaining;
};

export default useGracePeriodCountdown;
