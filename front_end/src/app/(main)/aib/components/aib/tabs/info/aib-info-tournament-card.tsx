import Image, { StaticImageData } from "next/image";
import Link from "next/link";

type Props = {
  title: string;
  href: string;
  img: StaticImageData;
};

const AIBInfoTournamentCard: React.FC<Props> = ({ title, href, img }) => (
  <Link href={href} className="block no-underline focus:outline-none">
    <h5 className="m-0 mb-[18px] text-center text-[16px] font-medium text-blue-800 dark:text-blue-800-dark">
      {title}
    </h5>

    <div className="relative h-[210px] w-[210px] overflow-hidden rounded-[10px]">
      <Image
        src={img}
        alt={title}
        fill
        className="object-cover"
        priority={false}
        unoptimized
      />
    </div>
  </Link>
);

export default AIBInfoTournamentCard;
