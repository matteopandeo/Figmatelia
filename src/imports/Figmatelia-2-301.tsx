import svgPaths from "./svg-vw4j8a5dyr";
import imgGeminiGeneratedImageBj2Ixbj2Ixbj2Ixb1 from "figma:asset/005f14c479988123f230e03d4bbe68e67ece9192.png";

function Frame1() {
  return (
    <div className="absolute h-[39px] left-[313px] top-[93px] w-[80px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 80 39">
        <g id="Frame 5356" opacity="0.4">
          <line id="Line 1" stroke="var(--stroke-0, #757575)" x2="80" y1="19" y2="19" />
        </g>
      </svg>
    </div>
  );
}

function Frame() {
  return (
    <div className="-translate-x-1/2 absolute content-stretch flex gap-[10px] h-[142px] items-end justify-center left-[calc(50%+0.5px)] p-[10px] top-0 w-[403px]">
      <p className="font-['Instrument_Serif:Regular',sans-serif] leading-[normal] not-italic opacity-60 relative shrink-0 text-[#757575] text-[30px] text-center">1. Choose your image</p>
      <Frame1 />
    </div>
  );
}

function Group() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[40.5px] left-[calc(50%+0.25px)] top-[calc(50%-2.25px)] w-[44.5px]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 44.5 40.5">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.p3973cd80} fill="var(--fill-0, #757575)" fillRule="evenodd" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p2b677300} fill="var(--fill-0, #757575)" fillRule="evenodd" id="Vector_2" />
          <path clipRule="evenodd" d={svgPaths.p13504380} fill="var(--fill-0, #757575)" fillRule="evenodd" id="Vector_3" />
          <path d={svgPaths.p1608e180} fill="var(--fill-0, #757575)" id="Vector_4" />
        </g>
      </svg>
    </div>
  );
}

function ImagePlus() {
  return (
    <div className="absolute h-[280px] left-[93px] overflow-clip top-[282px] w-[204px]" data-name="image-plus 1">
      <Group />
    </div>
  );
}

export default function Figmatelia() {
  return (
    <div className="bg-[#f1f1ee] relative size-full" data-name="figmatelia">
      <Frame />
      <div className="absolute h-[70.197px] left-[113px] top-[-100px] w-[96px]" data-name="Figmatelia logo">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 95.9999 70.1974">
          <path d={svgPaths.p3f678c00} fill="var(--fill-0, #757575)" id="Figmatelia logo" />
        </svg>
      </div>
      <div className="absolute flex h-[478px] items-center justify-center left-[65px] top-[183px] w-[261px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="flex-none rotate-90">
          <div className="h-[261px] relative w-[478px]" data-name="Gemini_Generated_Image_bj2ixbj2ixbj2ixb 1">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img alt="" className="absolute h-full left-[-0.03%] max-w-none top-0 w-[100.05%]" src={imgGeminiGeneratedImageBj2Ixbj2Ixbj2Ixb1} />
            </div>
          </div>
        </div>
      </div>
      <ImagePlus />
    </div>
  );
}