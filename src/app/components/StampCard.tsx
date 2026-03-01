import svgPaths from "../../imports/svg-53u02dzvr3";

interface StampCardProps {
  isEmpty?: boolean;
  imageUrl?: string;
  onClick?: () => void;
  id: string;
  localOnly?: boolean;
}

export function StampCard({ isEmpty = true, imageUrl, onClick, id, localOnly = false }: StampCardProps) {
  const filterId = `stamp-shadow-${id}`;
  const clipId = `stamp-clip-${id}`;

  return (
    <button
      className="relative cursor-pointer bg-transparent border-none p-0 w-full"
      style={{ aspectRatio: "111 / 155" }}
      onClick={onClick}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 142.326 210.025"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="210.025"
            id={filterId}
            width="142.326"
            x="0"
            y="0"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="2.30734" />
            <feGaussianBlur stdDeviation="2.59576" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.105882 0 0 0 0 0.113725 0 0 0 0 0.109804 0 0 0 0.14 0"
            />
            <feBlend
              in2="BackgroundImageFix"
              mode="normal"
              result="effect1_dropShadow"
            />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="9.80619" />
            <feGaussianBlur stdDeviation="4.9031" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.105882 0 0 0 0 0.113725 0 0 0 0 0.109804 0 0 0 0.1 0"
            />
            <feBlend
              in2="effect1_dropShadow"
              mode="normal"
              result="effect2_dropShadow"
            />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="21.9197" />
            <feGaussianBlur stdDeviation="6.6336" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.105882 0 0 0 0 0.113725 0 0 0 0 0.109804 0 0 0 0.05 0"
            />
            <feBlend
              in2="effect2_dropShadow"
              mode="normal"
              result="effect3_dropShadow"
            />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="38.6479" />
            <feGaussianBlur stdDeviation="7.78727" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.105882 0 0 0 0 0.113725 0 0 0 0 0.109804 0 0 0 0.01 0"
            />
            <feBlend
              in2="effect3_dropShadow"
              mode="normal"
              result="effect4_dropShadow"
            />
            <feBlend
              in="SourceGraphic"
              in2="effect4_dropShadow"
              mode="normal"
              result="shape"
            />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feMorphology
              in="SourceAlpha"
              operator="erode"
              radius="2.88417"
              result="effect5_innerShadow"
            />
            <feOffset />
            <feGaussianBlur stdDeviation="5.76835" />
            <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.1 0"
            />
            <feBlend
              in2="shape"
              mode="normal"
              result="effect5_innerShadow"
            />
          </filter>
          <clipPath id={clipId}>
            <path d={svgPaths.p11cba400} />
          </clipPath>
        </defs>
        <g filter={`url(#${filterId})`}>
          <path
            d={svgPaths.p11cba400}
            stroke="black"
            strokeOpacity="0.15"
            strokeWidth="1.17965"
            fill={isEmpty ? "none" : "none"}
          />
        </g>
        {imageUrl && (
          <image
            href={imageUrl}
            x="5"
            y="3"
            width="132"
            height="152"
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
        )}
      </svg>
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="mt-[-70px]"
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
          >
            <path
              d="M8 16H24"
              stroke="#757575"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 8V24"
              stroke="#757575"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      {/* Local only badge */}
      {!isEmpty && localOnly && (
        <div
          className="absolute flex items-center gap-[3px] px-[5px] py-[2px] rounded-[6px]"
          style={{
            bottom: "8px",
            right: "6px",
            backgroundColor: "rgba(241, 241, 238, 0.85)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          {/* Cloud-off icon */}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#A0A09C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 2l20 20" />
            <path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193" />
            <path d="M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07" />
          </svg>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "8px",
              fontWeight: 500,
              color: "#A0A09C",
              lineHeight: 1,
            }}
          >
            local
          </span>
        </div>
      )}
    </button>
  );
}