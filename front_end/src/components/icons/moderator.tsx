import cn from "@/utils/core/cn";

export function Moderator({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="17"
      viewBox="0 0 16 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-[1em]", className)}
      {...props}
    >
      <path
        d="M8.9413 16.1879L10.3119 15.2638C12.0642 14.0813 13.4204 12.4317 14.2145 10.5171C15.0086 8.60249 15.2059 6.50616 14.7823 4.48506C14.7614 4.38546 14.717 4.29184 14.6525 4.21145C14.588 4.13105 14.5052 4.06604 14.4105 4.02144L7.99995 1L1.5902 4.02144C1.49533 4.06594 1.41237 4.13091 1.34775 4.21132C1.28313 4.29172 1.2386 4.38539 1.2176 4.48506C0.794093 6.50624 0.991549 8.60262 1.78576 10.5172C2.57997 12.4318 3.93642 14.0814 5.68883 15.2638L7.05941 16.1879C7.33524 16.3739 7.66373 16.4737 8.00036 16.4737C8.33699 16.4737 8.66548 16.3739 8.9413 16.1879Z"
        className="fill-blue-300 stroke-blue-800 dark:fill-blue-300-dark dark:stroke-blue-800-dark"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.616 11V7.232C5.616 6.944 5.608 6.68 5.592 6.432L7.216 11H8.496L10.032 6.432C10.016 6.672 10.016 6.944 10.016 7.232V11H11.024V5.4H9.368L8 9.448C7.928 9.64 7.896 9.8 7.856 9.96C7.824 9.8 7.776 9.64 7.712 9.448L6.288 5.4H4.616V11H5.616Z"
        className="fill-blue-900 dark:fill-blue-900-dark"
      />
    </svg>
  );
}
