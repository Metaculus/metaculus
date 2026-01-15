import { ComponentProps } from "react";

import cn from "@/utils/core/cn";

import { ActivityCard } from "../components/activity-card";
import { QuestionLoader } from "../components/question-cards/question";
import { SectionHeader } from "../components/section";

export function ActivityMonitorSection({
  className,
  children,
  ...props
}: ComponentProps<"section">) {
  return (
    <section className={cn("xl:py-8", className)} {...props}>
      <SectionHeader className="mb-4 mt-0 md:mb-8 md:text-center">
        Activity Monitor
      </SectionHeader>

      {/* Activity Log */}
      <div className="grid gap-5 sm:gap-6 md:grid-cols-2 md:gap-8">
        <QuestionLoader
          questionId={14732}
          title="Projected employment growth relative to 2025"
          subtitle="Predictions update in real-time; track how forecasters adjust as AI progresses"
          className="md:order-2"
          variant="primary"
          preferTimeline
        />
        <div className="flex flex-col gap-2.5 md:order-1">
          <ActivityCard
            date="Nov 13, 2025"
            degradeIndex={0}
            content={
              <>
                <strong>📊 Update:</strong> 2030 employment projection declined
                1.3 percentage points in the week following the{" "}
                <strong>release of GPT-5</strong>.
              </>
            }
          />
          <ActivityCard
            date="Nov 11, 2025"
            degradeIndex={1}
            content={
              <>
                <strong>🧠 Forecaster insight:</strong>{" "}
                <em>
                  &quot;I expect creative and interpersonal roles to remain most
                  resistant to automation, though not immune.&quot;
                </em>
              </>
            }
          />
          <ActivityCard
            date="Oct 28, 2025"
            degradeIndex={2}
            content={
              <>
                <strong>📰 News:</strong> Amazon cuts global corporate workforce
                by 14,000, downsizing linked to AI.&quot; –{" "}
                <a href="#" className="underline hover:no-underline">
                  Reuters
                </a>
              </>
            }
          />
          <ActivityCard
            date="Oct 21, 2025"
            degradeIndex={3}
            content={
              <>
                <strong>📊 Update:</strong> Software developer 2035 employment
                projection falls 7 percentage points as forecasters assess
                recent coding demonstrations and benchmark progress.
              </>
            }
          />
          <button className="w-full rounded-md border border-blue-400 bg-blue-100 py-3 text-center text-lg font-medium leading-7 text-blue-800 hover:bg-blue-200 dark:border-blue-400-dark dark:bg-blue-100-dark dark:text-blue-800-dark dark:hover:bg-blue-200-dark">
            See all activity
          </button>
        </div>
      </div>
    </section>
  );
}
