import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Description() {
  return (
    <div className="flex w-full flex-col gap-3 md:flex-row">
      <div className="flex w-full flex-row items-start rounded bg-white/60 p-4 dark:bg-blue-100-dark/60">
        <div className="text-xs leading-normal text-blue-800 dark:text-blue-800-dark md:text-sm min-[1920px]:text-base">
          <FontAwesomeIcon
            icon={faInfoCircle}
            className="mr-2 text-sm text-blue-600 dark:text-blue-600-dark md:text-base"
          />
          Prize pool is available to US residents only
        </div>
      </div>
    </div>
  );
}

export default Description;
