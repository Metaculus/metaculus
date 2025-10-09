import {
  faBook,
  faBookOpen,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";

import AIBResourceCard from "./aib-info-resource-card";

const AIBInfoResources: React.FC = () => {
  return (
    <div className="space-y-8">
      <h4 className="m-0 text-center text-4xl font-bold text-blue-800 dark:text-blue-800-dark">
        Resources
      </h4>
      <div className="flex gap-6">
        {RESOURCES_DATA.map((resource, index) => (
          <AIBResourceCard
            key={index}
            icon={resource.icon}
            title={resource.title}
            description={resource.description}
          />
        ))}
      </div>
    </div>
  );
};

const RESOURCES_DATA = [
  {
    icon: faBook,
    title: "Full Benchmark Information",
    description: "Benchmark deep dive, scoring, analysis, etc",
  },
  {
    icon: faBookOpen,
    title: "Research Highlights",
    description: "Key findings and methodology papers from our research.",
  },
  {
    icon: faTrophy,
    title: "Full Leaderboards",
    description: "Complete rankings across all questions and time periods.",
  },
];

export default AIBInfoResources;
