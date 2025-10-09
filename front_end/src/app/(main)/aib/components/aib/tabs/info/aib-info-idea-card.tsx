import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  icon: IconDefinition;
  title?: string;
}>;

const AIBInfoIdeaCard: React.FC<Props> = ({ icon, title, children }) => {
  return (
    <div className="flex flex-1 flex-col items-start">
      <FontAwesomeIcon
        className="h-[26px] w-[26px] text-blue-700 dark:text-blue-700-dark"
        icon={icon}
      />
      <h4 className="m-0 mt-5 text-nowrap font-serif text-2xl font-semibold text-blue-800 antialiased dark:text-blue-800-dark">
        {title}
      </h4>
      <div className="mt-2.5 text-base font-normal text-blue-700 dark:text-blue-700-dark">
        {children}
      </div>
    </div>
  );
};

export default AIBInfoIdeaCard;
