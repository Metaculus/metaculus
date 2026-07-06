type Props = {
  items: Array<{ name: string; valueText: string }>;
};

const EmbedFanLegend: React.FC<Props> = ({ items }) => {
  if (!items.length) return null;

  return (
    <div className="mb-2.5 flex flex-wrap gap-2.5 max-[550px]:gap-1.5">
      {items.map((i) => (
        <div
          key={i.name}
          className="flex items-center gap-2.5 rounded-[4px] border border-olive-400 px-3 py-2 text-xs font-medium leading-[16px] text-olive-800 dark:border-olive-400-dark dark:text-olive-800-dark min-[440px]:text-sm"
        >
          <span>{i.name}</span>
          <span className="font-normal text-gray-800 dark:text-gray-800-dark">
            {i.valueText}
          </span>
        </div>
      ))}
    </div>
  );
};

export default EmbedFanLegend;
