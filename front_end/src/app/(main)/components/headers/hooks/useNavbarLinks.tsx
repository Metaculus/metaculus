import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { ReactNode, useMemo } from "react";

import { LogOut } from "@/app/(main)/accounts/actions";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { useBreakpoint } from "@/hooks/tailwind";
import { Community } from "@/types/projects";
import cn from "@/utils/core/cn";

import CreateQuestionButton from "../components/create_question_button";

type NavbarLinkDefinition = {
  label: ReactNode;
  href: string;
};

type MobileMenuItemDefinition = Omit<NavbarLinkDefinition, "href"> & {
  href: string | null;
  isTitle?: boolean;
  className?: string;
  onClick?: () => void;
};

const useNavbarLinks = ({
  community,
}: { community?: Community | null } = {}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const isLoggedIn = !isNil(user);
  const { PUBLIC_MINIMAL_UI, PUBLIC_ALLOW_TUTORIAL, PUBLIC_ALLOW_SIGNUP } =
    usePublicSettings();

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
        services: {
          label: t("services"),
          href: "/services",
        },
        leaderboards: {
          label: <span className="capitalize">{t("leaderboards")}</span>,
          href: "/leaderboard",
        },
        news: {
          label: t("news"),
          href: "/news/",
        },
        communities: {
          label: t("communities"),
          href: "/questions/?feed=communities",
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
        aiBenchmark: {
          label: t("aiBenchmark"),
          href: "/aib",
        },
        createQuestion: {
          label: <CreateQuestionButton />,
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
        ...(PUBLIC_MINIMAL_UI ? [] : [LINKS.services, LINKS.news]),
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
      /**
       * Community links
       */
      communityLinks: [
        {
          href: `/c/${community?.slug}/`,
          label: t("questions"),
          className:
            "mr-2 px-2 flex h-full items-center capitalize no-underline hover:bg-blue-200-dark",
        },
        ...(isLoggedIn
          ? [
              {
                href: `/questions/create/?community_id=${community?.id}`,
                label: (
                  <>
                    <FontAwesomeIcon
                      width={14}
                      className="mr-1"
                      icon={faPlus}
                    />
                    {t("create")}
                  </>
                ),
                className:
                  "mr-2 flex top-1/2 relative -translate-y-1/2 items-center rounded-full bg-blue-300-dark p-3 py-1 capitalize no-underline hover:bg-blue-200-dark",
              },
            ]
          : []),
      ],
    }),
    [
      LINKS.services,
      LINKS.news,
      LINKS.questions,
      LINKS.tournaments,
      PUBLIC_MINIMAL_UI,
      isLoggedIn,
      community,
      t,
    ]
  );

  // It's safe to use JavaScript to generate links set because they are shown based on user action
  const isMenuCollapsed = useBreakpoint("lg");
  const menuLinks = useMemo(() => {
    // common links that are always shown
    const links: NavbarLinkDefinition[] = [
      LINKS.communities,
      LINKS.leaderboards,
      LINKS.trackRecord,
      LINKS.aggregationExplorer,
      LINKS.aiBenchmark,
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
        links.unshift(LINKS.services, LINKS.news);
      }
    }

    return links;
  }, [
    LINKS.about,
    LINKS.aggregationExplorer,
    LINKS.aiBenchmark,
    LINKS.createQuestion,
    LINKS.faq,
    LINKS.journal,
    LINKS.leaderboards,
    LINKS.services,
    LINKS.news,
    LINKS.press,
    LINKS.trackRecord,
    PUBLIC_MINIMAL_UI,
    isLoggedIn,
    isMenuCollapsed,
  ]);

  const mobileMenuLinks = useMemo(() => {
    const links: MobileMenuItemDefinition[] = [
      ...(!isNil(community)
        ? [
            { href: null, label: t("community"), isTitle: true },
            { href: `/c/${community.slug}`, label: t("questions") },
          ]
        : [
            {
              ...LINKS.tournaments,
              className: cn("hidden", {
                "max-[374px]:flex": !isNil(user),
                "max-[511px]:flex": isNil(user),
              }),
            },
            LINKS.services,
            LINKS.news,
            LINKS.communities,
            { href: null, label: t("more"), isTitle: true },
            LINKS.leaderboards,
            LINKS.about,
            LINKS.press,
            LINKS.faq,
            LINKS.trackRecord,
            LINKS.journal,
            LINKS.aggregationExplorer,
            LINKS.aiBenchmark,
          ]),
    ];

    if (isLoggedIn) {
      const accountLinks: MobileMenuItemDefinition[] = [
        !isNil(community)
          ? {
              href: `/questions/create/?community_id=${community.id}`,
              label: (
                <>
                  <FontAwesomeIcon size="1x" className="mr-1" icon={faPlus} />
                  {t("createQuestion")}
                </>
              ),
              className:
                "mx-auto flex !w-[max-content] items-center rounded-full bg-blue-300-dark !px-2.5 !py-1 text-sm capitalize no-underline hover:bg-blue-200-dark",
            }
          : LINKS.createQuestion,
        { href: null, label: t("account"), isTitle: true },
        { href: `/accounts/profile/${user.id}`, label: t("profile") },
        { href: "/accounts/settings/", label: t("settings") },
        ...(PUBLIC_ALLOW_TUTORIAL
          ? [
              {
                href: null,
                label: t("tutorial"),
                onClick: () => setCurrentModal({ type: "onboarding" }),
              },
            ]
          : []),
        ...(user.is_superuser && PUBLIC_ALLOW_SIGNUP
          ? [
              {
                href: "/accounts/invite/",
                label: t("signupInviteUsers"),
              },
            ]
          : []),
        ...(user.is_superuser
          ? [
              {
                href: "/admin/",
                label: t("admin"),
              },
            ]
          : []),
        { href: null, label: t("logout"), onClick: () => void LogOut() },
      ];

      links.push(...accountLinks);
    } else {
      links.push(
        {
          href: null,
          label: t("account"),
          isTitle: true,
          className: !isNil(community) ? "" : "hidden max-[374px]:flex",
        },
        {
          href: null,
          label: t("login"),
          className: !isNil(community) ? "" : "hidden max-[374px]:flex",
          onClick: () => setCurrentModal({ type: "signin" }),
        }
      );
    }

    return links;
  }, [
    LINKS.about,
    LINKS.services,
    LINKS.aggregationExplorer,
    LINKS.aiBenchmark,
    LINKS.createQuestion,
    LINKS.faq,
    LINKS.journal,
    LINKS.leaderboards,
    LINKS.news,
    LINKS.press,
    LINKS.trackRecord,
    LINKS.tournaments,
    PUBLIC_ALLOW_SIGNUP,
    PUBLIC_ALLOW_TUTORIAL,
    user,
    isLoggedIn,
    setCurrentModal,
    t,
    community,
  ]);
  return { navbarLinks, menuLinks, LINKS, mobileMenuLinks };
};

export default useNavbarLinks;
