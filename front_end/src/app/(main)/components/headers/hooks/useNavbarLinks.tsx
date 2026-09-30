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
import useMediaQuery from "@/hooks/use_media_query";
import { Community } from "@/types/projects";
import cn from "@/utils/core/cn";

import CreateQuestionButton from "../components/create_question_button";

// Narrowest widths at which Services, then Discover, still fit in the bar
// (measured with a logged-in header). Keep in sync with the min-[1100px] and
// min-[880px] classes in header.tsx.
export const NAV_FULL_MIN_WIDTH = 1100;
export const NAV_DISCOVER_MIN_WIDTH = 880;

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
          href: "/questions/",
        },
        tournaments: {
          label: t("tournaments"),
          href: "/tournaments/",
        },
        discover: {
          label: t("discover"),
          href: "/initiatives/",
        },
        services: {
          label: t("services"),
          href: "/services/",
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
        trackRecord: {
          label: t("trackRecord"),
          href: "/questions/track-record/",
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
       *  Breakpoint: \>= 1100 (NAV_FULL_MIN_WIDTH)
       */
      fullLinks: [
        LINKS.questions,
        LINKS.tournaments,
        ...(PUBLIC_MINIMAL_UI ? [] : [LINKS.discover, LINKS.services]),
      ],
      /**
       * Breakpoint: 880 - 1099 (NAV_DISCOVER_MIN_WIDTH)
       */
      mdLinks: [
        LINKS.questions,
        LINKS.tournaments,
        ...(PUBLIC_MINIMAL_UI ? [] : [LINKS.discover]),
      ],
      /**
       * Breakpoint: 512 - 879
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
      LINKS.discover,
      LINKS.services,
      LINKS.questions,
      LINKS.tournaments,
      PUBLIC_MINIMAL_UI,
      isLoggedIn,
      community,
      t,
    ]
  );

  // It's safe to use JavaScript to generate links set because they are shown based on user action
  const isLgScreen = useBreakpoint("lg");
  const isFullBar = useMediaQuery(`(min-width: ${NAV_FULL_MIN_WIDTH}px)`);
  const isDiscoverInBar = useMediaQuery(
    `(min-width: ${NAV_DISCOVER_MIN_WIDTH}px)`
  );
  const menuLinks = useMemo(() => {
    const links: NavbarLinkDefinition[] = PUBLIC_MINIMAL_UI
      ? [LINKS.trackRecord]
      : [LINKS.about, LINKS.press, LINKS.news, LINKS.trackRecord, LINKS.faq];

    if (!PUBLIC_MINIMAL_UI) {
      // As the bar narrows, Services and then Discover move into the menu
      if (!isFullBar) links.unshift(LINKS.services);
      if (!isDiscoverInBar) links.unshift(LINKS.discover);
    }

    // create question link is moved from navbar to desktop menu
    if (!isLgScreen && isLoggedIn) {
      links.push(LINKS.createQuestion);
    }

    return links;
  }, [
    LINKS.about,
    LINKS.createQuestion,
    LINKS.discover,
    LINKS.faq,
    LINKS.news,
    LINKS.press,
    LINKS.services,
    LINKS.trackRecord,
    PUBLIC_MINIMAL_UI,
    isLoggedIn,
    isLgScreen,
    isFullBar,
    isDiscoverInBar,
  ]);

  const mobileMenuLinks = useMemo(() => {
    const mainLinks: MobileMenuItemDefinition[] = [
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
            ...(PUBLIC_MINIMAL_UI ? [] : [LINKS.discover, LINKS.services]),
            { href: null, label: t("about"), isTitle: true },
            ...(PUBLIC_MINIMAL_UI
              ? [LINKS.trackRecord]
              : [
                  LINKS.about,
                  LINKS.press,
                  LINKS.news,
                  LINKS.trackRecord,
                  LINKS.faq,
                ]),
          ]),
    ];

    let accountLinks: MobileMenuItemDefinition[] = [];

    if (isLoggedIn) {
      accountLinks = [
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
    } else {
      // For logged out users, add account links to main links (they're conditionally hidden)
      mainLinks.push(
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

    return { mainLinks, accountLinks };
  }, [
    LINKS.about,
    LINKS.discover,
    LINKS.faq,
    LINKS.news,
    LINKS.press,
    LINKS.services,
    LINKS.trackRecord,
    LINKS.tournaments,
    PUBLIC_ALLOW_SIGNUP,
    PUBLIC_ALLOW_TUTORIAL,
    PUBLIC_MINIMAL_UI,
    user,
    isLoggedIn,
    setCurrentModal,
    t,
    community,
  ]);
  return { navbarLinks, menuLinks, LINKS, mobileMenuLinks, isLoggedIn };
};

export default useNavbarLinks;
