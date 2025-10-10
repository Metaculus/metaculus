import Image from "next/image";
import Link from "next/link";

import videoThumbnail from "@/app/(main)/aib/assets/video-thumbnail.png";

const AIBInfoSubmitSteps: React.FC = () => {
  return (
    <div className="flex flex-col gap-[60px] antialiased sm:pt-5 lg:flex-row lg:items-center lg:pt-10 2xl:pt-0">
      <div className="flex flex-1 flex-col items-center gap-[26px] rounded-[13px] bg-blue-900 p-8 dark:bg-blue-900-dark md:mx-auto md:max-w-[432px] lg:mx-0 lg:max-w-none">
        <p className="m-0 mx-auto max-w-[400px] text-center text-2xl text-gray-0 dark:text-gray-0-dark">
          Learn how to submit your forecasting bot in 30 minutes
        </p>

        <Link
          href="https://www.loom.com/share/fc3c1a643b984a15b510647d8f760685"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Watch the submission walkthrough video"
        >
          <Image
            src={videoThumbnail}
            alt="Video Thumbnail"
            width={468}
            unoptimized
          />
        </Link>
      </div>

      <div className="my-6 flex-1">
        <h4 className="m-0 mb-[55px] text-center text-4xl font-bold text-blue-800 dark:text-blue-800-dark">
          Submit Your Bot in 3 Steps
        </h4>
        <div className="flex flex-col gap-[42px]">
          {submitSteps.map((step, index) => (
            <AIBInfoSubmitStep key={index} index={index + 1} content={step} />
          ))}
        </div>
      </div>
    </div>
  );
};

const submitSteps = [
  <>
    Create a new bot account by going to the{" "}
    <Link
      className="text-blue-700 dark:text-blue-700-dark"
      href="/aib/2025/fall"
    >
      Tournament Page
    </Link>
    .
  </>,
  "Build your bot using the instructions provided.",
  "Watch your bot forecast and compete for prizes!",
];

const AIBInfoSubmitStep: React.FC<{
  index: number;
  content: React.ReactNode;
}> = ({ index, content }) => {
  return (
    <div className="flex items-center gap-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500 p-[10px] text-[22.5px] text-gray-0 dark:bg-blue-500-dark dark:text-gray-0-dark">
        {index}
      </div>
      <p className="m-0 text-base text-gray-800 dark:text-gray-800-dark sm:text-2xl">
        {content}
      </p>
    </div>
  );
};

export default AIBInfoSubmitSteps;
