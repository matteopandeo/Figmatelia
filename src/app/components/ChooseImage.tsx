import { useRef } from "react";
import { useNavigate } from "react-router";
import svgPaths from "../../imports/svg-vw4j8a5dyr";
import imgPunchTool from "figma:asset/005f14c479988123f230e03d4bbe68e67ece9192.png";

export function ChooseImage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUrl = reader.result as string;
      // Store the selected image temporarily for Step 2
      sessionStorage.setItem("figmatelia-pending-image", imageDataUrl);
      navigate("/step2");
    };
    reader.readAsDataURL(file);
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div
      className="min-h-screen w-full flex justify-center"
      style={{ backgroundColor: "transparent" }}
    >
      <div
        className="relative w-full flex flex-col items-center"
        style={{ maxWidth: "403px" }}
      >
        {/* Back button */}
        <button
          onClick={handleBack}
          className="absolute left-[16px] top-[20px] z-10 cursor-pointer bg-transparent border-none p-[8px]"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M19 12H5"
              stroke="#757575"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 19L5 12L12 5"
              stroke="#757575"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Step label with horizontal lines */}
        <div
          className="flex items-center justify-center w-full"
          style={{ height: "10vh", padding: "10px" }}
        >
          {/* Left line */}
          

          {/* Label text */}
          <p
            className="shrink-0 text-center text-[#757575] opacity-60 px-[10px]"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "30px",
              lineHeight: "normal",
              fontStyle: "normal",
              fontWeight: 400,
            }}
          >Choose your image</p>

          {/* Right line */}
          
        </div>

        {/* Punch tool with upload icon */}
        <div
          className="relative flex items-center justify-center cursor-pointer"
          style={{ width: "261px", height: "478px", marginTop: "40px" }}
          onClick={handleUploadClick}
        >
          {/* Punch tool PNG — rotated 90° as in the Figma design */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex-none rotate-90">
              <div className="relative" style={{ width: "478px", height: "261px" }}>
                <img
                  alt="Stamp punch tool"
                  className="absolute h-full left-0 top-0 w-full"
                  src={imgPunchTool}
                  style={{ maxWidth: "none" }}
                />
              </div>
            </div>
          </div>

          {/* Upload icon (image-plus) centered in the punch window */}
          <div
            className="relative z-10 flex items-center justify-center"
            style={{ width: "204px", height: "280px", marginTop: "-4px" }}
          >
            <div style={{ width: "44.5px", height: "40.5px" }}>
              <svg
                className="block w-full h-full"
                fill="none"
                viewBox="0 0 44.5 40.5"
              >
                <path
                  clipRule="evenodd"
                  d={svgPaths.p3973cd80}
                  fill="#757575"
                  fillRule="evenodd"
                />
                <path
                  clipRule="evenodd"
                  d={svgPaths.p2b677300}
                  fill="#757575"
                  fillRule="evenodd"
                />
                <path
                  clipRule="evenodd"
                  d={svgPaths.p13504380}
                  fill="#757575"
                  fillRule="evenodd"
                />
                <path
                  d={svgPaths.p1608e180}
                  fill="#757575"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}