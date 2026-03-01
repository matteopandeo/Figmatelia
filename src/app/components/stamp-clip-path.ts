// Generate a scalloped/perforated stamp edge clip-path as an SVG path string.
// The path has semicircular concave notches along all four sides.
// Width x Height in pixels, notchRadius and notchCount control the scallops.
export function generateStampClipPath(
  w: number,
  h: number,
  notchRadius: number = 4,
  notchCountX: number = 9,
  notchCountY: number = 12
): string {
  const nr = notchRadius;
  const parts: string[] = [];

  // Margin from corners
  const cornerMargin = nr * 2;

  // Top edge (left to right)
  parts.push(`M ${cornerMargin} 0`);
  const topSpacing = (w - cornerMargin * 2) / notchCountX;
  for (let i = 0; i < notchCountX; i++) {
    const cx = cornerMargin + topSpacing * i + topSpacing / 2;
    const x1 = cornerMargin + topSpacing * i;
    const x2 = cornerMargin + topSpacing * (i + 1);
    parts.push(`L ${x1} 0`);
    parts.push(`A ${nr} ${nr} 0 0 1 ${x2} 0`);
    void cx; // used for arc center conceptually
  }
  parts.push(`L ${w - cornerMargin} 0`);

  // Top-right corner
  parts.push(`L ${w} 0 L ${w} ${cornerMargin}`);

  // Right edge (top to bottom)
  const rightSpacing = (h - cornerMargin * 2) / notchCountY;
  for (let i = 0; i < notchCountY; i++) {
    const y1 = cornerMargin + rightSpacing * i;
    const y2 = cornerMargin + rightSpacing * (i + 1);
    parts.push(`L ${w} ${y1}`);
    parts.push(`A ${nr} ${nr} 0 0 1 ${w} ${y2}`);
  }
  parts.push(`L ${w} ${h - cornerMargin}`);

  // Bottom-right corner
  parts.push(`L ${w} ${h} L ${w - cornerMargin} ${h}`);

  // Bottom edge (right to left)
  const bottomSpacing = (w - cornerMargin * 2) / notchCountX;
  for (let i = notchCountX - 1; i >= 0; i--) {
    const x2 = cornerMargin + bottomSpacing * (i + 1);
    const x1 = cornerMargin + bottomSpacing * i;
    parts.push(`L ${x2} ${h}`);
    parts.push(`A ${nr} ${nr} 0 0 1 ${x1} ${h}`);
  }
  parts.push(`L ${cornerMargin} ${h}`);

  // Bottom-left corner
  parts.push(`L 0 ${h} L 0 ${h - cornerMargin}`);

  // Left edge (bottom to top)
  const leftSpacing = (h - cornerMargin * 2) / notchCountY;
  for (let i = notchCountY - 1; i >= 0; i--) {
    const y2 = cornerMargin + leftSpacing * (i + 1);
    const y1 = cornerMargin + leftSpacing * i;
    parts.push(`L 0 ${y2}`);
    parts.push(`A ${nr} ${nr} 0 0 1 0 ${y1}`);
  }
  parts.push(`L 0 ${cornerMargin}`);

  // Top-left corner
  parts.push(`L 0 0 L ${cornerMargin} 0`);
  parts.push("Z");

  return parts.join(" ");
}

// Pre-computed stamp dimensions (3:4 portrait ratio)
export const STAMP_WIDTH = 120;
export const STAMP_HEIGHT = 160;
export const STAMP_CLIP_ID = "stamp-scallop-clip";
