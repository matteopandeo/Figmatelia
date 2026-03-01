The stamp that appears after cutting MUST show EXACTLY the same portion of the photo that is visible through the punch tool window — nothing more, nothing less. Right now the clipped stamp does not match the preview. This is the most important fix.

Here is the correct logic:

1. PUNCH WINDOW BOUNDS: The punch tool has a transparent rectangular window in its center. Define its exact pixel coordinates relative to the viewport: { top, left, width, height }. This is the "cut area". Use a ref on the punch window element and call getBoundingClientRect() to get these values at cut time.

2. PHOTO TRANSFORM STATE: Track the user's photo manipulation as values:
   - translateX, translateY (from pan/drag)
   - scale (from pinch/zoom)
   - rotate (from two-finger rotate)

3. AT CUT TIME — when the user taps "Cut your stamp":
   a. Create an offscreen <canvas> element
   b. Get the punch window's bounding rect (the transparent opening in the punch tool)
   c. Get the photo element's bounding rect (its current visual position after user manipulation)
   d. Set canvas size to punch window dimensions × devicePixelRatio (for retina sharpness)
   e. Calculate the offset: where the photo sits relative to the punch window
   f. Draw the photo onto the canvas at that offset, so only the portion visible through the punch window is captured
   g. Export canvas.toDataURL('image/png') — this IS the stamp image

Here is the exact implementation:

function cutStamp() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Get punch window position (the transparent opening)
  const punchRect = punchWindowRef.current.getBoundingClientRect();
  
  // Get photo element current visual position (after all transforms)
  const photoEl = photoRef.current;  // the <img> element
  const photoRect = photoEl.getBoundingClientRect();
  
  // Canvas = punch window size (retina)
  const dpr = window.devicePixelRatio || 1;
  canvas.width = punchRect.width * dpr;
  canvas.height = punchRect.height * dpr;
  ctx.scale(dpr, dpr);
  
  // Photo offset relative to punch window
  const offsetX = photoRect.left - punchRect.left;
  const offsetY = photoRect.top - punchRect.top;
  
  // Draw photo at its current visual position relative to punch window
  ctx.drawImage(
    photoEl,
    offsetX,
    offsetY,
    photoRect.width,
    photoRect.height
  );
  
  return canvas.toDataURL('image/png');
}

CRITICAL: This stampDataUrl is what gets saved as imageData in the stamp object, displayed in Step 3, and shown in the Stampbook grid. The scalloped SVG clip-path is applied via CSS on top of this already-correctly-cropped image. Do NOT save or display the full original photo anywhere after cutting.

If the photo element has CSS rotation applied, use this enhanced version:

function cutStampWithRotation() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const punchRect = punchWindowRef.current.getBoundingClientRect();
  const photoEl = photoRef.current;
  const photoRect = photoEl.getBoundingClientRect();
  
  const dpr = window.devicePixelRatio || 1;
  canvas.width = punchRect.width * dpr;
  canvas.height = punchRect.height * dpr;
  ctx.scale(dpr, dpr);
  
  // Calculate photo center relative to punch window
  const photoCenterX = (photoRect.left + photoRect.width / 2) - punchRect.left;
  const photoCenterY = (photoRect.top + photoRect.height / 2) - punchRect.top;
  
  ctx.save();
  // Move to photo center, apply rotation, draw from center
  ctx.translate(photoCenterX, photoCenterY);
  ctx.rotate(currentRotation * Math.PI / 180);  // currentRotation from gesture state
  ctx.drawImage(
    photoEl,
    -photoRect.width / 2,
    -photoRect.height / 2,
    photoRect.width,
    photoRect.height
  );
  ctx.restore();
  
  return canvas.toDataURL('image/png');
}

Make sure punchWindowRef points to the actual transparent window area inside the punch tool — NOT the entire punch tool image. The ref should be on an invisible overlay div positioned exactly where the stamp-shaped opening is.