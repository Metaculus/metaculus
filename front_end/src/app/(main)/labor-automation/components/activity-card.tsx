import cn from "@/utils/core/cn";

export function ActivityCard({
  date,
  content,
  degradeIndex = 0,
}: {
  date: string;
  content: React.ReactNode;
  degradeIndex: number;
}) {
  return (
    <div
      style={{ "--degrade-index": degradeIndex } as React.CSSProperties}
      className={cn(
        "rounded-lg border border-purple-400 bg-purple-200 px-3.5 py-3 [--tw-bg-opacity:max(0.2,1-var(--degrade-index)*0.2)] dark:border-purple-400-dark dark:bg-purple-200-dark dark:[--tw-bg-opacity:max(0.2,1-var(--degrade-index)*0.2)]"
      )}
    >
      <div className="mb-1 text-xs font-medium text-purple-700 dark:text-purple-700-dark">
        {date}
      </div>
      <div className="text-sm leading-normal text-purple-800 dark:text-purple-800-dark">
        {content}
      </div>
    </div>
  );
}
