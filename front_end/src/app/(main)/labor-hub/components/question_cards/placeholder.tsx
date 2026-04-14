export function NoQuestionPlaceholder() {
  return (
    <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden rounded">
      {/* Ghost chart grid lines */}
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        {[0.2, 0.4, 0.6, 0.8].map((y) => (
          <line
            key={y}
            x1="0%"
            y1={`${y * 100}%`}
            x2="100%"
            y2={`${y * 100}%`}
            className="stroke-gray-400 dark:stroke-gray-400-dark"
            strokeDasharray="2 6"
            strokeLinecap="round"
            strokeWidth={1}
            opacity={0.4}
          />
        ))}
      </svg>

      {/* Content */}
      <div className="relative flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-500-dark">
          Question not available yet
        </p>
      </div>
    </div>
  );
}
