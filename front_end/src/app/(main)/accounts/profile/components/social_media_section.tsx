import {
  faFacebook,
  faGithub,
  faLinkedin,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import {
  faChartLine,
  faEarth,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { FC } from "react";

import { UserProfile } from "@/types/users";

export type SocialMediaFieldName =
  | "website"
  | "twitter"
  | "linkedin"
  | "facebook"
  | "github"
  | "good_judgement_open"
  | "kalshi"
  | "manifold"
  | "infer"
  | "hypermind";

export type SocialMediaEntry = {
  icon: IconDefinition;
  link: string | undefined;
  name: SocialMediaFieldName;
  label: string;
};

export const getSocialMediaArray = (user: UserProfile): SocialMediaEntry[] => [
  { icon: faEarth, link: user.website, name: "website", label: "Website" },
  { icon: faXTwitter, link: user.twitter, name: "twitter", label: "Twitter/X" },
  {
    icon: faLinkedin,
    link: user.linkedin,
    name: "linkedin",
    label: "LinkedIn",
  },
  {
    icon: faFacebook,
    link: user.facebook,
    name: "facebook",
    label: "Facebook",
  },
  { icon: faGithub, link: user.github, name: "github", label: "GitHub" },
  {
    icon: faChartLine,
    link: user.good_judgement_open,
    name: "good_judgement_open",
    label: "Good Judgment Open",
  },
  { icon: faChartLine, link: user.kalshi, name: "kalshi", label: "Kalshi" },
  {
    icon: faChartLine,
    link: user.manifold,
    name: "manifold",
    label: "Manifold",
  },
  { icon: faChartLine, link: user.infer, name: "infer", label: "RFI" },
  {
    icon: faChartLine,
    link: user.hypermind,
    name: "hypermind",
    label: "Hypermind",
  },
];

export const hasUserSocialMediaLink = (user: UserProfile) => {
  return getSocialMediaArray(user).some(({ link }) => !!link);
};

const SocialMediaFragment: FC<{
  user: UserProfile;
}> = ({ user }) => {
  const socialMedia = getSocialMediaArray(user).filter(
    ({ link }) => !!link
  ) as (SocialMediaEntry & { link: string })[];
  return (
    <>
      {socialMedia.map(({ icon, link, name }) => {
        return (
          <div key={name} className="flex flex-col">
            <Link href={link} target="_blank" rel="ugc">
              <FontAwesomeIcon
                icon={icon}
                size="lg"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              ></FontAwesomeIcon>
            </Link>
          </div>
        );
      })}
    </>
  );
};

export default SocialMediaFragment;
