import svgPaths from "../../imports/svg-53u02dzvr3";

interface ShareButtonProps {
  onClick?: () => void;
  loading?: boolean;
}

export function ShareButton({ onClick, loading = false }: ShareButtonProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center pb-[28px] pt-[10px] pointer-events-none"
      style={{ maxWidth: "403px", margin: "0 auto" }}
    >
      <button
        className="pointer-events-auto relative flex items-center justify-center gap-[9.3px] pl-[10px] pr-[19px] py-[9.3px] rounded-[12px] cursor-pointer w-[239px]"
        style={{
          background: "rgba(232, 232, 232, 0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          opacity: loading ? 0.6 : 1,
          transition: "opacity 0.2s ease",
        }}
        onClick={loading ? undefined : onClick}
        disabled={loading}
      >
        {/* Outer border + shadow */}
        <div
          className="absolute pointer-events-none rounded-[12.776px]"
          style={{
            inset: "-0.776px",
            border: "0.776px solid #efefef",
            boxShadow:
              "0px 25.414px 10.241px 0px rgba(27,29,28,0.01), 0px 14.414px 8.724px 0px rgba(27,29,28,0.05), 0px 6.448px 6.448px 0px rgba(27,29,28,0.1), 0px 1.517px 3.414px 0px rgba(27,29,28,0.14)",
          }}
        />
        {/* Share icon */}
        <div className="relative shrink-0" style={{ width: "29.477px", height: "29.477px" }}>
          <svg
            className="block w-full h-full"
            viewBox="0 0 24.8871 24.8871"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d={svgPaths.p1123d800}
              stroke="#757575"
              strokeMiterlimit="10"
              strokeWidth="1.5514"
            />
            <path
              d={svgPaths.pd623f00}
              stroke="#757575"
              strokeMiterlimit="10"
              strokeWidth="1.5514"
            />
            <path
              d={svgPaths.p1dbecc00}
              stroke="#757575"
              strokeMiterlimit="10"
              strokeWidth="1.5514"
            />
            <path
              d={svgPaths.p2f17e180}
              stroke="#757575"
              strokeMiterlimit="10"
              strokeWidth="1.5514"
            />
            <path
              d={svgPaths.p1b213540}
              stroke="#757575"
              strokeMiterlimit="10"
              strokeWidth="1.5514"
            />
          </svg>
        </div>
        <p
          className="shrink-0 text-left text-[#757575]"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "31.03px",
            lineHeight: "normal",
            fontStyle: "normal",
            fontWeight: 400,
          }}
        >
          Share book link
        </p>
        {/* Inner glow */}
        <div
          className="absolute pointer-events-none rounded-[inherit]"
          style={{
            inset: "-0.776px",
            boxShadow: "inset 0px 0px 7.586px 0px rgba(255,255,255,0.1)",
          }}
        />
      </button>
    </div>
  );
}