export function Rectangle({ ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="14"
      height="8"
      viewBox="0 0 14 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 0H14L7 8L0 0Z" />
    </svg>
  );
}
