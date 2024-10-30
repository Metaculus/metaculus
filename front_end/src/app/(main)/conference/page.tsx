"use client";

import Link from "next/link";

import Button from "@/components/ui/button";

export default function ConferencePage() {
  return (
    <main className="flex min-h-[calc(100vh-250px)] flex-col">
      <div className="flex flex-grow items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col items-center justify-center space-y-8">
            <h1 className="text-center text-3xl font-bold text-gray-800 md:text-4xl lg:text-5xl">
              Threshold 2030
            </h1>
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <Link href="/conference/threshold2030-day-one">
                <Button
                  className="w-full min-w-[200px] py-3 text-lg"
                  variant="primary"
                >
                  Day One
                </Button>
              </Link>
              <Link href="/conference/threshold2030-day-two">
                <Button
                  className="w-full min-w-[200px] py-3 text-lg"
                  variant="primary"
                >
                  Day Two
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
