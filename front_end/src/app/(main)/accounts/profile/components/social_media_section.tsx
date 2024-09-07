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

import { FormError, Input } from "@/components/ui/form_field";
import { UserProfile } from "@/types/users";

const SocialMediaSection: FC<{
  user: UserProfile;
  editMode: boolean;
  register: any;
  state: any;
}> = ({ user, editMode, register, state }) => {
  const socialMedia = [
    [faEarth, user.website, "website"],
    [faTwitter, user.twitter, "twitter"],
    [faLinkedin, user.linkedin, "linkedin"],
    [faFacebook, user.facebook, "facebook"],
    [faGithub, user.github, "github"],
    [faChartLine, user.good_judgement_open, "good_judgement_open"],
    [faChartLine, user.kalshi, "kalshi"],
    [faChartLine, user.manifold, "manifold"],
    [faChartLine, user.infer, "infer"],
    [faChartLine, user.hypermind, "hypermind"],
  ];

  return (
    <div
      className={
        "space-x-1 space-y-1" + (editMode ? " flex flex-col" : " flex flex-row")
      }
    >
      {socialMedia.map((x, index) => {
        const icon: IconDefinition = x[0] as IconDefinition;
        const link: string | undefined = x[1] as string;
        const label: string = x[2] as string;
        return (
          <div key={index} className="flex flex-col">
            {link && (
              <Link href={link} target="#blank">
                <FontAwesomeIcon
                  icon={icon}
                  size="lg"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                ></FontAwesomeIcon>
              </Link>
            )}
            {editMode && (
              <div className="flex flex-col">
                <span>{label}</span>
                <Input
                  className="w-6/12 rounded border border-gray-700 px-3 py-2 text-sm placeholder:italic dark:border-gray-700-dark	"
                  placeholder="http://www.example.com"
                  defaultValue={link ? link : ""}
                  {...register(label)}
                />
                <FormError errors={state?.errors} name={label} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SocialMediaSection;
