import svgPaths from "../../imports/svg-53u02dzvr3";

export function Header() {
  return (
    <div className="flex gap-[10px] items-end justify-center pt-[10px] pb-[10px] w-full">
      {/* Figmatelia logo */}
      <div className="relative shrink-0" style={{ width: "105.303px", height: "77px" }}>
        <svg
          className="block w-full h-full"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 105.303 76.9999"
        >
          <path d={svgPaths.p13a86d80} fill="#757575" />
        </svg>
      </div>
      {/* Tagline */}
      <div
        className="shrink-0 text-[#757575] opacity-60 whitespace-nowrap"
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: "32.25px",
          lineHeight: "normal",
          fontStyle: "normal",
          fontWeight: 400,
        }}
      >
        <p className="mb-0">Gonna stamp</p>
        <p> them all</p>
      </div>
    </div>
  );
}
