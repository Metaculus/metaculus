const Stub: React.FC<{ selectedType: "base_rate" | "news" }> = ({
  selectedType,
}) => {
  return (
    <div className="w-[700px] text-sm text-gray-600 dark:text-gray-600-dark">
      {selectedType === "base_rate"
        ? "Base Rate form is coming soon."
        : "News form is coming soon."}
    </div>
  );
};

export default Stub;
