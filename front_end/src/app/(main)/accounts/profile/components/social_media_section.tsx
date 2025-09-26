import {
  faFacebook,
  faGithub,
  faLinkedin,
  faTwitter,
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

export const getSocialMediaArray = (
  user: UserProfile
): [IconDefinition, string | undefined, string][] => [
  [faEarth, user.website, "website"],
  [faTwitter, user.twitter, "Twitter/X"],
  [faLinkedin, user.linkedin, "LinkedIn"],
  [faFacebook, user.facebook, "Facebook"],
  [faGithub, user.github, "GitHub"],
  [faChartLine, user.good_judgement_open, "Good Judgment Open"],
  [faChartLine, user.kalshi, "Kalshi"],
  [faChartLine, user.manifold, "Manifold"],
  [faChartLine, user.infer, "RFI"],
  [faChartLine, user.hypermind, "Hypermind"],
];

export const hasUserSocialMediaLink = (user: UserProfile) => {
  return getSocialMediaArray(user).filter(([, link]) => !!link).length > 0;
};

const SocialMediaFragment: FC<{
  user: UserProfile;
}> = ({ user }) => {
  const socialMedia = getSocialMediaArray(user).filter(([, url]) => !!url);
  return (
    <>
      {socialMedia.map(([icon, link, label]) => {
        return (
          <div key={label} className="flex flex-col">
            {link && (
              <Link href={link} target="_blank" rel="ugc">
                <FontAwesomeIcon
                  icon={icon}
                  size="lg"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                ></FontAwesomeIcon>
              </Link>
            )}
          </div>
        );
      })}
    </>
  );
};

export default SocialMediaFragment;
