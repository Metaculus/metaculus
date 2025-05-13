import cn from "@/utils/core/cn";

export function Admin({ className, ...props }: React.SVGProps<SVGSVGElement>) {
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
        className="fill-blue-500 stroke-blue-700 dark:fill-blue-500-dark dark:stroke-blue-700-dark"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.931 12L8.763 4.3H7.113L3.945 12H5.485L6.266 9.899H9.544L10.314 12H11.931ZM7.597 6.28C7.718 5.972 7.817 5.708 7.916 5.389C8.004 5.708 8.092 5.961 8.213 6.28L9.093 8.678H6.717L7.597 6.28Z"
        className="fill-blue-100 dark:fill-blue-100-dark"
      />
    </svg>
  );
}
