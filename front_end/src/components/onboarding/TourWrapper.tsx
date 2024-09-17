"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import QuestionPageTour from "./QuestionPageTour";

const TourWrapper: React.FC = () => {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("tour") === "guided") {
      setIsTourOpen(true);
    }
  }, [searchParams]);

  const closeTour = () => {
    setIsTourOpen(false);
  };

  return <QuestionPageTour isOpen={isTourOpen} onClose={closeTour} />;
};

export default TourWrapper;