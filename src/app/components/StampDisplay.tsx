import svgPaths from "../../imports/svg-53u02dzvr3";

/**
 * Renders a stamp image inside the proper scalloped stamp shape,
 * matching the StampCard appearance with white border, shadow, and clipped photo.
 * 
 * Uses the same SVG outline path as StampCard (p11cba400) for consistency.
 * The SVG viewBox is 142.326 x 210.025 with the image area inset.
 */

interface StampDisplayProps {
  imageUrl: string;
  /** CSS width of the stamp, e.g. "120px" or "180px". Height auto-calculated from aspect ratio. */
  width?: number;
  className?: string;
}

export function StampDisplay({ imageUrl, width = 120, className = "" }: StampDisplayProps) {
  // Original SVG viewBox dimensions
  const VB_W = 142.326;
  const VB_H = 210.025;
  const aspect = VB_H / VB_W;
  const height = width * aspect;

  const uniqueId = `stamp-display-${Math.random().toString(36).slice(2, 9)}`;
  const filterId = `${uniqueId}-shadow`;
  const clipId = `${uniqueId}-clip`;

  return (
    <div
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        flexShrink: 0,
      }}
    >
      <svg
        className="w-full h-full block"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height={VB_H}
            id={filterId}
            width={VB_W}
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
        {/* Stamp outline with shadow and white fill */}
        <g filter={`url(#${filterId})`}>
          <path
            d={svgPaths.p11cba400}
            fill="white"
            stroke="black"
            strokeOpacity="0.15"
            strokeWidth="1.17965"
          />
        </g>
        {/* Photo image clipped inside stamp shape, inset for white border */}
        <image
          href={imageUrl}
          x="0"
          y="0"
          width={VB_W}
          height={VB_H}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      </svg>
    </div>
  );
}