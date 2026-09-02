export const OUTPUT_WIDTH = 3024;
export const OUTPUT_HEIGHT = 4032;
export const JPEG_QUALITY = 0.95;

export async function fileToImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Could not decode this image."));
      img.src = url;
    });
    return img;
  } finally {
    // caller has a decoded image by the time this runs
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export function renderCenterCrop(img) {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;
  const ctx = canvas.getContext("2d", { alpha: false });

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const srcRatio = img.naturalWidth / img.naturalHeight;
  const dstRatio = OUTPUT_WIDTH / OUTPUT_HEIGHT;

  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

  if (srcRatio > dstRatio) {
    sw = img.naturalHeight * dstRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / dstRatio;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
  return canvas;
}

export function canvasToJpegDataUrl(canvas) {
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
