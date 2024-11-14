import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

const useConfirmPageLeave = (
  enabled: boolean,
  preventLinkNavigation = true
) => {
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (!enabled) return;
      e.preventDefault();
    }

    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [enabled]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLAnchorElement;

      if (enabled && preventLinkNavigation) {
        event.preventDefault();

        const confirmed = confirm(t("confirmPageLeaveMessage"));
        if (confirmed) {
          router.push(target.href ?? "/");
        } else {
          // Prevent global loader bar update
          event.stopPropagation();
        }
      }
    };

    document.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", handleClick);
    });

    return () => {
      document.querySelectorAll("a").forEach((link) => {
        link.removeEventListener("click", handleClick);
      });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, preventLinkNavigation]);
};

export default useConfirmPageLeave;
