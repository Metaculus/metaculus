export const revalidate = 3600;

const BG = "#1d2733";

export default function OgMidtermsPage() {
  return (
    <div
      id="id-used-by-screenshot-donot-change"
      className="relative h-[630px] w-[1200px] overflow-hidden font-sans"
      style={{ backgroundColor: BG }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 20%, rgba(107,122,232,0.18), transparent 60%), radial-gradient(circle at 20% 80%, rgba(232,130,122,0.18), transparent 60%)",
        }}
      />
      <div
        id="id-logo-used-by-screenshot-donot-change"
        className="absolute inset-0 z-10 flex flex-col justify-between p-20"
      >
        <div
          className="text-[24px] font-medium tracking-[0.2em]"
          style={{ color: "#bfd4ec" }}
        >
          METACULUS
        </div>
        <div className="flex flex-col gap-8">
          <h1 className="m-0 text-[88px] font-bold leading-[1.05] tracking-[-0.03em]">
            <span style={{ color: "#d7e7f7" }}>2026 US</span>
            <br />
            <span style={{ color: "#6B7AE8" }}>Midterm Elections</span>
          </h1>
          <p
            className="m-0 max-w-[780px] text-balance text-[28px] leading-[1.35]"
            style={{ color: "#bfd4ec" }}
          >
            Real-time forecasts from the Metaculus community on the 2026 US
            midterm elections.
          </p>
        </div>
      </div>
    </div>
  );
}
