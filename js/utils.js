export function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function copyBase64(dataUrl) {
  const base64 = dataUrl.split(",")[1] || "";
  await navigator.clipboard.writeText(base64);
}

export async function shareImage(dataUrl, filename) {
  if (!navigator.share) throw new Error("Web Share API is not supported on this device/browser.");
  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], filename, { type: "image/jpeg" });
  if (navigator.canShare && !navigator.canShare({ files: [file] })) {
    throw new Error("This browser cannot share image files.");
  }
  await navigator.share({ files: [file], title: "Converted photo" });
}

export function humanBytes(bytes) {
  const units = ["B","KB","MB","GB"];
  let value = bytes, i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `${value.toFixed(i ? 1 : 0)} ${units[i]}`;
}
