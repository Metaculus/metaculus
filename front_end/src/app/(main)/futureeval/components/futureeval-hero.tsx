import Image from "next/image";

import FELogoDark from "../assets/FE-logo-dark.svg?url";
import FELogoLight from "../assets/FE-logo-light.svg?url";

const FutureEvalHero: React.FC = () => {
  return (
    <div className="flex flex-col items-center lg:items-start">
      {/* Light mode logo */}
      <Image
        src={FELogoLight}
        alt="FutureEval"
        width={269}
        height={62}
        className="h-auto w-[200px] dark:hidden sm:w-[269px]"
        priority
      />
      {/* Dark mode logo */}
      <Image
        src={FELogoDark}
        alt="FutureEval"
        width={269}
        height={62}
        className="hidden h-auto w-[200px] dark:block sm:w-[269px]"
        priority
      />
    </div>
  );
};

export default FutureEvalHero;
