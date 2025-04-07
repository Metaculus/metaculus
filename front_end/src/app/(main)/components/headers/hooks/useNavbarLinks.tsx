import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { ReactNode, useMemo } from "react";

import { useAuth } from "@/contexts/auth_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { useBreakpoint } from "@/hooks/tailwind";

type NavbarLinkDefinition = {
  label: ReactNode;
  href: string;
};

const useNavbarLinks = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const isLoggedIn = !isNil(user);
  const { PUBLIC_MINIMAL_UI } = usePublicSettings();

  const LINKS = useMemo(
    () =>
      ({
        questions: {
          label: t("questions"),
          href: "/questions",
        },
        tournaments: {
          label: t("tournaments"),
          href: "/tournaments",
        },
        leaderboards: {
          label: t("leaderboards"),
          href: "/leaderboard",
        },
        news: {
          label: t("news"),
          href: "/news/",
        },
        about: {
          label: t("aboutMetaculus"),
          href: "/about/",
        },
        press: {
          label: t("forJournalists"),
          href: "/press/",
        },
        faq: {
          label: t("faq"),
          href: "/faq/",
        },
        journal: {
          label: t("theJournal"),
          href: "/project/journal/",
        },
        trackRecord: {
          label: t("trackRecord"),
          href: "/questions/track-record/",
        },
        aggregationExplorer: {
          label: t("aggregationExplorer"),
          href: "/aggregation-explorer",
        },
        createQuestion: {
          label: (
            <div className="flex h-full items-center capitalize">
              <FontAwesomeIcon size="xs" className="mr-1" icon={faPlus} />
              {t("create")}
            </div>
          ),
          href: "/questions/create/",
        },
      }) as const,
    [t]
  );

  // We generate and render links set based on css to ensure proper rendering on the 1st frame
  // That's why we need a separate list for every expected screen size
  const navbarLinks = useMemo(
    () => ({
      /**
       *  Breakpoint: \>= 1024
       */
      lgLinks: [
        LINKS.questions,
        LINKS.tournaments,
        ...(PUBLIC_MINIMAL_UI ? [] : [LINKS.leaderboards, LINKS.news]),
      ],
      /**
       * Breakpoint: 512 - 1023
       */
      smLinks: [LINKS.questions, LINKS.tournaments],
      /**
       * Breakpoint: 375 - 511
       */
      xsLinks: isLoggedIn
        ? [LINKS.questions, LINKS.tournaments]
        : [LINKS.questions],
      /**
       * Breakpoint: \< 375
       */
      xxsLinks: [LINKS.questions],
    }),
    [
      LINKS.leaderboards,
      LINKS.news,
      LINKS.questions,
      LINKS.tournaments,
      PUBLIC_MINIMAL_UI,
      isLoggedIn,
    ]
  );

  // It's safe to use JavaScript to generate links set because they are shown based on user action
  const isMenuCollapsed = useBreakpoint("lg");
  const menuLinks = useMemo(() => {
    // common links that are always shown
    const links: NavbarLinkDefinition[] = [
      LINKS.trackRecord,
      LINKS.aggregationExplorer,
    ];

    // create question link is moved from navbar to desktop menu
    if (!isMenuCollapsed && isLoggedIn) {
      links.push(LINKS.createQuestion);
    }

    if (!PUBLIC_MINIMAL_UI) {
      // common links that are hidden with minimal UI
      links.unshift(LINKS.about, LINKS.press, LINKS.faq, LINKS.journal);

      if (!isMenuCollapsed) {
        // leaderboard and news are moved from navbar to desktop menu
        links.unshift(LINKS.leaderboards, LINKS.news);
      }
    }

    return links;
  }, [
    LINKS.about,
    LINKS.aggregationExplorer,
    LINKS.createQuestion,
    LINKS.faq,
    LINKS.journal,
    LINKS.leaderboards,
    LINKS.news,
    LINKS.press,
    LINKS.trackRecord,
    PUBLIC_MINIMAL_UI,
    isLoggedIn,
    isMenuCollapsed,
  ]);

  return { navbarLinks, menuLinks, LINKS };
};

export default useNavbarLinks;
