import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  icon: IconDefinition;
  title: string;
  description: string;
};

const AIBResourceCard: React.FC<Props> = ({ icon, title, description }) => {
  return (
    <div className="flex flex-1 flex-col items-start rounded-[10px] border-[1px] border-gray-500 bg-gray-0 p-8 antialiased dark:border-gray-500-dark dark:bg-gray-0-dark">
      <FontAwesomeIcon
        icon={icon}
        className="text-[26px] text-blue-700 dark:text-blue-700-dark"
      />

      <h4 className="m-0 mt-5 font-serif text-2xl font-semibold text-gray-800 dark:text-gray-800-dark">
        {title}
      </h4>

      <p className="m-0 mt-2.5 text-base text-gray-600 dark:text-gray-600-dark">
        {description}
      </p>
    </div>
  );
};

export default AIBResourceCard;
