import cn from "@/utils/core/cn";

const DIE_PATH =
  "M64 80c-8.8 0-16 7.2-16 16V416c0 8.8 7.2 16 16 16H384c8.8 " +
  "0 16-7.2 16-16V96c0-8.8-7.2-16-16-16H64zM0 96C0 60.7 28.7 32 " +
  "64 32H384c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 " +
  "0-64-28.7-64-64V96zm128 32a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm0 " +
  "192a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm64-64a32 32 0 1 1 64 0 32 32 " +
  "0 1 1 -64 0zM320 128a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM288 352a32 32 " +
  "0 1 1 64 0 32 32 0 1 1 -64 0z";

export function Die({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="17"
      viewBox="0 0 450 510"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-[1em]", className)}
      {...props}
    >
      <path
        d={DIE_PATH}
        className="fill-blue-500 stroke-blue-700 dark:fill-blue-500-dark dark:stroke-blue-700-dark"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
